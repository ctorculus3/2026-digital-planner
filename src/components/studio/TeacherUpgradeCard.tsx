import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GraduationCap, Check, CreditCard, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PlanToggle } from "@/components/subscription/PlanToggle";

export function TeacherUpgradeCard() {
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">("monthly");
  const { toast } = useToast();

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { plan: selectedPlan, tier: "teacher" },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (error: any) {
      const msg = error?.message || "";
      if (msg.includes("already have an active subscription")) {
        toast({
          title: "You already have an active subscription",
          description: "Manage your plan from your account settings.",
        });
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

  return (
    <div className="flex items-center justify-center py-10">
      <Card className="w-full max-w-md shadow-elegant border-primary/20">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
            <GraduationCap className="w-8 h-8 text-primary-foreground" />
          </div>
          <CardTitle className="font-display text-2xl">Teacher Studio Plan</CardTitle>
          <CardDescription>
            Upgrade to create your studio, invite students, and manage assignments.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <PlanToggle selectedPlan={selectedPlan} onPlanChange={setSelectedPlan} />

          <div className="text-center">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-4xl font-bold">
                {selectedPlan === "monthly" ? "$15.99" : "$159.99"}
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
              <span className="text-sm">Everything in the Student plan</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-primary" />
              <span className="text-sm">Create a private teaching studio</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-primary" />
              <span className="text-sm">Monitor student practice & streaks</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-primary" />
              <span className="text-sm">Set weekly assignments & leave comments</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-primary" />
              <span className="text-sm">Upload lesson PDFs for students</span>
            </div>
          </div>
        </CardContent>

        <CardFooter>
          <Button
            className="w-full"
            size="lg"
            onClick={handleUpgrade}
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
        </CardFooter>
      </Card>
    </div>
  );
}
