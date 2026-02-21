import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface StudentStudioInfo {
  studio_id: string;
  studio_name: string;
  teacher_name: string | null;
}

export function useStudentStudio() {
  const { user } = useAuth();
  const [studioInfo, setStudioInfo] = useState<StudentStudioInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMembership = useCallback(async () => {
    if (!user) {
      setStudioInfo(null);
      setLoading(false);
      return;
    }

    const { data: membership } = await supabase
      .from("teacher_students")
      .select("studio_id")
      .eq("student_user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (!membership) {
      setStudioInfo(null);
      setLoading(false);
      return;
    }

    const { data: studio } = await supabase
      .from("teacher_studios")
      .select("id, studio_name, user_id")
      .eq("id", membership.studio_id)
      .maybeSingle();

    if (!studio) {
      setStudioInfo(null);
      setLoading(false);
      return;
    }

    // Get teacher's display name
    const { data: teacherProfile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", studio.user_id)
      .maybeSingle();

    setStudioInfo({
      studio_id: studio.id,
      studio_name: studio.studio_name,
      teacher_name: teacherProfile?.display_name || null,
    });
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchMembership();
  }, [fetchMembership]);

  const joinStudio = async (inviteCode: string) => {
    const { data, error } = await supabase.rpc("join_studio_by_code", {
      p_invite_code: inviteCode,
    });
    if (error) throw error;
    const result = data as any;
    if (result?.error) throw new Error(result.error);
    await fetchMembership();
    return result;
  };

  const leaveStudio = async () => {
    if (!user || !studioInfo) return;
    const { error } = await supabase
      .from("teacher_students")
      .delete()
      .eq("student_user_id", user.id)
      .eq("studio_id", studioInfo.studio_id);
    if (error) throw error;
    setStudioInfo(null);
  };

  return { studioInfo, loading, joinStudio, leaveStudio, refetch: fetchMembership };
}
