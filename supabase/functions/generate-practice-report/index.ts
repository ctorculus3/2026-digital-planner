import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const JSON_HEADERS = { ...corsHeaders, "Content-Type": "application/json" };

/**
 * Get the Monday–Sunday range for the most recently completed week.
 * If weekStart is provided (ISO date string), use that Monday.
 * Otherwise default to last completed week.
 */
function getWeekRange(weekStart?: string): { weekStart: string; weekEnd: string } {
  if (weekStart) {
    const start = new Date(weekStart + "T00:00:00Z");
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 6);
    return {
      weekStart: start.toISOString().split("T")[0],
      weekEnd: end.toISOString().split("T")[0],
    };
  }

  // Default: most recently completed Mon–Sun
  const now = new Date();
  const dayOfWeek = now.getUTCDay(); // 0=Sun, 1=Mon, ...
  // Days since last Monday
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  // Go back to start of *last* completed week
  const lastMonday = new Date(now);
  lastMonday.setUTCDate(now.getUTCDate() - daysSinceMonday - 7);
  const lastSunday = new Date(lastMonday);
  lastSunday.setUTCDate(lastMonday.getUTCDate() + 6);

  return {
    weekStart: lastMonday.toISOString().split("T")[0],
    weekEnd: lastSunday.toISOString().split("T")[0],
  };
}

async function generateAIInsight(
  data: {
    totalMinutes: number;
    sessionCount: number;
    streak: number;
    categoryBreakdown: Record<string, number>;
    piecesPracticed: string[];
    goals: string[];
  },
  apiKey: string
): Promise<{ insight: string; next_week_focus: string } | null> {
  try {
    const categories = Object.entries(data.categoryBreakdown)
      .map(([k, v]) => `${k.replace(/_/g, " ")}(${v})`)
      .join(", ");

    const pieces = data.piecesPracticed.length > 0
      ? data.piecesPracticed.join(", ")
      : "none specified";

    const goals = data.goals.length > 0
      ? data.goals.join("; ")
      : "none specified";

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      signal: AbortSignal.timeout(15000),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://practicedaily.app",
        "X-Title": "Practice Daily",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content:
              'You are a supportive music practice coach. Based on the weekly practice data provided, write two things: 1) "insight": A 2-3 sentence personalized paragraph analyzing the student\'s practice patterns this week. Be encouraging but specific about what they did well and what could improve. 2) "next_week_focus": 2-3 concrete, actionable goals for next week based on their trajectory. Format as short bullet points separated by newlines. Respond with ONLY valid JSON: {"insight": "...", "next_week_focus": "..."}',
          },
          {
            role: "user",
            content: `Practice data for this week:\n- Total practice time: ${data.totalMinutes} minutes across ${data.sessionCount} sessions\n- Current streak: ${data.streak} days\n- Categories practiced: ${categories}\n- Pieces worked on: ${pieces}\n- Goals mentioned: ${goals}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "practice_report",
              description: "Return the AI practice report insight and focus",
              parameters: {
                type: "object",
                properties: {
                  insight: {
                    type: "string",
                    description: "2-3 sentence personalized paragraph analyzing practice patterns",
                  },
                  next_week_focus: {
                    type: "string",
                    description: "2-3 bullet point goals for next week, separated by newlines",
                  },
                },
                required: ["insight", "next_week_focus"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: {
          type: "function",
          function: { name: "practice_report" },
        },
      }),
    });

    if (!res.ok) {
      console.error("[PRACTICE-REPORT] OpenRouter returned status:", res.status);
      return null;
    }

    const responseData = await res.json();
    const toolCall = responseData.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      return JSON.parse(toolCall.function.arguments);
    }

    // Fallback: try parsing raw content
    const rawContent = responseData.choices?.[0]?.message?.content || "";
    return JSON.parse(rawContent);
  } catch (err) {
    console.error("[PRACTICE-REPORT] AI generation failed:", err);
    return null;
  }
}

/**
 * Generate a report for a single user. Returns the report row or null if
 * no practice data was found for the week.
 */
async function generateReportForUser(
  adminClient: ReturnType<typeof createClient>,
  userId: string,
  weekStart: string,
  weekEnd: string,
  openrouterApiKey: string
): Promise<Record<string, unknown> | null> {
  // Idempotency: check if report already exists
  const { data: existingReport } = await adminClient
    .from("weekly_reports")
    .select("*")
    .eq("user_id", userId)
    .eq("week_start", weekStart)
    .maybeSingle();

  if (existingReport) {
    console.log(`[PRACTICE-REPORT] Report already exists for user ${userId}, skipping`);
    return existingReport;
  }

  // Aggregate practice data
  const { data: aggregateData, error: aggregateError } = await adminClient.rpc(
    "aggregate_weekly_practice",
    {
      p_user_id: userId,
      p_week_start: weekStart,
      p_week_end: weekEnd,
    }
  );

  if (aggregateError) {
    console.error(`[PRACTICE-REPORT] Aggregation error for user ${userId}:`, aggregateError);
    return null;
  }

  const stats = aggregateData as {
    total_minutes: number;
    session_count: number;
    category_breakdown: Record<string, number>;
    pieces_practiced: string[];
    goals_this_week: string[];
  };

  // Skip users with no practice data
  if (stats.session_count === 0) {
    console.log(`[PRACTICE-REPORT] No sessions for user ${userId}, skipping`);
    return null;
  }

  // Fetch current streak
  const { data: streakData } = await adminClient.rpc("get_practice_streak", {
    p_user_id: userId,
  });
  const streak = (streakData as number) || 0;

  // Fetch badges earned this week
  const { data: badgesData } = await adminClient
    .from("user_badges")
    .select("badge_type")
    .eq("user_id", userId)
    .gte("earned_at", weekStart)
    .lte("earned_at", weekEnd + "T23:59:59Z");

  const badgesEarned = (badgesData || []).map((b: { badge_type: string }) => b.badge_type);

  // Generate AI insight
  console.log(`[PRACTICE-REPORT] Calling AI for user ${userId}...`);
  const aiResult = await generateAIInsight(
    {
      totalMinutes: stats.total_minutes,
      sessionCount: stats.session_count,
      streak,
      categoryBreakdown: stats.category_breakdown,
      piecesPracticed: stats.pieces_practiced,
      goals: stats.goals_this_week,
    },
    openrouterApiKey
  );

  // Insert report
  const reportData = {
    user_id: userId,
    week_start: weekStart,
    week_end: weekEnd,
    total_minutes: stats.total_minutes,
    session_count: stats.session_count,
    streak_at_generation: streak,
    category_breakdown: stats.category_breakdown,
    pieces_practiced: stats.pieces_practiced,
    ai_insight: aiResult?.insight || null,
    ai_next_week_focus: aiResult?.next_week_focus || null,
    badges_earned: badgesEarned,
  };

  const { data: report, error: insertError } = await adminClient
    .from("weekly_reports")
    .insert(reportData)
    .select("*")
    .single();

  if (insertError) {
    console.error(`[PRACTICE-REPORT] Insert error for user ${userId}:`, insertError);
    return null;
  }

  console.log(`[PRACTICE-REPORT] Report created for user ${userId}: ${report.id}`);
  return report;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const openrouterApiKey = Deno.env.get("OPENROUTER_API_KEY");

    if (!openrouterApiKey) {
      throw new Error("OPENROUTER_API_KEY is not configured");
    }

    const body = await req.json().catch(() => ({}));
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // ── CRON MODE: generate reports for all active users ──
    if (body.mode === "cron") {
      // Verify this is called with the service role key (not a regular user)
      const authHeader = req.headers.get("Authorization");
      if (authHeader !== `Bearer ${serviceRoleKey}`) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: JSON_HEADERS,
        });
      }

      const { weekStart, weekEnd } = getWeekRange(); // always last completed week
      console.log(`[PRACTICE-REPORT][CRON] Generating reports for week ${weekStart} to ${weekEnd}`);

      // Find all users who practiced during this week
      const { data: activeUsers, error: usersError } = await adminClient
        .from("practice_logs")
        .select("user_id")
        .gte("date", weekStart)
        .lte("date", weekEnd)
        .gt("total_time", 0);

      if (usersError) {
        console.error("[PRACTICE-REPORT][CRON] Error fetching active users:", usersError);
        return new Response(
          JSON.stringify({ error: "Failed to fetch active users" }),
          { status: 500, headers: JSON_HEADERS }
        );
      }

      // Deduplicate user IDs
      const uniqueUserIds = [...new Set((activeUsers || []).map((r: { user_id: string }) => r.user_id))];
      console.log(`[PRACTICE-REPORT][CRON] Found ${uniqueUserIds.length} active users`);

      let generated = 0;
      let skipped = 0;
      let failed = 0;

      for (const userId of uniqueUserIds) {
        try {
          const report = await generateReportForUser(
            adminClient, userId, weekStart, weekEnd, openrouterApiKey
          );
          if (report) generated++;
          else skipped++;
        } catch (err) {
          console.error(`[PRACTICE-REPORT][CRON] Failed for user ${userId}:`, err);
          failed++;
        }
      }

      console.log(
        `[PRACTICE-REPORT][CRON] Done: ${generated} generated, ${skipped} skipped, ${failed} failed`
      );

      return new Response(
        JSON.stringify({
          success: true,
          week_start: weekStart,
          week_end: weekEnd,
          total_users: uniqueUserIds.length,
          generated,
          skipped,
          failed,
        }),
        { status: 200, headers: JSON_HEADERS }
      );
    }

    // ── ON-DEMAND MODE: generate report for the authenticated user ──
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: JSON_HEADERS,
      });
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
    console.log(`[PRACTICE-REPORT] Generating report for user ${userId}`);

    const { weekStart, weekEnd } = getWeekRange(body.week_start);
    console.log(`[PRACTICE-REPORT] Week range: ${weekStart} to ${weekEnd}`);

    const report = await generateReportForUser(
      adminClient, userId, weekStart, weekEnd, openrouterApiKey
    );

    if (!report) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "No practice sessions found for this week. Practice more to generate a report!",
        }),
        { status: 200, headers: JSON_HEADERS }
      );
    }

    return new Response(JSON.stringify({ success: true, report }), {
      status: 200,
      headers: JSON_HEADERS,
    });
  } catch (error) {
    console.error("[PRACTICE-REPORT] Error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: JSON_HEADERS }
    );
  }
});
