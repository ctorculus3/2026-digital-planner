import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useUserStreak() {
  const { user } = useAuth();
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchStreak = useCallback(async () => {
    if (!user) {
      setStreak(0);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.rpc("get_practice_streak", {
        p_user_id: user.id,
      });

      if (!error && data !== null && data !== undefined) {
        setStreak(data as number);
      }
    } catch (err) {
      console.error("Error fetching streak:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchStreak();
  }, [fetchStreak]);

  return { streak, loading, refetch: fetchStreak };
}
