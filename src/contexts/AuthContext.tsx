import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface SubscriptionStatus {
  subscribed: boolean;
  productId: string | null;
  subscriptionEnd: string | null;
  isTrialing: boolean;
  loading: boolean;
  initialCheckDone: boolean;
}


interface SubscriptionDebugInfo {
  lastCheckedAt: string | null;
  lastHttpStatus: number | null;
  lastErrorMessage: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  subscription: SubscriptionStatus;
  subscriptionDebug: SubscriptionDebugInfo;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  checkSubscription: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscriptionDebug, setSubscriptionDebug] = useState<SubscriptionDebugInfo>({
    lastCheckedAt: null,
    lastHttpStatus: null,
    lastErrorMessage: null,
  });
  const [subscriptionInternal, setSubscriptionInternal] = useState<SubscriptionStatus>({
    subscribed: false,
    productId: null,
    subscriptionEnd: null,
    isTrialing: false,
    loading: true,
    initialCheckDone: false,
  });
  
  // Use ref to track the current session for subscription checks
  // This avoids stale closure issues
  const sessionRef = useRef<Session | null>(null);
  const checkInProgressRef = useRef(false);

  // Expose only the public interface
  const subscription: SubscriptionStatus = {
    subscribed: subscriptionInternal.subscribed,
    productId: subscriptionInternal.productId,
    subscriptionEnd: subscriptionInternal.subscriptionEnd,
    isTrialing: subscriptionInternal.isTrialing,
    // Only show loading on initial check, not periodic refreshes
    loading: subscriptionInternal.loading && !subscriptionInternal.initialCheckDone,
    initialCheckDone: subscriptionInternal.initialCheckDone,
  };

  const checkSubscription = useCallback(async (forceSession?: Session | null) => {
    // Use provided session or current ref
    const currentSession = forceSession !== undefined ? forceSession : sessionRef.current;

    if (!currentSession) {
      setSubscriptionDebug({
        lastCheckedAt: new Date().toISOString(),
        lastHttpStatus: null,
        lastErrorMessage: "No session (signed out)",
      });
      setSubscriptionInternal({
        subscribed: false,
        productId: null,
        subscriptionEnd: null,
        isTrialing: false,
        loading: false,
        initialCheckDone: true,
      });
      return;
    }

    // Prevent concurrent checks
    if (checkInProgressRef.current) {
      return;
    }
    checkInProgressRef.current = true;

    try {
      setSubscriptionInternal((prev) => ({ ...prev, loading: true }));

      // Safari/iOS can have stale tokens in memory. Always refresh the session first
      // to ensure we have a valid, fresh access token.
      let accessToken = currentSession.access_token;
      
      // Check if token might be stale (within 60 seconds of expiry or already expired)
      const tokenPayload = JSON.parse(atob(accessToken.split('.')[1]));
      const expiresAt = tokenPayload.exp * 1000;
      const now = Date.now();
      const tokenAge = expiresAt - now;
      
      if (tokenAge < 60000) {
        // Token is about to expire or already expired - force refresh
        console.log("[AuthContext] Token near expiry, refreshing...");
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          console.error("[AuthContext] Failed to refresh session:", refreshError);
          throw new Error(`Session refresh failed: ${refreshError.message}`);
        }
        if (refreshData.session) {
          accessToken = refreshData.session.access_token;
          sessionRef.current = refreshData.session;
        }
      }

      const { data, error } = await supabase.functions.invoke("check-subscription", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (error) {
        const httpStatus = (error as any)?.status ?? null;
        setSubscriptionDebug({
          lastCheckedAt: new Date().toISOString(),
          lastHttpStatus: typeof httpStatus === "number" ? httpStatus : null,
          lastErrorMessage: error.message ?? "Unknown error",
        });

        console.error("Error checking subscription:", error);
        setSubscriptionInternal((prev) => ({ ...prev, loading: false, initialCheckDone: true }));
        return;
      }

      setSubscriptionDebug({
        lastCheckedAt: new Date().toISOString(),
        lastHttpStatus: 200,
        lastErrorMessage: null,
      });

      setSubscriptionInternal({
        subscribed: data.subscribed || false,
        productId: data.product_id || null,
        subscriptionEnd: data.subscription_end || null,
        isTrialing: data.is_trialing || false,
        loading: false,
        initialCheckDone: true,
      });
    } catch (error) {
      setSubscriptionDebug({
        lastCheckedAt: new Date().toISOString(),
        lastHttpStatus: null,
        lastErrorMessage: error instanceof Error ? error.message : String(error),
      });
      console.error("Error checking subscription:", error);
      setSubscriptionInternal((prev) => ({ ...prev, loading: false, initialCheckDone: true }));
    } finally {
      checkInProgressRef.current = false;
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    
    // Set up auth state listener BEFORE checking session
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        if (!mounted) return;
        
        sessionRef.current = newSession;
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        // Check subscription immediately with the new session
        if (newSession) {
          await checkSubscription(newSession);
        } else {
          setSubscriptionInternal({
            subscribed: false,
            productId: null,
            subscriptionEnd: null,
            isTrialing: false,
            loading: false,
            initialCheckDone: true,
          });
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session: existingSession } }) => {
      if (!mounted) return;
      
      // Only process if we haven't already gotten a session from onAuthStateChange
      if (sessionRef.current === null) {
        sessionRef.current = existingSession;
        setSession(existingSession);
        setUser(existingSession?.user ?? null);
        
        if (existingSession) {
          await checkSubscription(existingSession);
        } else {
          setSubscriptionInternal({
            subscribed: false,
            productId: null,
            subscriptionEnd: null,
            isTrialing: false,
            loading: false,
            initialCheckDone: true,
          });
        }
        
        setLoading(false);
      }
    }).catch((error) => {
      if (!mounted) return;
      console.error("Error getting session:", error);
      setLoading(false);
      setSubscriptionInternal(prev => ({ ...prev, loading: false, initialCheckDone: true }));
    });

    // Fallback timeout to prevent infinite loading on iOS/Safari
    const timeout = setTimeout(() => {
      if (!mounted) return;
      setLoading(false);
      // Also mark subscription check as done to prevent stuck loading
      setSubscriptionInternal(prev => {
        if (!prev.initialCheckDone) {
          return { ...prev, loading: false, initialCheckDone: true };
        }
        return prev;
      });
    }, 5000);

    return () => {
      mounted = false;
      authSubscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [checkSubscription]);

  // Update ref when session changes externally
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  // Periodically refresh subscription status (every 60 seconds)
  useEffect(() => {
    if (!session) return;

    const interval = setInterval(() => {
      checkSubscription();
    }, 60000);

    return () => clearInterval(interval);
  }, [session, checkSubscription]);

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      subscription,
      subscriptionDebug,
      signUp,
      signIn,
      signOut,
      checkSubscription,
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
