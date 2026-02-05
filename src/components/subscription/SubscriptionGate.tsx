import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Music2, Sparkles, Check, CreditCard, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLocation, useNavigate } from "react-router-dom";

interface SubscriptionGateProps {
  children: React.ReactNode;
}

export function SubscriptionGate({ children }: SubscriptionGateProps) {
  const { subscription, checkSubscription, user, session, subscriptionDebug } = useAuth();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const debugEnabled = useMemo(() => new URLSearchParams(location.search).get("debug") === "1", [location.search]);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout");
      
      if (error) throw error;
      
      if (data?.url) {
        // Try redirect first, fallback to window.open
        console.log("Redirecting to Stripe checkout:", data.url);
        try {
          window.location.href = data.url;
        } catch (e) {
          // Fallback: open in new tab
          window.open(data.url, "_blank", "noopener,noreferrer");
        }
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to start checkout",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshSubscription = async () => {
    setRefreshing(true);
    try {
      const isSubscribed = await checkSubscription();
      if (isSubscribed) {
        toast({
          title: "Subscription verified!",
          description: "Redirecting to your journal...",
        });
        // Use navigate instead of reload for Safari compatibility
        navigate("/", { replace: true });
        // Force a small state change to trigger re-render
        window.location.replace(window.location.pathname);
      } else {
        toast({
          title: "No active subscription found",
          description: "Please start your free trial or check that you're signed in with the correct account.",
          variant: "destructive",
        });
        setRefreshing(false);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to check subscription status. Please try again.",
        variant: "destructive",
      });
      setRefreshing(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn("Sign out error:", e);
    }
    // Force hard navigation to /auth
    window.location.replace("/auth");
  };

  // Failsafe: if no user/session after initial check, redirect to auth
  // This handles Safari edge cases where ProtectedRoute may not have redirected
  useEffect(() => {
    if (subscription.initialCheckDone && !user) {
      navigate("/auth", { replace: true });
    }
  }, [subscription.initialCheckDone, user, navigate]);

  // Show loading only until initial subscription check completes
  if (!subscription.initialCheckDone) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // No user - should redirect via effect above, but show nothing while redirecting
  if (!user) {
    return null;
  }

  // User has active subscription - show the app
  if (subscription.subscribed) {
    return <>{children}</>;
  }

  // Show paywall
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-elegant border-primary/20">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
            <Music2 className="w-8 h-8 text-primary-foreground" />
          </div>
          <CardTitle className="font-display text-2xl">Unlock Your Practice Journal</CardTitle>
          <CardDescription>
            Start your 7-day free trial and track your musical journey
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-4xl font-bold">$3.99</span>
              <span className="text-muted-foreground">/month</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              <Sparkles className="w-4 h-4 inline mr-1" />
              7 days free, cancel anytime
            </p>
          </div>

          {debugEnabled && (
            <div className="rounded-md border border-border bg-muted/40 p-3 text-xs">
              <div className="font-medium">Diagnostics (debug=1)</div>
              <div className="mt-2 grid gap-1">
                <div>route: {location.pathname}</div>
                <div>user: {user ? "present" : "null"}</div>
                <div>session: {session ? "present" : "null"}</div>
                <div>initialCheckDone: {String(subscription.initialCheckDone)}</div>
                <div>subscribed: {String(subscription.subscribed)}</div>
                <div>trialing: {String(subscription.isTrialing)}</div>
                <div>last check: {subscriptionDebug.lastCheckedAt ?? "(never)"}</div>
                <div>last http: {subscriptionDebug.lastHttpStatus ?? "(unknown)"}</div>
                <div>last error: {subscriptionDebug.lastErrorMessage ?? "(none)"}</div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-primary" />
              <span className="text-sm">Daily practice logging</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-primary" />
              <span className="text-sm">Track scales, warmups & repertoire</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-primary" />
              <span className="text-sm">Set goals and monitor progress</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-primary" />
              <span className="text-sm">Secure cloud storage</span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <Button 
            className="w-full" 
            size="lg" 
            onClick={handleSubscribe}
            disabled={loading}
          >
            {loading ? (
              "Loading..."
            ) : (
              <>
                <CreditCard className="w-4 h-4 mr-2" />
                Start Free Trial
              </>
            )}
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleRefreshSubscription}
            disabled={refreshing}
            className="text-muted-foreground"
          >
            {refreshing ? "Checking..." : "Already subscribed? Refresh status"}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleSignOut}
            className="text-muted-foreground"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign out / switch account
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
