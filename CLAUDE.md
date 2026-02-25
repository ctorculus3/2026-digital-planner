# Practice Daily

> A music practice companion app — track sessions, use built-in tools, get AI coaching, share progress, earn streaks & badges.

## Tech Stack
React 18 + TypeScript + Vite, Tailwind CSS + shadcn/ui, React Router v6, React Query, Recharts, Supabase (Auth, DB, Edge Functions, Storage), Stripe (subscriptions), OpenRouter (AI gateway — Gemini models), ElevenLabs (TTS), Vercel (production hosting)

## Project Structure
- `src/pages/` — Route pages: Landing, Auth, Index (practice log), Dashboard, Community, Studio, StaffPaper, StudentLogView, SharedPracticeLog, JoinStudio, Privacy, Terms, ResetPassword
- `src/components/practice-log/` — Core practice features: Timer, Metronome, Tuner, DronePlayer, AudioRecorder, MusicAI, PracticeLogForm, DateNavigator, MediaTools, StudentChatPanel
- `src/components/dashboard/` — Stats & gamification: PracticeCalendar, PracticeTimeGraph, StreakCounter, BadgeShelf, PracticeTimeSummary, ShareBadgeDialog
- `src/components/studio/` — Teacher-student features: CreateStudio, JoinStudio, StudentList, TeacherCommentPanel, WeeklyAssignmentPanel, StudioChatPanel, TeacherPdfUpload
- `src/components/community/` — Social feed: PostCard, PostComposer, PostFeed, StreakGateBanner, RoleManagementDialog
- `src/components/subscription/` — Billing: ManageSubscription, PlanToggle, SubscriptionGate
- `src/contexts/AuthContext.tsx` — Auth state management
- `src/hooks/` — Custom hooks for practice logs, dashboard data, streaks, studios, audio recording, etc.
- `src/integrations/supabase/` — Supabase client & generated types
- `supabase/functions/` — Edge Functions: music-ai, elevenlabs-tts, create-checkout, customer-portal, check-subscription, moderate-and-post, notify-subscriber-event, purge-inactive-data
- `supabase/migrations/` — 30+ database migrations (Feb 4–22, 2026)

## Key URLs & Resources
- Production: https://practicedaily.app
- App Dashboard: https://practicedaily.app/dashboard
- Repo: https://github.com/ctorculus3/2026-digital-planner
- Local dev: http://localhost:8080
- Stripe Dashboard: https://dashboard.stripe.com
- Supabase Dashboard: https://supabase.com/dashboard/project/cyiglozkytiadzpuqflh
- Supabase Auth Providers: https://supabase.com/dashboard/project/cyiglozkytiadzpuqflh/auth/providers
- Google Cloud Console: https://console.cloud.google.com/apis/credentials?project=my-project-gmail-487419
- OpenAI: https://openai.com

## Architecture Overview
Practice Daily is a React SPA. Authentication, database, file storage, and serverless functions all run on Supabase. Users log daily practice sessions with notes, timers, and audio recordings. Built-in musician tools (metronome, tuner, chromatic drone player) run client-side. A Music AI assistant (via Supabase Edge Function → OpenRouter → Gemini) provides coaching with optional ElevenLabs voice playback for hands-free use.

Teachers create "Studios" and invite students via codes. They can view student practice logs, leave comments, upload lesson PDFs, send weekly assignments, and chat. A community feed lets users share posts (gated behind practice streaks). Subscriptions are handled through Stripe with checkout sessions and a customer portal.

**Auth flow:** Landing page → Google OAuth via Supabase → `/auth` callback → checks Stripe subscription → redirects to Index (practice log). Auth.tsx handles the OAuth callback.

## Current Status
**Active tasks:**
- **[LOW]** Monitor OpenRouter usage and costs (~$15/mo estimated for 100 users)

**No blocked tasks. No known issues.**

**Recently completed (Dev Report No. 4):**
- ✅ Custom domain `practicedaily.app` fully configured (DNS at GoDaddy, Vercel domain, SSL certs)
- ✅ Fixed blank page on production — Vercel had zero env vars; added `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`, redeployed
- ✅ Supabase Auth Site URL updated to `https://practicedaily.app`
- ✅ Google Cloud OAuth origins updated for `practicedaily.app` and `www.practicedaily.app`
- ✅ All domain URLs updated across codebase: sitemap.xml, robots.txt, Landing.tsx JSON-LD, Edge Functions HTTP-Referer, index.html og:url + canonical
- ✅ README.md rewritten — removed all Lovable template content
- ✅ Dashboard blinking fix — `lastSessionTokenRef` in AuthContext prevents duplicate subscription fetches; `processingCheckout` initialized from URL params in SubscriptionGate

**Previously completed (Dev Report No. 3):**
- ✅ Edge Function auth fixed — switched `getClaims` → `getUser` in check-subscription, customer-portal, notify-subscriber-event
- ✅ Edge Functions deployed with `verify_jwt: false` — auth handled in function code
- ✅ Removed beta Stripe API version (`2025-08-27.basil`) from all Stripe Edge Functions
- ✅ Fixed invalid `STRIPE_SECRET_KEY` in Supabase (was `mk_` prefix, replaced with `sk_live_`)
- ✅ SubscriptionGate updated to use direct `fetch` for better error reporting
- ✅ Fixed iceberg-js build error with Vite alias stub
- ✅ Full checkout flow verified end-to-end: Landing → Google OAuth → Paywall → Stripe Checkout (7-day trial, $3.99/mo)
- ✅ All Edge Functions returning 200s (check-subscription, create-checkout)
- ✅ PR #1 created: https://github.com/ctorculus3/2026-digital-planner/pull/1

**Previously completed (Dev Report No. 2):**
- ✅ Google OAuth tested end-to-end (landing → Google → callback → Stripe checkout)
- ✅ Supabase project reconfigured to correct instance (was pointing to old Lovable project)
- ✅ All Lovable dependencies and integrations removed
- ✅ .env reviewed (safe — public anon keys only), gitignored, removed from tracking
- ✅ AI gateway migrated from Lovable to OpenRouter (Gemini models, ~$15/mo)
- ✅ Both Edge Functions (music-ai, elevenlabs-tts) deployed and verified on Supabase
- ✅ All URLs updated from Lovable domain to Vercel production

## Recent Session History
- **2026-02-24 (Dev Report No. 4)** — Custom domain setup: DNS at GoDaddy (A + CNAME), Vercel domain config, SSL certs. Fixed blank page (Vercel missing env vars). Updated Supabase Auth Site URL and Google Cloud OAuth origins. All domain URLs updated across codebase. README rewritten. Dashboard blinking fix (AuthContext + SubscriptionGate).
- **2026-02-24 (Dev Report No. 3)** — Fixed Edge Function auth and Stripe checkout flow. Debugged 4 layered issues: verify_jwt gateway rejection, getClaims auth failures, beta Stripe API version, invalid STRIPE_SECRET_KEY. Full checkout flow verified end-to-end. PR #1 created.
- **2026-02-24 (Cowork)** — Ingested Dev Report No. 2 into Project Supervisor. Added dashboard URLs (Stripe, Supabase, Google Cloud, OpenAI, Vercel).
- **2026-02-23 (Dev Report No. 2)** — Completed full Lovable transition. Fixed Supabase project config, tested OAuth end-to-end, cleaned all Lovable deps, secured .env, migrated AI gateway to OpenRouter, deployed Edge Functions. 5 commits to main.
- **2026-02-23 (Claude Code)** — Set up local dev. Switched Google sign-in from Lovable to Supabase OAuth. Removed Apple sign-in button.
- **2026-02-23 (Cowork)** — Onboarded project, mapped 240 files, confirmed local matches GitHub 1:1. Created CLAUDE.md and Project Supervisor tracking.

## Important Decisions
- **Custom domain: practicedaily.app** (2026-02-24) — GoDaddy DNS (A record → 76.76.21.21, CNAME www → cname.vercel-dns.com), Vercel domain config with SSL. Supabase Auth Site URL and Google Cloud OAuth origins updated.
- **Vercel env vars required for build** (2026-02-24) — Vite inlines `import.meta.env.VITE_*` at build time. Missing env vars → `undefined` → `createClient(undefined, undefined)` crashes silently at module evaluation. Must set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in Vercel project settings.
- **Dashboard blinking fix: lastSessionTokenRef** (2026-02-24) — `onAuthStateChange` fires on token refresh with the same session. `lastSessionTokenRef` in AuthContext skips redundant subscription fetches. `processingCheckout` in SubscriptionGate initialized from URL params to prevent paywall flash on checkout return.
- **Edge Functions: getUser over getClaims** (2026-02-24) — `getClaims` caused "missing sub claim" errors. `getUser` makes a network call to Auth server and is reliable.
- **Edge Functions: verify_jwt disabled** (2026-02-24) — JWT validation handled in function code via `getUser`, not the Supabase gateway. Applies to check-subscription, customer-portal, elevenlabs-tts, notify-subscriber-event.
- **Stripe SDK: default API version** (2026-02-24) — Removed explicit `apiVersion: "2025-08-27.basil"` (beta). `new Stripe(stripeKey)` uses the library's default stable version.
- **SubscriptionGate: direct fetch** (2026-02-24) — `supabase.functions.invoke` wraps errors generically. Direct `fetch` gives access to actual response body for better error reporting.
- **Lovable fully removed** (2026-02-23) — No remaining Lovable dependencies, integrations, or cloud auth. All URLs updated to Vercel production domain.
- **Supabase project reconfigured** (2026-02-23) — App was pointing to old Lovable-managed Supabase instance (ref: cyiglozkytiadzpuqflh).
- **AI gateway: OpenRouter** (2026-02-23) — Replaced Lovable's AI gateway with OpenRouter for music-ai and elevenlabs-tts Edge Functions. Same Gemini models, OpenAI-compatible format. ~$15/mo for 100 users.
- **Google OAuth via Supabase directly** (2026-02-23) — `supabase.auth.signInWithOAuth({ provider: 'google' })` in Landing.tsx.
- **Apple sign-in removed** (2026-02-23) — UI-only button with no backend provider in Supabase.
- **.env secured** (2026-02-23) — Only contains public Supabase anon keys. Added to .gitignore, removed from git tracking.

## Notes for Claude
- Calvin is a musician, creator, business developer, and designer building this app
- The app is called "Practice Daily" — tagline is "See your practice come to life"
- Source lives in the `2026-digital-planner` folder (the folder name doesn't match the app name)
- **Lovable is fully removed** — no remaining dependencies, integrations, or cloud auth calls
- **Auth is Google-only** — Apple is NOT configured in Supabase. Don't add Apple sign-in UI without confirming backend setup.
- **AI goes through OpenRouter** — music-ai and elevenlabs-tts Edge Functions use OpenRouter → Gemini. Not direct Anthropic or OpenAI calls.
- Supabase project ref: cyiglozkytiadzpuqflh
- Stripe account: Torculus LLC (acct_1SwzqVLSlNM2EUMk)
- Google Cloud project: my-project-gmail-487419
- Supabase types are generated in `src/integrations/supabase/types.ts`
- Audio assets live in `public/audio/` (drone notes for all 12 keys, clave sounds, timer alarm)
- Full project state tracked in `projects/practice-daily.json`
