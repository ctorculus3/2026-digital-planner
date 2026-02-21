import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useTeacherComment(studioId: string | undefined, studentUserId: string, logDate: string) {
  const queryClient = useQueryClient();

  const { data: comment, isLoading } = useQuery({
    queryKey: ["teacher-comment", studioId, studentUserId, logDate],
    queryFn: async () => {
      if (!studioId) return null;
      const { data, error } = await (supabase as any)
        .from("teacher_comments")
        .select("*")
        .eq("studio_id", studioId)
        .eq("student_user_id", studentUserId)
        .eq("log_date", logDate)
        .maybeSingle();
      if (error) throw error;
      return data as { id: string; comment: string; created_at: string; updated_at: string } | null;
    },
    enabled: !!studioId && !!studentUserId && !!logDate,
  });

  const saveMutation = useMutation({
    mutationFn: async (commentText: string) => {
      if (!studioId) throw new Error("No studio");
      if (comment) {
        const { error } = await (supabase as any)
          .from("teacher_comments")
          .update({ comment: commentText })
          .eq("id", comment.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from("teacher_comments")
          .insert({
            studio_id: studioId,
            student_user_id: studentUserId,
            log_date: logDate,
            comment: commentText,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-comment", studioId, studentUserId, logDate] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!comment) return;
      const { error } = await (supabase as any)
        .from("teacher_comments")
        .delete()
        .eq("id", comment.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-comment", studioId, studentUserId, logDate] });
    },
  });

  return {
    comment: comment?.comment ?? null,
    isLoading,
    save: saveMutation.mutate,
    isSaving: saveMutation.isPending,
    remove: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  };
}

/** Hook for students to view teacher comments on their own logs */
export function useStudentTeacherComment(logDate: string) {
  const { data, isLoading } = useQuery({
    queryKey: ["student-teacher-comment", logDate],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("teacher_comments")
        .select("comment, studio_id, created_at")
        .eq("log_date", logDate);
      if (error) throw error;
      if (!data || (data as any[]).length === 0) return null;

      const row = (data as any[])[0];
      // Get teacher name from studio
      const { data: studio } = await supabase
        .from("teacher_studios")
        .select("user_id, studio_name")
        .eq("id", row.studio_id)
        .single();
      
      let teacherName = "Your Teacher";
      if (studio) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("id", studio.user_id)
          .single();
        if (profile?.display_name) teacherName = profile.display_name;
      }

      return {
        comment: row.comment as string,
        teacherName,
        studioName: studio?.studio_name || "",
        createdAt: row.created_at as string,
      };
    },
    enabled: !!logDate,
  });

  return { teacherComment: data ?? null, isLoading };
}
