import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface WeeklyReport {
  id: string;
  user_id: string;
  week_start: string;
  week_end: string;
  total_minutes: number;
  session_count: number;
  streak_at_generation: number;
  category_breakdown: Record<string, number>;
  pieces_practiced: string[];
  ai_insight: string | null;
  ai_next_week_focus: string | null;
  badges_earned: string[];
  share_image_path: string | null;
  community_post_id: string | null;
  created_at: string;
}

export function useWeeklyReport() {
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  /**
   * Fetch the most recent report (or a specific week) from the DB.
   */
  const fetchReport = useCallback(async (weekStart?: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      let query = supabase
        .from("weekly_reports")
        .select("*")
        .eq("user_id", session.user.id)
        .order("week_start", { ascending: false })
        .limit(1);

      if (weekStart) {
        query = supabase
          .from("weekly_reports")
          .select("*")
          .eq("user_id", session.user.id)
          .eq("week_start", weekStart)
          .limit(1);
      }

      const { data, error: fetchError } = await query.maybeSingle();
      if (fetchError) throw fetchError;
      setReport(data as WeeklyReport | null);
    } catch (err) {
      console.error("Failed to fetch report:", err);
      setError("Failed to load report");
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Generate a new report by calling the Edge Function.
   */
  const generateReport = useCallback(async (weekStart?: string) => {
    setGenerating(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const res = await fetch(
        `${supabaseUrl}/functions/v1/generate-practice-report`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ week_start: weekStart }),
        }
      );

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Failed to generate report");
      }

      if (result.success === false) {
        setError(result.error);
        toast({
          title: "No practice data",
          description: result.error,
          variant: "destructive",
        });
        return null;
      }

      setReport(result.report as WeeklyReport);
      toast({
        title: "Report generated!",
        description: "Your weekly practice report is ready.",
      });
      return result.report as WeeklyReport;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to generate report";
      console.error("Generate report error:", err);
      setError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      return null;
    } finally {
      setGenerating(false);
    }
  }, [toast]);

  /**
   * Update the report's share_image_path or community_post_id after sharing.
   */
  const updateReport = useCallback(async (
    reportId: string,
    updates: { share_image_path?: string; community_post_id?: string }
  ) => {
    const { error: updateError } = await supabase
      .from("weekly_reports")
      .update(updates)
      .eq("id", reportId);

    if (updateError) {
      console.error("Failed to update report:", updateError);
    }
  }, []);

  return {
    report,
    loading,
    generating,
    error,
    fetchReport,
    generateReport,
    updateReport,
  };
}
