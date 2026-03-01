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
import { Music2, GraduationCap, Sparkles, Check, CreditCard, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect, useRef } from "react";
import { PlanToggle } from "./PlanToggle";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useOnboardingSurvey } from "@/hooks/useOnboardingSurvey";

interface SubscriptionGateProps {
  children: React.ReactNode;
}

const studentFeatures = [
  "Daily practice logging",
  "Track scales, warmups & repertoire",
  "Built-in metronome, tuner & drone",
  "Music AI assistant",
  "Dashboard, streaks & badges",
  "Secure cloud storage",
];

const teacherFeatures = [
  "Everything in Student plan",
  "Create a private teaching studio",
  "Monitor student practice & streaks",
  "Set weekly assignments & comments",
  "Upload lesson PDFs for students",
];

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
  const [selectedTier, setSelectedTier] = useState<"student" | "teacher">("student");
  const { toast } = useToast();
  const navigate = useNavigate();
  const { completed: surveyCompleted } = useOnboardingSurvey();
  const pollingRef = useRef(false);
  const autoCheckoutTriggered = useRef(false);

  // Fresh sign-ups: redirect to onboarding survey first, then show plan picker.
  // No auto-checkout — users choose their tier on the paywall.
  useEffect(() => {
    if (
      subscription.status === 'inactive' &&
      !autoCheckoutTriggered.current &&
      !loading &&
      !processingCheckout &&
      surveyCompleted !== null &&
      sessionStorage.getItem("fresh_auth") === "true"
    ) {
      autoCheckoutTriggered.current = true;
      sessionStorage.removeItem("fresh_auth");

      // Survey not completed yet — redirect to onboarding first
      if (surveyCompleted === false) {
        navigate("/onboarding", { replace: true });
      }
      // Otherwise, fall through to show the plan picker paywall
    }
  }, [subscription.status, loading, processingCheckout, surveyCompleted, navigate]);

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
  const handleSubscribe = async (tier: "student" | "teacher") => {
    setLoading(true);
    setSelectedTier(tier);
    try {
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
          body: JSON.stringify({ plan: selectedPlan, tier }),
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

  const studentPrice = selectedPlan === "monthly" ? "$3.99" : "$39.99";
  const studentPeriod = selectedPlan === "monthly" ? "/mo" : "/yr";
  const teacherPrice = selectedPlan === "monthly" ? "$15.99" : "$159.99";
  const teacherPeriod = selectedPlan === "monthly" ? "/mo" : "/yr";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-3xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
            <Music2 className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="font-display text-2xl md:text-3xl font-bold">Choose Your Plan</h1>
          <p className="text-muted-foreground">Start your 7-day free trial and track your musical journey</p>
        </div>

        {/* Plan Toggle */}
        <div className="flex justify-center">
          <PlanToggle selectedPlan={selectedPlan} onPlanChange={setSelectedPlan} />
        </div>

        {/* Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Student Plan */}
          <Card
            className={`relative cursor-pointer transition-all shadow-elegant ${
              selectedTier === "student"
                ? "border-primary ring-2 ring-primary/20"
                : "border-border hover:border-primary/40"
            }`}
            onClick={() => setSelectedTier("student")}
          >
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Music2 className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="font-display text-xl mt-2">Student</CardTitle>
              <CardDescription>For musicians who practice</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-3xl font-bold">{studentPrice}</span>
                  <span className="text-muted-foreground text-sm">{studentPeriod}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  <Sparkles className="w-3 h-3 inline mr-1" />
                  7 days free, cancel anytime
                </p>
              </div>
              <div className="space-y-2.5">
                {studentFeatures.map((f) => (
                  <div key={f} className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-sm">{f}</span>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                size="lg"
                variant={selectedTier === "student" ? "default" : "outline"}
                onClick={(e) => { e.stopPropagation(); handleSubscribe("student"); }}
                disabled={loading}
              >
                {loading && selectedTier === "student" ? (
                  "Loading..."
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Start Free Trial
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>

          {/* Teacher Studio Plan */}
          <Card
            className={`relative cursor-pointer transition-all shadow-elegant ${
              selectedTier === "teacher"
                ? "border-primary ring-2 ring-primary/20"
                : "border-border hover:border-primary/40"
            }`}
            onClick={() => setSelectedTier("teacher")}
          >
            {/* Badge */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-accent text-white text-xs font-semibold px-3 py-1 rounded-full shadow-sm">
                FOR TEACHERS
              </span>
            </div>
            <CardHeader className="text-center pb-2 pt-8">
              <div className="mx-auto w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-accent" />
              </div>
              <CardTitle className="font-display text-xl mt-2">Teacher Studio</CardTitle>
              <CardDescription>For teachers who lead studios</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-3xl font-bold">{teacherPrice}</span>
                  <span className="text-muted-foreground text-sm">{teacherPeriod}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  <Sparkles className="w-3 h-3 inline mr-1" />
                  7 days free, cancel anytime
                </p>
              </div>
              <div className="space-y-2.5">
                {teacherFeatures.map((f) => (
                  <div key={f} className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-accent shrink-0" />
                    <span className="text-sm">{f}</span>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full bg-accent hover:bg-accent/90"
                size="lg"
                variant={selectedTier === "teacher" ? "default" : "outline"}
                onClick={(e) => { e.stopPropagation(); handleSubscribe("teacher"); }}
                disabled={loading}
              >
                {loading && selectedTier === "teacher" ? (
                  "Loading..."
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Start Free Trial
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Footer actions */}
        <div className="flex flex-col items-center gap-3">
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
        </div>
      </div>
    </div>
  );
}
