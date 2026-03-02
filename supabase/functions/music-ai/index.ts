import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

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
    const { messages, journalContext } = await req.json();
    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    if (!OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY is not configured");

    // Fetch user profile and survey data for personalized coaching
    let userContext = "";
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      try {
        const supabase = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_ANON_KEY")!,
          { global: { headers: { Authorization: authHeader } } }
        );
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const [{ data: profile }, { data: survey }] = await Promise.all([
            supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
            supabase.from("onboarding_surveys").select("instruments, genres, birthday, skill_level, practice_frequency, practice_goal").eq("user_id", user.id).maybeSingle(),
          ]);

          const parts: string[] = [];
          if (profile?.display_name) parts.push(`Name: ${profile.display_name}`);
          if (survey) {
            if (survey.instruments?.length) parts.push(`Instruments: ${survey.instruments.join(", ")}`);
            if (survey.genres?.length) parts.push(`Genres: ${survey.genres.join(", ")}`);
            if (survey.birthday) {
              const age = Math.floor((Date.now() - new Date(survey.birthday).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
              if (age > 0 && age < 120) parts.push(`Age: ${age}`);
            }
            if (survey.skill_level) parts.push(`Skill level: ${survey.skill_level}`);
            if (survey.practice_frequency) parts.push(`Practice frequency: ${survey.practice_frequency.replace(/_/g, " ")}`);
            if (survey.practice_goal) parts.push(`Main goal: ${survey.practice_goal.replace(/_/g, " ")}`);
          }
          if (parts.length > 0) {
            userContext = `\n\nAbout this student:\n${parts.join("\n")}\nPersonalize your coaching based on their instrument(s), genres, age, skill level, practice habits, and goals. Address them by name when natural.`;
          }
        }
      } catch (e) {
        console.warn("Failed to fetch user context:", e);
        // Continue without personalization — non-blocking
      }
    }

    let systemPrompt =
      "You are a knowledgeable music theory tutor and practice coach. Answer questions about music theory, scales, chords, ear training, technique, and practice strategies. Keep answers clear and practical. Use markdown formatting for readability." + userContext;

    if (journalContext) {
      const parts: string[] = [];
      if (journalContext.goals) parts.push(`Goals: ${journalContext.goals}`);
      if (journalContext.repertoire?.length)
        parts.push(`Repertoire: ${journalContext.repertoire.join(", ")}`);
      if (journalContext.notes) parts.push(`Notes: ${journalContext.notes}`);
      if (parts.length > 0) {
        systemPrompt += `\n\nThe user's current practice journal context:\n${parts.join("\n")}\nReference this context in your advice when relevant.`;
      }
    }

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://practicedaily.app",
          "X-Title": "Practice Daily",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("OpenRouter error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "AI service error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("music-ai error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
