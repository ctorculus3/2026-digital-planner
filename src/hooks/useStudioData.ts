import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface StudioStudent {
  student_user_id: string;
  display_name: string | null;
  streak: number;
  weekly_minutes: number;
  last_practice_date: string | null;
  joined_at: string;
}

export interface StudioInfo {
  id: string;
  studio_name: string;
  invite_code: string;
  max_students: number;
}

export function useStudioData() {
  const { user } = useAuth();
  const [studio, setStudio] = useState<StudioInfo | null>(null);
  const [students, setStudents] = useState<StudioStudent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStudio = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    // Fetch teacher's studio
    const { data: studioData } = await supabase
      .from("teacher_studios")
      .select("id, studio_name, invite_code, max_students")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!studioData) {
      setStudio(null);
      setStudents([]);
      setLoading(false);
      return;
    }

    setStudio(studioData as StudioInfo);

    // Fetch linked students
    const { data: links } = await supabase
      .from("teacher_students")
      .select("student_user_id, joined_at")
      .eq("studio_id", studioData.id)
      .eq("status", "active");

    if (!links || links.length === 0) {
      setStudents([]);
      setLoading(false);
      return;
    }

    const studentIds = links.map((l) => l.student_user_id);

    // Fetch profiles
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", studentIds);

    // Fetch streaks via RPC for each student
    const streakPromises = studentIds.map((id) =>
      supabase.rpc("get_practice_streak", { p_user_id: id }).then((r) => ({
        id,
        streak: (r.data as number) || 0,
      }))
    );

    // Fetch this week's practice time
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=Sun
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(today);
    monday.setDate(today.getDate() - mondayOffset);
    const mondayStr = monday.toISOString().split("T")[0];

    const { data: weekLogs } = await supabase
      .from("practice_logs")
      .select("user_id, total_time, log_date")
      .in("user_id", studentIds)
      .gte("log_date", mondayStr);

    const streakResults = await Promise.all(streakPromises);
    const streakMap = Object.fromEntries(streakResults.map((s) => [s.id, s.streak]));
    const profileMap = Object.fromEntries((profiles || []).map((p) => [p.id, p.display_name]));
    const linkMap = Object.fromEntries(links.map((l) => [l.student_user_id, l.joined_at]));

    // Calculate weekly minutes per student
    const weeklyMap: Record<string, number> = {};
    const lastPracticeMap: Record<string, string> = {};

    (weekLogs || []).forEach((log: any) => {
      // Parse interval string like "HH:MM:SS" to minutes
      const totalTime = log.total_time as string;
      if (totalTime) {
        const parts = totalTime.split(":");
        const hours = parseInt(parts[0]) || 0;
        const mins = parseInt(parts[1]) || 0;
        weeklyMap[log.user_id] = (weeklyMap[log.user_id] || 0) + hours * 60 + mins;
      }

      // Track most recent practice date
      if (!lastPracticeMap[log.user_id] || log.log_date > lastPracticeMap[log.user_id]) {
        lastPracticeMap[log.user_id] = log.log_date;
      }
    });

    const result: StudioStudent[] = studentIds.map((id) => ({
      student_user_id: id,
      display_name: profileMap[id] || null,
      streak: streakMap[id] || 0,
      weekly_minutes: weeklyMap[id] || 0,
      last_practice_date: lastPracticeMap[id] || null,
      joined_at: linkMap[id],
    }));

    setStudents(result);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchStudio();
  }, [fetchStudio]);

  const createStudio = async (studioName: string) => {
    const { data, error } = await supabase.rpc("create_teacher_studio", {
      p_studio_name: studioName,
    });
    if (error) throw error;
    const result = data as any;
    if (result?.error) throw new Error(result.error);
    await fetchStudio();
    return result;
  };

  const updateStudioName = async (newName: string) => {
    if (!studio) return;
    const { error } = await supabase
      .from("teacher_studios")
      .update({ studio_name: newName })
      .eq("id", studio.id);
    if (error) throw error;
    setStudio({ ...studio, studio_name: newName });
  };

  const removeStudent = async (studentUserId: string) => {
    if (!studio) return;
    const { error } = await supabase
      .from("teacher_students")
      .delete()
      .eq("studio_id", studio.id)
      .eq("student_user_id", studentUserId);
    if (error) throw error;
    await fetchStudio();
  };

  return { studio, students, loading, createStudio, updateStudioName, removeStudent, refetch: fetchStudio };
}
