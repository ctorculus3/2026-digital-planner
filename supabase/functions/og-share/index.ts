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
        "Content-Type": "text/html; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
        ...corsHeaders,
      },
    });
  }

  const row = data[0];
  const name = row.sharer_display_name || "A musician";

  // The preview app origin for redirecting real browsers
  const appOrigin = SUPABASE_URL.replace(
    ".supabase.co",
    ".supabase.co"
  );
  // We redirect to the published/preview app origin which is separate from the Supabase URL
  // Use a relative redirect so it works regardless of deploy domain
  const redirectPath = `/shared/${token}`;

  // OG image — use the published app's static asset
  // Crawlers resolve relative URLs against the page URL (the edge function URL),
  // so we need an absolute URL. We'll use the Supabase storage or a known app domain.
  // Since we don't know the app domain at runtime, we use the static asset hosted in public/
  // We'll construct it from a known preview domain pattern or fall back to a generic approach.
  const ogImageUrl = `https://id-preview--cd8351fe-3671-4983-92c3-c6d5206bddf5.lovable.app/images/practice-daily-og.jpeg`;

  const title = `Practice Log by ${name}`;
  const description = `Check out this practice session shared on Practice Daily.`;

  const html = `<!DOCTYPE html>
<html lang="en">
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
  <script>window.location.replace("${redirectPath}");</script>
</head>
<body>
  <p>Redirecting…</p>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-cache",
      ...corsHeaders,
    },
  });
});
