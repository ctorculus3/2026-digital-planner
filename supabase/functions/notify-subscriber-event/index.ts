import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const eventType = payload?.event;

    // Signup events are allowed without auth (no session exists yet)
    if (eventType !== "signup") {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } }
      );

      const token = authHeader.replace("Bearer ", "");
      const { data, error } = await supabase.auth.getUser(token);
      if (error || !data?.user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const webhookUrl = Deno.env.get("N8N_SUBSCRIBER_WEBHOOK_URL");
    if (!webhookUrl) {
      console.error("[notify-subscriber-event] N8N_SUBSCRIBER_WEBHOOK_URL not set");
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[notify-subscriber-event] Forwarding event:", eventType);

    // Fire-and-forget POST to n8n
    try {
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (webhookErr) {
      console.error("[notify-subscriber-event] Webhook call failed:", webhookErr);
    }

    // Forward signup events to PR Outreach webhook (fire-and-forget)
    if (eventType === "signup") {
      const prOutreachSecret = Deno.env.get("PR_OUTREACH_WEBHOOK_SECRET");
      if (prOutreachSecret) {
        try {
          await fetch("https://hzgwcuefaptbohxvbebi.supabase.co/functions/v1/webhook", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-webhook-secret": prOutreachSecret,
            },
            body: JSON.stringify(payload),
          });
          console.log("[notify-subscriber-event] PR Outreach webhook sent for signup");
        } catch (prErr) {
          console.error("[notify-subscriber-event] PR Outreach webhook failed:", prErr);
        }
      } else {
        console.warn("[notify-subscriber-event] PR_OUTREACH_WEBHOOK_SECRET not set, skipping PR Outreach");
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[notify-subscriber-event] Error:", err);
    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
