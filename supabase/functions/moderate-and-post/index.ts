import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const JSON_HEADERS = { ...corsHeaders, "Content-Type": "application/json" };

function reject(message: string, extra: Record<string, unknown> = {}) {
  return new Response(
    JSON.stringify({ success: false, error: message, ...extra }),
    { status: 200, headers: JSON_HEADERS }
  );
}

async function callModeration(
  content: string,
  apiKey: string
): Promise<{ approved: boolean; reason?: string } | null> {
  try {
    const res = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        signal: AbortSignal.timeout(8000),
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://2026-digital-planner.vercel.app",
          "X-Title": "Practice Daily",
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
    const rawContent = data.choices?.[0]?.message?.content || "";
    return JSON.parse(rawContent);
  } catch (err) {
    console.error("Moderation call failed:", err);
    return null;
  }
}

// Simple in-memory rate limiter (per-user, resets on cold start)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5; // max posts per window
const RATE_WINDOW_MS = 60_000; // 1 minute

function isRateLimited(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
    const openrouterApiKey = Deno.env.get("OPENROUTER_API_KEY");

    if (!openrouterApiKey) {
      throw new Error("OPENROUTER_API_KEY is not configured");
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

    // Rate limit check
    if (isRateLimited(userId)) {
      return new Response(
        JSON.stringify({ error: "Too many posts. Please wait a minute and try again." }),
        { status: 429, headers: JSON_HEADERS }
      );
    }

    // Parse body
    const { content, image_paths } = await req.json();

    // Validate image_paths
    const validatedPaths: string[] = [];
    if (image_paths && Array.isArray(image_paths)) {
      if (image_paths.length > 5) {
        return reject("Maximum 5 images allowed");
      }
      for (const p of image_paths) {
        if (typeof p !== "string" || !p.startsWith(`${userId}/`)) {
          return reject("Invalid image path");
        }
        validatedPaths.push(p);
      }
    }

    // Validate content: required if no images
    const trimmed = (content || "").trim();
    if (trimmed.length === 0 && validatedPaths.length === 0) {
      return reject("Post must have text or images");
    }
    if (trimmed.length > 500) {
      return reject("Content must be 500 characters or fewer");
    }

    // Check streak
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

    // AI moderation (text only)
    if (trimmed.length > 0) {
      let modResult = await callModeration(trimmed, openrouterApiKey);
      if (!modResult) {
        console.log("Moderation attempt 1 failed, retrying...");
        modResult = await callModeration(trimmed, openrouterApiKey);
      }
      if (!modResult) {
        console.log("Moderation unavailable — allowing post (fail-open)");
        modResult = { approved: true };
      }
      if (!modResult.approved) {
        return reject(
          modResult.reason || "Your post was not approved by our content guidelines.",
          { moderation_rejected: true }
        );
      }
    }

    // Insert post
    const insertData: Record<string, unknown> = {
      user_id: userId,
      content: trimmed,
    };
    if (validatedPaths.length > 0) {
      insertData.image_paths = validatedPaths;
    }

    const { data: post, error: insertError } = await adminClient
      .from("community_posts")
      .insert(insertData)
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
