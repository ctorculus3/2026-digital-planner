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
import { useState, useEffect, useRef } from "react";
import { PlanToggle } from "./PlanToggle";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams } from "react-router-dom";

interface SubscriptionGateProps {
  children: React.ReactNode;
}

export function SubscriptionGate({ children }: SubscriptionGateProps) {
  const { subscription, refreshSubscription, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  // Initialize from URL so we never flash the paywall when returning from Stripe
  const [processingCheckout, setProcessingCheckout] = useState(
    () => searchParams.get("checkout") === "success"
  );
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">("monthly");
  const { toast } = useToast();
  const pollingRef = useRef(false);
  const autoCheckoutTriggered = useRef(false);

  // Auto-redirect fresh sign-ups / sign-ins straight to Stripe checkout
  // so the flow is: Auth → Stripe → Dashboard with zero extra clicks.
  useEffect(() => {
    if (
      subscription.status === 'inactive' &&
      !autoCheckoutTriggered.current &&
      !loading &&
      !processingCheckout &&
      sessionStorage.getItem("fresh_auth") === "true"
    ) {
      autoCheckoutTriggered.current = true;
      sessionStorage.removeItem("fresh_auth");

      (async () => {
        try {
          const { data, error } = await supabase.functions.invoke("create-checkout", {
            body: { plan: "monthly" },
          });
          if (error) throw error;
          if (data?.url) {
            window.location.href = data.url;
          }
        } catch (err: any) {
          // Auto-redirect failed — the user will see the manual paywall below
          console.warn("Auto-checkout redirect failed:", err);
        }
      })();
    }
  }, [subscription.status, loading, processingCheckout]);

  // Handle post-checkout return: detect ?checkout=success and poll for active subscription
  useEffect(() => {
    const checkoutStatus = searchParams.get("checkout");
    
    if (checkoutStatus === "success" && !pollingRef.current) {
      pollingRef.current = true;
      setProcessingCheckout(true);

      // Clean up URL params immediately
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("checkout");
      setSearchParams(newParams, { replace: true });

      // Poll for subscription activation
      let attempts = 0;
      const maxAttempts = 8;
      const pollInterval = 2500;

      const poll = async () => {
        attempts++;
        await refreshSubscription();
        // We'll check subscription.status via the next render cycle
        // Set a timeout for the next attempt
        if (attempts < maxAttempts) {
          setTimeout(poll, pollInterval);
        } else {
          // Max attempts reached - stop polling
          setProcessingCheckout(false);
          pollingRef.current = false;
          toast({
            title: "Still processing",
            description: "Your subscription may take a moment to activate. Try refreshing in a few seconds.",
          });
        }
      };

      // Start polling after a short delay to let Stripe process
      setTimeout(poll, 1500);
    }

    if (checkoutStatus === "cancelled") {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("checkout");
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams, refreshSubscription, toast]);

  // Stop polling when subscription becomes active
  useEffect(() => {
    if (subscription.status === 'active' && processingCheckout) {
      setProcessingCheckout(false);
      pollingRef.current = false;
      toast({
        title: "Welcome! 🎉",
        description: "Your subscription is active. Enjoy your practice journal!",
      });
    }
  }, [subscription.status, processingCheckout, toast]);

  // Show processing state during post-checkout polling
  if (processingCheckout || (subscription.status === 'loading' && pollingRef.current)) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-muted-foreground">Processing your subscription...</p>
      </div>
    );
  }

  // Show loading spinner while checking subscription
  if (subscription.status === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // User has active subscription - show the app
  if (subscription.status === 'active') {
    return <>{children}</>;
  }

  // Show paywall for inactive subscription
  const handleSubscribe = async () => {
    setLoading(true);
    try {
      // Use fetch directly so we can read the response body on error
      const session = (await supabase.auth.getSession()).data.session;
      if (!session) throw new Error("Not authenticated");
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ plan: selectedPlan }),
        }
      );
      const body = await resp.json();
      if (!resp.ok) {
        throw new Error(body?.error || `HTTP ${resp.status}`);
      }
      if (body?.url) {
        window.location.href = body.url;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (error: any) {
      const msg = error?.message || "";
      if (msg.includes("already have an active subscription")) {
        toast({
          title: "You're already subscribed!",
          description: "Refreshing your subscription status...",
        });
        await refreshSubscription();
      } else {
        toast({
          title: "Error",
          description: msg || "Failed to start checkout",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Fixed: removed stale closure check. Just refresh and let React re-render.
  const handleRefresh = async () => {
    setRefreshing(true);
    toast({ title: "Checking subscription status..." });
    try {
      await refreshSubscription();
      // Don't check subscription.status here - it's stale in this closure.
      // The component will automatically re-render when status updates to 'active'.
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to check subscription status.",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

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
          <PlanToggle selectedPlan={selectedPlan} onPlanChange={setSelectedPlan} />
          
          <div className="text-center">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-4xl font-bold">
                {selectedPlan === "monthly" ? "$3.99" : "$39.99"}
              </span>
              <span className="text-muted-foreground">
                {selectedPlan === "monthly" ? "/month" : "/year"}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              <Sparkles className="w-4 h-4 inline mr-1" />
              7 days free, cancel anytime
            </p>
          </div>

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
            onClick={handleRefresh}
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
