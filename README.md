# Practice Daily

> See your practice come to life.

A music practice companion app for musicians — track sessions, use built-in tools, get AI coaching, share progress with teachers and peers, earn streaks and badges, and connect through a community feed.

**Live:** [practicedaily.app](https://practicedaily.app)

## Features

- **Daily Practice Logging** — Set goals, track time, and log warmups, scales, and repertoire
- **Built-in Metronome** — Time signatures, accent patterns, and clave samples
- **Chromatic Tuner** — Real-time tuning with transposition for C, B♭, E♭, and F
- **Drone Player** — All 12 keys for intonation practice
- **Music AI Assistant** — Theory questions, practice advice, and coaching with voice playback
- **Audio Recorder** — Record and attach audio directly to your practice log
- **Lesson PDF Uploads** — Store and view lesson materials alongside your log
- **Media Tools** — Attach YouTube videos, audio, and images for reference
- **Dashboard** — Practice calendar, time graphs, streak tracking, and badges
- **Share with Teachers** — Generate a link so your teacher can review your logs
- **Studios** — Teachers create studios, assign homework, leave comments, and chat
- **Community Feed** — Share posts and connect with fellow musicians
- **Copy from Previous Day** — Reuse your practice template instantly
- **Staff Paper** — Built-in notation sketches

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, React Router v6, React Query, Recharts
- **Backend:** Supabase (Auth, Database, Edge Functions, Storage)
- **Payments:** Stripe (subscriptions with 7-day free trial)
- **AI:** OpenRouter gateway (Gemini models)
- **Voice:** ElevenLabs TTS for hands-free AI responses
- **Hosting:** Vercel

## Getting Started

```sh
# Clone the repo
git clone https://github.com/ctorculus3/2026-digital-planner.git
cd 2026-digital-planner

# Install dependencies
npm install

# Create .env with your Supabase keys
echo "VITE_SUPABASE_URL=your-supabase-url" > .env
echo "VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key" >> .env

# Start dev server
npm run dev
```

The app runs at [http://localhost:8080](http://localhost:8080).

## Project Structure

```
src/
  pages/         — Route pages (Landing, Auth, Index, Dashboard, etc.)
  components/
    practice-log/  — Timer, Metronome, Tuner, DronePlayer, AudioRecorder, MusicAI
    dashboard/     — PracticeCalendar, StreakCounter, BadgeShelf, stats
    studio/        — Teacher-student features (assignments, comments, chat)
    community/     — Social feed (PostCard, PostComposer, PostFeed)
    subscription/  — Billing (SubscriptionGate, PlanToggle)
  contexts/      — AuthContext (auth state management)
  hooks/         — Custom hooks for practice logs, streaks, studios, etc.
  integrations/  — Supabase client & generated types
supabase/
  functions/     — Edge Functions (music-ai, create-checkout, etc.)
  migrations/    — 30+ database migrations
public/
  audio/         — Drone notes, clave sounds, timer alarm
```

## License

All rights reserved. This is a proprietary project by Torculus LLC.
