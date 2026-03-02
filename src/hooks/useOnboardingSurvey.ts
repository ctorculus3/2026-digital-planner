import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface SurveyData {
  instruments: string[];
  skill_level: string;
  practice_frequency: string;
  practice_goal: string;
  referral_source: string;
}

export function useOnboardingSurvey() {
  const { user } = useAuth();
  const [completed, setCompleted] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const checkCompletion = useCallback(async () => {
    if (!user) {
      setCompleted(null);
      return;
    }
    const { data, error } = await (supabase as any)
      .from("onboarding_surveys")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Error checking survey:", error);
      setCompleted(false);
      return;
    }
    setCompleted(!!data);
  }, [user]);

  useEffect(() => {
    checkCompletion();
  }, [checkCompletion]);

  const submitSurvey = useCallback(async (survey: SurveyData) => {
    if (!user) return false;
    setSubmitting(true);
    try {
      const { error } = await (supabase as any)
        .from("onboarding_surveys")
        .insert({
          user_id: user.id,
          ...survey,
        });
      if (error) throw error;
      setCompleted(true);
      return true;
    } catch (err) {
      console.error("Error submitting survey:", err);
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [user]);

  return { completed, submitting, submitSurvey };
}
