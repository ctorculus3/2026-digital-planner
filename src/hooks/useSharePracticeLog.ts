import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ShareData {
  id: string;
  share_token: string;
  expires_at: string | null;
  created_at: string;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const APP_ORIGIN = "https://id-preview--cd8351fe-3671-4983-92c3-c6d5206bddf5.lovable.app";
const OG_IMAGE_URL = `${SUPABASE_URL}/storage/v1/object/public/community-images/og/practice-daily-og.jpeg`;

function buildOgHtml(token: string, displayName: string, logDate: string | null): string {
  const description = logDate
    ? `Practice log shared by ${displayName} — ${logDate}`
    : `Practice log shared by ${displayName}`;
  const redirectUrl = `${APP_ORIGIN}/shared/${token}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Practice Daily</title>
  <meta name="description" content="${description}" />
  <meta property="og:title" content="Practice Daily" />
  <meta property="og:description" content="${description}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${redirectUrl}" />
  <meta property="og:image" content="${OG_IMAGE_URL}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="Practice Daily" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${OG_IMAGE_URL}" />
</head>
<body>
  <p>Redirecting to <a href="${redirectUrl}">Practice Daily</a>...</p>
  <script>window.location.replace("${redirectUrl}");</script>
</body>
</html>`;
}

export function useSharePracticeLog(practiceLogId: string | undefined) {
  const [isLoading, setIsLoading] = useState(false);
  const [shareData, setShareData] = useState<ShareData | null>(null);
  const { toast } = useToast();

  const fetchExistingShare = async () => {
    if (!practiceLogId) return null;

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

      // Insert share record
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

      // Fetch display name and log date for OG tags
      const [profileRes, logRes] = await Promise.all([
        supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
        supabase.from("practice_logs").select("log_date").eq("id", practiceLogId).maybeSingle(),
      ]);

      const displayName = profileRes.data?.display_name || "a musician";
      const logDate = logRes.data?.log_date
        ? new Date(logRes.data.log_date).toLocaleDateString("en-US", {
            month: "long", day: "numeric", year: "numeric",
          })
        : null;

      // Generate and upload static HTML for OG tags
      const html = buildOgHtml(shareToken, displayName, logDate);
      const htmlBlob = new Blob([html], { type: "text/html" });
      const htmlFile = new File([htmlBlob], `${shareToken}.html`, { type: "text/html" });

      const { error: uploadError } = await supabase.storage
        .from("community-images")
        .upload(`og-shares/${shareToken}.html`, htmlFile, {
          contentType: "text/html",
          upsert: true,
        });

      if (uploadError) {
        console.error("Failed to upload OG HTML:", uploadError);
        // Non-fatal — share still works, just without rich preview
      }

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
    const tokenToDelete = shareData.share_token;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("shared_practice_logs")
        .delete()
        .eq("id", shareData.id);

      if (error) throw error;

      // Clean up the OG HTML file (best-effort)
      await supabase.storage
        .from("community-images")
        .remove([`og-shares/${tokenToDelete}.html`]);

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
    return `${SUPABASE_URL}/storage/v1/object/public/community-images/og-shares/${shareData.share_token}.html`;
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
