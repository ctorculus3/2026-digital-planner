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
  checkSubscription: () => Promise<boolean>;
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

  const checkSubscription = useCallback(async (forceSession?: Session | null): Promise<boolean> => {
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
      return false;
    }

    // Prevent concurrent checks
    if (checkInProgressRef.current) {
      return false;
    }
    checkInProgressRef.current = true;

    try {
      setSubscriptionInternal((prev) => ({ ...prev, loading: true }));

      // Safari/iOS can produce AbortError for fetches (especially when the page is backgrounded
      // or during rapid navigation). We'll:
      // 1) Ensure the access token is fresh when near expiry
      // 2) Retry the function call once if it fails with an AbortError

      const getFreshAccessToken = async () => {
        let accessToken = currentSession.access_token;

        try {
          const payloadPart = accessToken.split(".")[1];
          if (payloadPart) {
            const tokenPayload = JSON.parse(atob(payloadPart));
            const expiresAt = Number(tokenPayload?.exp) * 1000;
            if (Number.isFinite(expiresAt)) {
              const msUntilExpiry = expiresAt - Date.now();
              if (msUntilExpiry < 60_000) {
                console.log("[AuthContext] Token near expiry, refreshing...");
                const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
                if (refreshError) throw refreshError;
                if (refreshData.session?.access_token) {
                  accessToken = refreshData.session.access_token;
                  sessionRef.current = refreshData.session;
                }
              }
            }
          }
        } catch (e) {
          // If decoding fails, fall back to using the current token and let the backend validate.
          console.warn("[AuthContext] Unable to decode token payload; continuing", e);
        }

        return accessToken;
      };

      const invokeCheck = async () => {
        const accessToken = await getFreshAccessToken();
        return await supabase.functions.invoke("check-subscription", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
      };

      let result = await invokeCheck();

      // One retry for Safari AbortError
      if (result.error && (result.error as any)?.name === "FunctionsFetchError") {
        const ctxName = (result.error as any)?.context?.name;
        const ctxMsg = (result.error as any)?.context?.message;
        const isAbort = ctxName === "AbortError" || ctxMsg === "The operation was aborted.";
        if (isAbort) {
          console.warn("[AuthContext] check-subscription aborted; retrying once...");
          await new Promise((r) => setTimeout(r, 350));
          result = await invokeCheck();
        }
      }

      const { data, error } = result;

      if (error) {
        const httpStatus = (error as any)?.status ?? null;
        setSubscriptionDebug({
          lastCheckedAt: new Date().toISOString(),
          lastHttpStatus: typeof httpStatus === "number" ? httpStatus : null,
          lastErrorMessage: error.message ?? "Unknown error",
        });

        console.error("Error checking subscription:", error);
        setSubscriptionInternal((prev) => ({ ...prev, loading: false, initialCheckDone: true }));
        return false;
      }

      setSubscriptionDebug({
        lastCheckedAt: new Date().toISOString(),
        lastHttpStatus: 200,
        lastErrorMessage: null,
      });

      const isSubscribed = data.subscribed || false;
      
      setSubscriptionInternal({
        subscribed: isSubscribed,
        productId: data.product_id || null,
        subscriptionEnd: data.subscription_end || null,
        isTrialing: data.is_trialing || false,
        loading: false,
        initialCheckDone: true,
      });
      
      return isSubscribed;
    } catch (error) {
      setSubscriptionDebug({
        lastCheckedAt: new Date().toISOString(),
        lastHttpStatus: null,
        lastErrorMessage: error instanceof Error ? error.message : String(error),
      });
      console.error("Error checking subscription:", error);
      setSubscriptionInternal((prev) => ({ ...prev, loading: false, initialCheckDone: true }));
      return false;
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

    // Check for existing session (Safari can AbortError sporadically; retry once)
    const getSessionWithRetry = async () => {
      try {
        return await supabase.auth.getSession();
      } catch (e: any) {
        const isAbort = e?.name === "AbortError" || e?.message === "The operation was aborted.";
        if (!isAbort) throw e;
        console.warn("[AuthContext] getSession aborted; retrying once...");
        await new Promise((r) => setTimeout(r, 200));
        return await supabase.auth.getSession();
      }
    };

    getSessionWithRetry().then(async ({ data: { session: existingSession } }) => {
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
  // Pause when the page is hidden (Safari may abort background fetches).
  useEffect(() => {
    if (!session) return;

    let interval: number | undefined;

    const start = () => {
      if (interval) return;
      interval = window.setInterval(() => {
        if (!document.hidden) {
          checkSubscription();
        }
      }, 60000);
    };

    const stop = () => {
      if (!interval) return;
      window.clearInterval(interval);
      interval = undefined;
    };

    const onVisibility = () => {
      if (document.hidden) stop();
      else start();
    };

    start();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
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
