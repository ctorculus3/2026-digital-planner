import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

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

  const fetchSubscription = useCallback(async (currentSession: Session | null) => {
    if (!currentSession) {
      setSubscription({ status: 'inactive', isTrialing: false, endDate: null });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("check-subscription", {
        headers: { Authorization: `Bearer ${currentSession.access_token}` },
      });

      if (error) {
        console.error("Subscription check error:", error);
        // On 401, sign out
        if ((error as any)?.status === 401) {
          await supabase.auth.signOut();
        }
        setSubscription({ status: 'inactive', isTrialing: false, endDate: null });
        return;
      }

      setSubscription({
        status: data?.subscribed ? 'active' : 'inactive',
        isTrialing: data?.is_trialing || false,
        endDate: data?.subscription_end || null,
      });
    } catch (error) {
      console.error("Subscription check failed:", error);
      setSubscription({ status: 'inactive', isTrialing: false, endDate: null });
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    // Set up auth state listener
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        if (!mounted) return;

        setSession(newSession);
        setUser(newSession?.user ?? null);
        setLoading(false);

        // Fetch subscription when auth state changes
        if (newSession) {
          setSubscription(prev => ({ ...prev, status: 'loading' }));
          await fetchSubscription(newSession);
        } else {
          setSubscription({ status: 'inactive', isTrialing: false, endDate: null });
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session: existingSession } }) => {
      if (!mounted) return;
      
      setSession(existingSession);
      setUser(existingSession?.user ?? null);
      setLoading(false);

      if (existingSession) {
        await fetchSubscription(existingSession);
      } else {
        setSubscription({ status: 'inactive', isTrialing: false, endDate: null });
      }
    });

    // Fallback timeout
    const timeout = setTimeout(() => {
      if (mounted && loading) {
        setLoading(false);
        setSubscription(prev => prev.status === 'loading' 
          ? { ...prev, status: 'inactive' } 
          : prev
        );
      }
    }, 5000);

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
        emailRedirectTo: window.location.origin,
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
