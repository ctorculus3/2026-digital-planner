import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Settings, Sparkles } from "lucide-react";
import { format } from "date-fns";

export function ManageSubscription() {
  const { subscription } = useAuth();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleManage = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      
      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to open subscription management",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!subscription.subscribed) return null;

  return (
    <div className="flex items-center gap-2">
      {subscription.isTrialing && (
        <Badge variant="secondary" className="gap-1">
          <Sparkles className="w-3 h-3" />
          Trial
        </Badge>
      )}
      {subscription.subscriptionEnd && (
        <span className="text-xs text-muted-foreground hidden sm:inline">
          {subscription.isTrialing ? "Trial ends" : "Renews"}: {format(new Date(subscription.subscriptionEnd), "MMM d")}
        </span>
      )}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleManage}
        disabled={loading}
        className="gap-1"
      >
        <Settings className="w-4 h-4" />
        <span className="hidden sm:inline">Manage</span>
      </Button>
    </div>
  );
}
