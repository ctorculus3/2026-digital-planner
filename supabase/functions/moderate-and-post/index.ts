import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function jsonResponse(body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const userId = claimsData.claims.sub as string;

    // 2. Validate content and image_paths
    const { content, image_paths } = await req.json();

    const trimmed = typeof content === "string" ? content.trim() : "";
    const hasText = trimmed.length > 0;
    const hasImages = Array.isArray(image_paths) && image_paths.length > 0;

    if (!hasText && !hasImages) {
      return jsonResponse({ error: "A post must have text or at least one image" }, 400);
    }

    if (hasText && trimmed.length > 500) {
      return jsonResponse({ error: "Content must be 500 characters or fewer" }, 400);
    }

    // Validate image_paths
    if (hasImages) {
      if (image_paths.length > 5) {
        return jsonResponse({ error: "Maximum 5 images per post" }, 400);
      }
      for (const path of image_paths) {
        if (typeof path !== "string" || !path.startsWith(`${userId}/`)) {
          return jsonResponse({ error: "Invalid image path" }, 400);
        }
      }
    }

    // 3. Check streak (service role to bypass RLS)
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: streakData, error: streakError } = await adminClient.rpc(
      "get_practice_streak",
      { p_user_id: userId }
    );

    if (streakError) {
      console.error("Streak check error:", streakError);
      return jsonResponse({ error: "Failed to verify streak" }, 500);
    }

    const streak = streakData as number;
    if (streak < 10) {
      return jsonResponse(
        { error: `You need a 10-day practice streak to post. Current streak: ${streak}` },
        403
      );
    }

    // 4. AI moderation (text only)
    if (hasText) {
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
          return jsonResponse({ error: "Moderation service is busy. Please try again in a moment." }, 429);
        }
        if (moderationResponse.status === 402) {
          return jsonResponse({ error: "Moderation service unavailable. Please try again later." }, 402);
        }
        console.error("AI moderation error:", moderationResponse.status);
        return jsonResponse({ error: "Unable to verify post content. Please try again." }, 500);
      }

      const moderationData = await moderationResponse.json();
      let modResult: { approved: boolean; reason?: string };

      try {
        const toolCall = moderationData.choices?.[0]?.message?.tool_calls?.[0];
        if (toolCall?.function?.arguments) {
          modResult = JSON.parse(toolCall.function.arguments);
        } else {
          const rawContent = moderationData.choices?.[0]?.message?.content || "";
          modResult = JSON.parse(rawContent);
        }
      } catch {
        console.error("Failed to parse moderation response:", moderationData);
        return jsonResponse({ error: "Unable to verify post content. Please try again." }, 500);
      }

      if (!modResult.approved) {
        return jsonResponse(
          {
            error: modResult.reason || "Your post was not approved by our content guidelines.",
            moderation_rejected: true,
          },
          422
        );
      }
    }

    // 5. Insert post using service role
    const insertData: Record<string, unknown> = {
      user_id: userId,
      content: hasText ? trimmed : "",
    };
    if (hasImages) {
      insertData.image_paths = image_paths;
    }

    const { data: post, error: insertError } = await adminClient
      .from("community_posts")
      .insert(insertData)
      .select("id, created_at")
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return jsonResponse({ error: "Failed to create post" }, 500);
    }

    return jsonResponse({ success: true, post }, 201);
  } catch (error) {
    console.error("moderate-and-post error:", error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Unknown error" },
      500
    );
  }
});
