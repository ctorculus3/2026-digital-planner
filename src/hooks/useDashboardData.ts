import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Badge {
  id: string;
  badge_type: string;
  earned_at: string;
}

const BADGE_THRESHOLDS = [
  { type: "streak_10", threshold: 10 },
  { type: "streak_30", threshold: 30 },
  { type: "streak_50", threshold: 50 },
  { type: "streak_100", threshold: 100 },
] as const;

export function useDashboardData(viewYear: number, viewMonth: number) {
  const { user } = useAuth();
  const [practicedDates, setPracticedDates] = useState<string[]>([]);
  const [streak, setStreak] = useState(0);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      const [datesRes, streakRes, badgesRes] = await Promise.all([
        supabase.rpc("get_practiced_dates", {
          p_user_id: user.id,
          p_year: viewYear,
          p_month: viewMonth,
        }),
        supabase.rpc("get_practice_streak", {
          p_user_id: user.id,
        }),
        supabase
          .from("user_badges")
          .select("*")
          .eq("user_id", user.id),
      ]);

      if (datesRes.data) {
        setPracticedDates(datesRes.data as unknown as string[]);
      }

      if (streakRes.data !== null && streakRes.data !== undefined) {
        const currentStreak = streakRes.data as number;
        setStreak(currentStreak);

        // Auto-award badges
        if (badgesRes.data) {
          const earnedTypes = new Set(badgesRes.data.map((b: Badge) => b.badge_type));
          for (const { type, threshold } of BADGE_THRESHOLDS) {
            if (currentStreak >= threshold && !earnedTypes.has(type)) {
              await supabase.from("user_badges").insert({
                user_id: user.id,
                badge_type: type,
              });
            }
          }
        }
      }

      // Re-fetch badges after potential inserts
      const { data: updatedBadges } = await supabase
        .from("user_badges")
        .select("*")
        .eq("user_id", user.id);

      if (updatedBadges) {
        setBadges(updatedBadges as Badge[]);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, [user, viewYear, viewMonth]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { practicedDates, streak, badges, loading, refetch: fetchData };
}
