import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useUserRole() {
  const { user } = useAuth();
  const [isModerator, setIsModerator] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsModerator(false);
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    const fetchRoles = async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      if (error) {
        console.error("Error fetching user roles:", error);
        setLoading(false);
        return;
      }

      const roles = (data || []).map((r: any) => r.role);
      setIsModerator(roles.includes("moderator") || roles.includes("admin"));
      setIsAdmin(roles.includes("admin"));
      setLoading(false);
    };

    fetchRoles();
  }, [user]);

  return { isModerator, isAdmin, loading };
}
