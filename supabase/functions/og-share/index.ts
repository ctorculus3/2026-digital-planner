import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return new Response("Missing token", { status: 400 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const { data, error } = await supabase.rpc("lookup_shared_practice_log", {
    p_share_token: token,
  });

  if (error || !data || data.length === 0) {
    const html = `<!DOCTYPE html>
<html><head><title>Link expired or invalid</title></head>
<body><p>This shared practice log link is no longer available.</p></body></html>`;
    return new Response(html, {
      status: 404,
      headers: {
        "Content-Type": "application/xhtml+xml; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
        ...corsHeaders,
      },
    });
  }

  const row = data[0];
  const name = row.sharer_display_name || "A musician";

  // Absolute redirect URL for real browsers
  const appOrigin = "https://id-preview--cd8351fe-3671-4983-92c3-c6d5206bddf5.lovable.app";
  const redirectUrl = `${appOrigin}/shared/${token}`;

  // OG image from public storage bucket (accessible to crawlers)
  const ogImageUrl = `${SUPABASE_URL}/storage/v1/object/public/community-images/og/practice-daily-og.jpeg`;

  const title = `Practice Log by ${name}`;
  const description = `Check out this practice session shared on Practice Daily.`;

  const html = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${ogImageUrl}" />
  <meta property="og:type" content="website" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${ogImageUrl}" />
  <meta http-equiv="refresh" content="0;url=${redirectUrl}" />
</head>
<body>
  <p>Redirecting…</p>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "application/xhtml+xml; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-cache",
      ...corsHeaders,
    },
  });
});
