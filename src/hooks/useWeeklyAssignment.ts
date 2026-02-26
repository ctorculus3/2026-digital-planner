import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfWeek, format } from "date-fns";
import { useCallback } from "react";

export interface WeeklyAssignmentData {
  goals?: string | null;
  subgoals?: string | null;
  repertoire?: string[];
  warmups?: string[];
  scales?: string[];
  additional_tasks?: string[];
  ear_training?: string[];
  youtube_links?: string[];
  notes?: string | null;
}

/** Teacher hook: CRUD assignments for a student */
export function useTeacherAssignment(studioId: string | undefined, studentUserId: string, weekStart: string) {
  const queryClient = useQueryClient();

  const { data: assignment, isLoading } = useQuery({
    queryKey: ["weekly-assignment", studioId, studentUserId, weekStart],
    queryFn: async () => {
      if (!studioId) return null;
      const { data, error } = await supabase
        .from("weekly_assignments")
        .select("*")
        .eq("studio_id", studioId)
        .eq("student_user_id", studentUserId)
        .eq("week_start", weekStart)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!studioId && !!studentUserId && !!weekStart,
  });

  const buildRow = (payload: WeeklyAssignmentData) => ({
    studio_id: studioId!,
    student_user_id: studentUserId,
    week_start: weekStart,
    goals: payload.goals || null,
    subgoals: payload.subgoals || null,
    repertoire: payload.repertoire?.filter(r => r.trim()) || [],
    warmups: payload.warmups?.filter(w => w.trim()) || [],
    scales: payload.scales?.filter(s => s.trim()) || [],
    additional_tasks: payload.additional_tasks?.filter(t => t.trim()) || [],
    ear_training: payload.ear_training?.filter(e => e.trim()) || [],
    youtube_links: payload.youtube_links?.filter(l => l.trim()) || [],
    notes: payload.notes || null,
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: WeeklyAssignmentData) => {
      if (!studioId) throw new Error("No studio");
      const row = { ...buildRow(payload), status: assignment?.status || "draft" };
      const { error } = await supabase
        .from("weekly_assignments")
        .upsert(row, { onConflict: "studio_id,student_user_id,week_start" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weekly-assignment", studioId, studentUserId, weekStart] });
    },
  });

  const sendMutation = useMutation({
    mutationFn: async (payload: WeeklyAssignmentData) => {
      if (!studioId) throw new Error("No studio");
      const row = { ...buildRow(payload), status: "sent" as const };
      const { error } = await supabase
        .from("weekly_assignments")
        .upsert(row, { onConflict: "studio_id,student_user_id,week_start" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weekly-assignment", studioId, studentUserId, weekStart] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!assignment?.id) return;
      const { error } = await supabase
        .from("weekly_assignments")
        .delete()
        .eq("id", assignment.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weekly-assignment", studioId, studentUserId, weekStart] });
    },
  });

  /** Ensure the assignment row exists (upsert minimal row) and return its ID */
  const ensureAssignment = useCallback(async (): Promise<string> => {
    if (assignment?.id) return assignment.id;
    if (!studioId) throw new Error("No studio");

    const { error: upsertError } = await supabase
      .from("weekly_assignments")
      .upsert(
        { studio_id: studioId, student_user_id: studentUserId, week_start: weekStart },
        { onConflict: "studio_id,student_user_id,week_start" }
      );
    if (upsertError) throw upsertError;

    const { data, error: selectError } = await supabase
      .from("weekly_assignments")
      .select("id")
      .eq("studio_id", studioId)
      .eq("student_user_id", studentUserId)
      .eq("week_start", weekStart)
      .single();
    if (selectError || !data) throw selectError || new Error("Failed to retrieve assignment");

    queryClient.invalidateQueries({ queryKey: ["weekly-assignment", studioId, studentUserId, weekStart] });
    return data.id;
  }, [assignment?.id, studioId, studentUserId, weekStart, queryClient]);

  return {
    assignment,
    isLoading,
    save: saveMutation.mutate,
    isSaving: saveMutation.isPending,
    send: sendMutation.mutate,
    isSending: sendMutation.isPending,
    remove: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
    ensureAssignment,
  };
}

/** Student hook: fetch current week's assignment for pre-fill */
export function useStudentAssignment(logDate: Date) {
  const monday = startOfWeek(logDate, { weekStartsOn: 1 });
  const weekStart = format(monday, "yyyy-MM-dd");

  const { data: assignment, isLoading } = useQuery({
    queryKey: ["my-weekly-assignment", weekStart],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("weekly_assignments")
        .select("*")
        .eq("week_start", weekStart)
        .eq("status", "sent")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  return { assignment, isLoading };
}
