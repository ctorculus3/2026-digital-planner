import { createContext, useContext, useEffect, useState, useRef, ReactNode, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { notifySubscriberEvent } from "@/lib/notifySubscriberEvent";

type SubscriptionStatus = 'loading' | 'active' | 'inactive';

interface Subscription {
  status: SubscriptionStatus;
  isTrialing: boolean;
  endDate: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  subscription: Subscription;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription>({
    status: 'loading',
    isTrialing: false,
    endDate: null,
  });

  // Flag to prevent duplicate subscription checks during initialization
  const initialSessionLoaded = useRef(false);
  // Generation counter to prevent stale subscription results from racing calls
  const fetchIdRef = useRef(0);
  // Track previous subscription status to detect cancellation
  const prevSubStatusRef = useRef<SubscriptionStatus>('loading');
  // Track previous trialing state to detect upgrade (trial -> paid)
  const prevIsTrialingRef = useRef(false);
  const fetchSubscription = useCallback(async (currentSession: Session | null) => {
    const myId = ++fetchIdRef.current;

    if (!currentSession) {
      if (myId === fetchIdRef.current) {
        setSubscription({ status: 'inactive', isTrialing: false, endDate: null });
      }
      return;
    }

    const attempt = async (): Promise<boolean> => {
      try {
        const { data, error } = await supabase.functions.invoke("check-subscription", {
          headers: { Authorization: `Bearer ${currentSession.access_token}` },
        });

        // Stale check — a newer call has started, discard this result
        if (myId !== fetchIdRef.current) return true;

        if (error) {
          console.warn("Subscription check error:", error);
          if ((error as any)?.status === 401) {
            await supabase.auth.signOut();
            setSubscription({ status: 'inactive', isTrialing: false, endDate: null });
            return true;
          }
          return false;
        }

        const newStatus: SubscriptionStatus = data?.subscribed ? 'active' : 'inactive';

        // Detect cancellation: active -> inactive
        if (prevSubStatusRef.current === 'active' && newStatus === 'inactive') {
          const userEmail = currentSession.user?.email;
          if (userEmail) {
            notifySubscriberEvent(currentSession, {
              event: "cancel",
              email: userEmail,
            });
          }
        }

        // Detect upgrade: active+trialing -> active+not trialing
        const newIsTrialing = data?.is_trialing || false;
        if (
          prevSubStatusRef.current === 'active' &&
          prevIsTrialingRef.current === true &&
          newStatus === 'active' &&
          newIsTrialing === false
        ) {
          const userEmail = currentSession.user?.email;
          if (userEmail) {
            notifySubscriberEvent(currentSession, {
              event: "upgrade",
              email: userEmail,
            });
          }
        }

        prevSubStatusRef.current = newStatus;
        prevIsTrialingRef.current = newIsTrialing;

        setSubscription({
          status: newStatus,
          isTrialing: data?.is_trialing || false,
          endDate: data?.subscription_end || null,
        });
        return true;
      } catch (error) {
        if (myId !== fetchIdRef.current) return true;
        console.warn("Subscription check failed:", error);
        return false;
      }
    };

    const firstAttemptOk = await attempt();
    if (!firstAttemptOk && myId === fetchIdRef.current) {
      console.warn("Subscription check: retrying in 1s...");
      await new Promise((resolve) => setTimeout(resolve, 1000));
      if (myId !== fetchIdRef.current) return; // Superseded during wait
      const retryOk = await attempt();
      if (!retryOk && myId === fetchIdRef.current) {
        console.error("Subscription check: retry also failed, setting inactive");
        setSubscription({ status: 'inactive', isTrialing: false, endDate: null });
      }
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    // Detect if we're returning from an OAuth redirect or email verification
    // In that case, keep loading=true longer to let onAuthStateChange process the session
    const hash = window.location.hash;
    const search = window.location.search;
    const isAuthRedirect =
      hash.includes('access_token') ||
      hash.includes('refresh_token') ||
      search.includes('code=') ||
      search.includes('from=oauth') ||
      hash.includes('type=signup') ||
      hash.includes('type=recovery') ||
      sessionStorage.getItem('oauth_in_progress') === 'true';

    // For auth redirects, use a longer timeout to give the session time to establish
    const fallbackMs = isAuthRedirect ? 8000 : 5000;

    // Set up auth state listener FIRST
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        if (!mounted) return;

        setSession(newSession);
        setUser(newSession?.user ?? null);
        setLoading(false);

        if (newSession) {
          sessionStorage.removeItem('oauth_in_progress');
        }

        // Only fetch subscription if initial session has already been loaded
        // This prevents duplicate calls during initialization
        if (initialSessionLoaded.current) {
          if (newSession) {
            setSubscription(prev => ({ ...prev, status: 'loading' }));
            await fetchSubscription(newSession);
          } else {
            setSubscription({ status: 'inactive', isTrialing: false, endDate: null });
          }
        }
      }
    );

    // Check for existing session - this is the single source of truth on init
    supabase.auth.getSession().then(async ({ data: { session: existingSession } }) => {
      if (!mounted) return;
      
      // Mark initial session as loaded so future onAuthStateChange events
      // will trigger subscription checks
      initialSessionLoaded.current = true;

      setSession(existingSession);
      setUser(existingSession?.user ?? null);

      if (existingSession) {
        // Session found — stop loading and fetch subscription
        setLoading(false);
        await fetchSubscription(existingSession);
      } else if (isAuthRedirect) {
        // No session yet but we're on an auth redirect — keep loading=true
        // and let onAuthStateChange handle it (the fallback timeout will catch failures)
        console.log("Auth redirect detected, waiting for session...");
      } else {
        // No session, no redirect — stop loading
        setLoading(false);
        setSubscription({ status: 'inactive', isTrialing: false, endDate: null });
      }
    });

    // Fallback timeout
    const timeout = setTimeout(() => {
      if (mounted && loading) {
        sessionStorage.removeItem('oauth_in_progress');
        setLoading(false);
        setSubscription(prev => prev.status === 'loading' 
          ? { ...prev, status: 'inactive' } 
          : prev
        );
      }
    }, fallbackMs);

    return () => {
      mounted = false;
      authSub.unsubscribe();
      clearTimeout(timeout);
    };
  }, [fetchSubscription]);

  const signUp = async (email: string, password: string, displayName?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { 
        emailRedirectTo: `${window.location.origin}/auth?verified=true`,
        data: { display_name: displayName },
      },
    });
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const refreshSubscription = useCallback(async () => {
    if (session) {
      setSubscription(prev => ({ ...prev, status: 'loading' }));
      await fetchSubscription(session);
    }
  }, [session, fetchSubscription]);

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      subscription,
      signUp,
      signIn,
      signOut,
      refreshSubscription,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
