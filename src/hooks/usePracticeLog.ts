import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export interface PracticeLogData {
  goals: string;
  subgoals: string;
  start_time: string | null;
  stop_time: string | null;
  total_time: string | null;
  warmups: string[];
  scales: string[];
  repertoire: string[];
  repertoire_completed: boolean[];
  repertoire_recordings: string[];
  technique: string;
  musicianship: string;
  notes: string;
  metronome_used: boolean;
}

export function usePracticeLog(date: Date) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const dateString = format(date, "yyyy-MM-dd");

  const { data: practiceLog, isLoading } = useQuery({
    queryKey: ["practice-log", dateString, user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from("practice_logs")
        .select("*")
        .eq("user_id", user.id)
        .eq("log_date", dateString)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const saveMutation = useMutation({
    mutationFn: async (logData: PracticeLogData) => {
      if (!user) throw new Error("Not authenticated");

      const payload = {
        user_id: user.id,
        log_date: dateString,
        goals: logData.goals || null,
        subgoals: logData.subgoals || null,
        start_time: logData.start_time || null,
        stop_time: logData.stop_time || null,
        total_time: logData.total_time || null,
        warmups: logData.warmups.filter(w => w.trim()),
        scales: logData.scales.filter(s => s.trim()),
        repertoire: logData.repertoire.filter(r => r.trim()),
        repertoire_completed: logData.repertoire_completed,
        repertoire_recordings: logData.repertoire_recordings,
        technique: logData.technique || null,
        musicianship: logData.musicianship || null,
        notes: logData.notes || null,
        metronome_used: logData.metronome_used,
      };

      const { error } = await supabase
        .from("practice_logs")
        .upsert(payload, { onConflict: "user_id,log_date" });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["practice-log", dateString] });
      toast({
        title: "Saved",
        description: "Your practice log has been saved.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error saving",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    practiceLog,
    isLoading,
    save: saveMutation.mutate,
    isSaving: saveMutation.isPending,
  };
}
