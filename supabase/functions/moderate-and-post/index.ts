import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const JSON_HEADERS = { ...corsHeaders, "Content-Type": "application/json" };

/** Helper: return a 200 with success: false for business-logic rejections */
function reject(message: string, extra: Record<string, unknown> = {}) {
  return new Response(
    JSON.stringify({ success: false, error: message, ...extra }),
    { status: 200, headers: JSON_HEADERS }
  );
}

/** Attempt a single moderation call; returns the parsed result or null on failure */
async function callModeration(
  content: string,
  apiKey: string
): Promise<{ approved: boolean; reason?: string } | null> {
  try {
    const res = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        signal: AbortSignal.timeout(8000),
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            {
              role: "system",
              content:
                'You are a content moderator for a music practice community. Evaluate if the user\'s post is appropriate. ONLY reject posts that contain: obscenity, hate speech, harassment, spam, or unauthorized brand promotion. Be VERY lenient with: casual greetings, encouragement, questions, short messages, test posts, jokes, general community chat, and any conversation even loosely related to music, practice, instruments, gear, or learning. When in doubt, APPROVE the post. Respond with ONLY valid JSON: {"approved": true} or {"approved": false, "reason": "brief explanation"}',
            },
            { role: "user", content },
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
          tool_choice: {
            type: "function",
            function: { name: "moderation_result" },
          },
        }),
      }
    );

    if (!res.ok) {
      console.error("Moderation API returned status:", res.status);
      return null;
    }

    const data = await res.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      return JSON.parse(toolCall.function.arguments);
    }
    // Fallback: try parsing from content
    const rawContent = data.choices?.[0]?.message?.content || "";
    return JSON.parse(rawContent);
  } catch (err) {
    console.error("Moderation call failed:", err);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Authenticate user via getUser (reliable server-side validation)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: JSON_HEADERS,
      });
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

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: JSON_HEADERS,
      });
    }

    const userId = user.id;

    // 2. Validate content
    const { content } = await req.json();
    if (!content || typeof content !== "string") {
      return reject("Content is required");
    }

    const trimmed = content.trim();
    if (trimmed.length === 0) {
      return reject("Content cannot be empty");
    }
    if (trimmed.length > 500) {
      return reject("Content must be 500 characters or fewer");
    }

    // 3. Check streak (service role to bypass RLS)
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: streakData, error: streakError } = await adminClient.rpc(
      "get_practice_streak",
      { p_user_id: userId }
    );

    if (streakError) {
      console.error("Streak check error:", streakError);
      return new Response(
        JSON.stringify({ error: "Failed to verify streak" }),
        { status: 500, headers: JSON_HEADERS }
      );
    }

    const streak = streakData as number;
    if (streak < 10) {
      return reject(
        `You need a 10-day practice streak to post. Current streak: ${streak}`
      );
    }

    // 4. AI moderation with retry and fail-open fallback
    let modResult = await callModeration(trimmed, lovableApiKey);

    // Retry once on transient failure
    if (!modResult) {
      console.log("Moderation attempt 1 failed, retrying...");
      modResult = await callModeration(trimmed, lovableApiKey);
    }

    // If both attempts failed, allow the post through
    // (streak gate already filters bad actors)
    if (!modResult) {
      console.log(
        "Moderation unavailable after retry — allowing post (fail-open)"
      );
      modResult = { approved: true };
    }

    if (!modResult.approved) {
      return reject(
        modResult.reason ||
          "Your post was not approved by our content guidelines.",
        { moderation_rejected: true }
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
      return new Response(
        JSON.stringify({ error: "Failed to create post" }),
        { status: 500, headers: JSON_HEADERS }
      );
    }

    return new Response(JSON.stringify({ success: true, post }), {
      status: 201,
      headers: JSON_HEADERS,
    });
  } catch (error) {
    console.error("moderate-and-post error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: JSON_HEADERS }
    );
  }
});
