import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    // 1. Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // User-scoped client for auth validation
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub as string;

    // 2. Validate content
    const { content } = await req.json();
    if (!content || typeof content !== "string") {
      return new Response(JSON.stringify({ error: "Content is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const trimmed = content.trim();
    if (trimmed.length === 0) {
      return new Response(JSON.stringify({ error: "Content cannot be empty" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (trimmed.length > 500) {
      return new Response(JSON.stringify({ error: "Content must be 500 characters or fewer" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Check streak (service role to bypass RLS)
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: streakData, error: streakError } = await adminClient.rpc(
      "get_practice_streak",
      { p_user_id: userId }
    );

    if (streakError) {
      console.error("Streak check error:", streakError);
      return new Response(JSON.stringify({ error: "Failed to verify streak" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const streak = streakData as number;
    if (streak < 10) {
      return new Response(
        JSON.stringify({
          error: `You need a 10-day practice streak to post. Current streak: ${streak}`,
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 4. AI moderation
    const moderationResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            {
              role: "system",
              content:
                'You are a content moderator for a music practice community. Evaluate if the user\'s post is appropriate. Reject posts that contain: obscenity, hate speech, harassment, spam, unauthorized brand promotion, or off-topic content unrelated to music/practice. Be lenient with casual conversation about music, gear, practice habits, and encouragement. Respond with ONLY valid JSON: {"approved": true} or {"approved": false, "reason": "brief explanation"}',
            },
            { role: "user", content: trimmed },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "moderation_result",
                description: "Return the moderation decision",
                parameters: {
                  type: "object",
                  properties: {
                    approved: { type: "boolean" },
                    reason: { type: "string" },
                  },
                  required: ["approved"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "moderation_result" } },
        }),
      }
    );

    if (!moderationResponse.ok) {
      if (moderationResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Moderation service is busy. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (moderationResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Moderation service unavailable. Please try again later." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.error("AI moderation error:", moderationResponse.status);
      // If moderation fails, reject to be safe
      return new Response(
        JSON.stringify({ error: "Unable to verify post content. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const moderationData = await moderationResponse.json();
    let modResult: { approved: boolean; reason?: string };

    try {
      const toolCall = moderationData.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        modResult = JSON.parse(toolCall.function.arguments);
      } else {
        // Fallback: try parsing from content
        const rawContent = moderationData.choices?.[0]?.message?.content || "";
        modResult = JSON.parse(rawContent);
      }
    } catch {
      console.error("Failed to parse moderation response:", moderationData);
      return new Response(
        JSON.stringify({ error: "Unable to verify post content. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!modResult.approved) {
      return new Response(
        JSON.stringify({
          error: modResult.reason || "Your post was not approved by our content guidelines.",
          moderation_rejected: true,
        }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Insert post using service role
    const { data: post, error: insertError } = await adminClient
      .from("community_posts")
      .insert({ user_id: userId, content: trimmed })
      .select("id, created_at")
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(JSON.stringify({ error: "Failed to create post" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, post }), {
      status: 201,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("moderate-and-post error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
