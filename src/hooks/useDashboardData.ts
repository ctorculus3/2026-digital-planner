import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Badge {
  id: string;
  badge_type: string;
  earned_at: string;
}

export interface PracticeTime {
  today: number;
  thisWeek: number;
  thisMonth: number;
  total: number;
}

const BADGE_THRESHOLDS = [
  { type: "streak_10", threshold: 10 },
  { type: "streak_30", threshold: 30 },
  { type: "streak_50", threshold: 50 },
  { type: "streak_100", threshold: 100 },
] as const;

function parseIntervalToMinutes(interval: unknown): number {
  if (!interval || typeof interval !== "string") return 0;
  const match = interval.match(/^(\d+):(\d+):(\d+)$/);
  if (!match) return 0;
  return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
}

function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday start
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function useDashboardData(viewYear: number, viewMonth: number) {
  const { user } = useAuth();
  const [practicedDates, setPracticedDates] = useState<string[]>([]);
  const [streak, setStreak] = useState(0);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [practiceTime, setPracticeTime] = useState<PracticeTime>({ today: 0, thisWeek: 0, thisMonth: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      const [datesRes, streakRes, badgesRes, timeRes] = await Promise.all([
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
        supabase
          .from("practice_logs")
          .select("total_time, log_date")
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

      // Calculate practice time buckets
      if (timeRes.data) {
        const now = new Date();
        const todayStr = now.toISOString().slice(0, 10);
        const weekStart = getStartOfWeek(now);
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        let today = 0, thisWeek = 0, thisMonth = 0, total = 0;
        for (const log of timeRes.data) {
          const mins = parseIntervalToMinutes(log.total_time);
          if (mins === 0) continue;
          total += mins;
          const logDate = new Date(log.log_date + "T00:00:00");
          if (log.log_date === todayStr) today += mins;
          if (logDate >= weekStart) thisWeek += mins;
          if (logDate >= monthStart) thisMonth += mins;
        }
        setPracticeTime({ today, thisWeek, thisMonth, total });
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

  return { practicedDates, streak, badges, practiceTime, loading, refetch: fetchData };
}
