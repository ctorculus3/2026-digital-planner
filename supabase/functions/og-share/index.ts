import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // Default OG values
  let ogTitle = "Practice Daily";
  let ogDescription = "See your practice come to life";
  let redirectPath = "/";

  if (token) {
    redirectPath = `/shared/${token}`;

    try {
      const supabase = createClient(supabaseUrl, serviceRoleKey);

      // Look up share token to get sharer name and log date
      const { data: shareRows } = await supabase
        .from("shared_practice_logs")
        .select("practice_log_id, created_by, expires_at")
        .eq("share_token", token)
        .maybeSingle();

      if (shareRows && (!shareRows.expires_at || new Date(shareRows.expires_at) > new Date())) {
        // Get sharer display name
        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("id", shareRows.created_by)
          .maybeSingle();

        // Get log date
        const { data: log } = await supabase
          .from("practice_logs")
          .select("log_date")
          .eq("id", shareRows.practice_log_id)
          .maybeSingle();

        const name = profile?.display_name || "a musician";
        const date = log?.log_date
          ? new Date(log.log_date).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })
          : "";

        ogDescription = date
          ? `Practice log shared by ${name} — ${date}`
          : `Practice log shared by ${name}`;
      }
    } catch (err) {
      console.error("og-share lookup error:", err);
      // Fall through with defaults
    }
  }

  // Derive the app origin from the Referer header if available, otherwise use preview URL
  const referer = req.headers.get("referer");
  let appOrigin: string;
  if (referer) {
    try {
      const refUrl = new URL(referer);
      appOrigin = refUrl.origin;
    } catch {
      appOrigin = "https://id-preview--cd8351fe-3671-4983-92c3-c6d5206bddf5.lovable.app";
    }
  } else {
    appOrigin = "https://id-preview--cd8351fe-3671-4983-92c3-c6d5206bddf5.lovable.app";
  }
  const ogImage = `${appOrigin}/images/practice-daily-og.jpeg`;
  const redirectUrl = `${appOrigin}${redirectPath}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${ogTitle}</title>
  <meta name="description" content="${ogDescription}" />
  <meta property="og:title" content="${ogTitle}" />
  <meta property="og:description" content="${ogDescription}" />
  <meta property="og:type" content="website" />
  <meta property="og:image" content="${ogImage}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${ogTitle}" />
  <meta name="twitter:description" content="${ogDescription}" />
  <meta name="twitter:image" content="${ogImage}" />
  <meta http-equiv="refresh" content="0;url=${redirectUrl}" />
</head>
<body>
  <p>Redirecting to <a href="${redirectUrl}">Practice Daily</a>...</p>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
});
