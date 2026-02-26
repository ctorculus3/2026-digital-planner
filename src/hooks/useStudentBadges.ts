import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Badge {
  id: string;
  badge_type: string;
  earned_at: string;
}

export function useStudentBadges(studentUserId: string) {
  const { data: badges = [], isLoading } = useQuery({
    queryKey: ["student-badges", studentUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_badges")
        .select("id, badge_type, earned_at")
        .eq("user_id", studentUserId);
      if (error) throw error;
      return (data as Badge[]) || [];
    },
    enabled: !!studentUserId,
  });

  return { badges, isLoading };
}
