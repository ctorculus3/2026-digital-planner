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
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface SubscriptionGateProps {
  children: React.ReactNode;
}

export function SubscriptionGate({ children }: SubscriptionGateProps) {
  const { subscription, refreshSubscription, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

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
      const { data, error } = await supabase.functions.invoke("create-checkout");
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
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

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshSubscription();
      if (subscription.status !== 'active') {
        toast({
          title: "No active subscription found",
          description: "Please start your free trial or check your account.",
          variant: "destructive",
        });
      }
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
