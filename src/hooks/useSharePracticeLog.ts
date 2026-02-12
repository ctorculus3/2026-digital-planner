import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ShareData {
  id: string;
  share_token: string;
  expires_at: string | null;
  created_at: string;
}

export function useSharePracticeLog(practiceLogId: string | undefined) {
  const [isLoading, setIsLoading] = useState(false);
  const [shareData, setShareData] = useState<ShareData | null>(null);
  const { toast } = useToast();

  const fetchExistingShare = async () => {
    if (!practiceLogId) return null;

    setShareData(null);
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("shared_practice_logs")
        .select("id, share_token, expires_at, created_at")
        .eq("practice_log_id", practiceLogId)
        .or("expires_at.is.null,expires_at.gt.now()")
        .maybeSingle();

      if (error) throw error;
      setShareData(data);
      return data;
    } catch (error) {
      console.error("Error fetching share:", error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const createShare = async (expiresInDays: number | null) => {
    if (!practiceLogId) return null;

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const shareToken = crypto.randomUUID();
      const expiresAt = expiresInDays 
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
        : null;

      const { data, error } = await supabase
        .from("shared_practice_logs")
        .insert({
          practice_log_id: practiceLogId,
          share_token: shareToken,
          expires_at: expiresAt,
          created_by: user.id,
        })
        .select("id, share_token, expires_at, created_at")
        .single();

      if (error) throw error;

      setShareData(data);
      toast({
        title: "Link created!",
        description: "Your practice log can now be shared.",
      });
      return data;
    } catch (error) {
      console.error("Error creating share:", error);
      toast({
        title: "Error",
        description: "Failed to create share link.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const revokeShare = async () => {
    if (!shareData?.id) return false;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("shared_practice_logs")
        .delete()
        .eq("id", shareData.id);

      if (error) throw error;

      setShareData(null);
      toast({
        title: "Access revoked",
        description: "The share link no longer works.",
      });
      return true;
    } catch (error) {
      console.error("Error revoking share:", error);
      toast({
        title: "Error",
        description: "Failed to revoke share link.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const getShareUrl = () => {
    if (!shareData?.share_token) return null;
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    return `${supabaseUrl}/functions/v1/og-share?token=${shareData.share_token}`;
  };

  return {
    isLoading,
    shareData,
    fetchExistingShare,
    createShare,
    revokeShare,
    getShareUrl,
  };
}
