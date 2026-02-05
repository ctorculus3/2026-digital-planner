import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
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

interface InternalSubscriptionStatus extends SubscriptionStatus {
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  subscription: SubscriptionStatus;
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
  const [subscriptionInternal, setSubscriptionInternal] = useState<InternalSubscriptionStatus>({
    subscribed: false,
    productId: null,
    subscriptionEnd: null,
    isTrialing: false,
    loading: true,
    initialCheckDone: false,
  });

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

  const checkSubscription = useCallback(async () => {
    if (!session) {
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

    try {
      setSubscriptionInternal(prev => ({ ...prev, loading: true }));
      const { data, error } = await supabase.functions.invoke("check-subscription");
      
      if (error) {
        console.error("Error checking subscription:", error);
        setSubscriptionInternal(prev => ({ ...prev, loading: false, initialCheckDone: true }));
        return;
      }

      setSubscriptionInternal({
        subscribed: data.subscribed || false,
        productId: data.product_id || null,
        subscriptionEnd: data.subscription_end || null,
        isTrialing: data.is_trialing || false,
        loading: false,
        initialCheckDone: true,
      });
    } catch (error) {
      console.error("Error checking subscription:", error);
      setSubscriptionInternal(prev => ({ ...prev, loading: false, initialCheckDone: true }));
    }
  }, [session]);

  useEffect(() => {
    // Set up auth state listener BEFORE checking session
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch((error) => {
      console.error("Error getting session:", error);
      setLoading(false);
    });

    // Fallback timeout to prevent infinite loading on iOS/Safari
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 5000);

    return () => {
      authSubscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  // Check subscription when session changes
  useEffect(() => {
    if (session) {
      checkSubscription();
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
  }, [session, checkSubscription]);

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
      signUp, 
      signIn, 
      signOut, 
      checkSubscription 
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
