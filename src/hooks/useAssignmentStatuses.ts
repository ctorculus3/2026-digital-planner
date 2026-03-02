import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfWeek, format } from "date-fns";

export type AssignmentStatus = "sent" | "draft" | null;

/**
 * Fetch the current week's assignment status for every student in a studio.
 * Returns a map: studentUserId → "sent" | "draft" | null
 */
export function useAssignmentStatuses(studioId: string | undefined) {
  const monday = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekStart = format(monday, "yyyy-MM-dd");

  const { data: statuses = {}, isLoading } = useQuery({
    queryKey: ["assignment-statuses", studioId, weekStart],
    queryFn: async () => {
      if (!studioId) return {};
      const { data, error } = await supabase
        .from("weekly_assignments")
        .select("student_user_id, status")
        .eq("studio_id", studioId)
        .eq("week_start", weekStart);
      if (error) throw error;

      const map: Record<string, AssignmentStatus> = {};
      for (const row of data || []) {
        map[row.student_user_id] = (row as any).status as AssignmentStatus;
      }
      return map;
    },
    enabled: !!studioId,
  });

  return { statuses, isLoading, weekStart };
}
