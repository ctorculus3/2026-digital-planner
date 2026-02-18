import { useState } from "react";
import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger } from
"@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

export function HowToManual() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 text-foreground/70 hover:text-foreground">
          <HelpCircle className="h-4 w-4" />
          <span className="hidden sm:inline">How To</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-xl font-display">How to Use Practice Daily</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[70vh] px-6 pb-6">
          <div className="space-y-6 pr-4 text-sm text-foreground/90 leading-relaxed">

            {/* 1. Getting Started */}
            <section>
              <h3 className="text-base font-semibold text-foreground mb-2">1. Getting Started</h3>
              <p>
                Practice Daily is your personal music practice journal. It helps you log what you practice every day, track your progress over time, and build consistent habits. Once you sign in, you'll land on the <strong>Dashboard</strong>. From there you can navigate to your <strong>Journal</strong> to start logging, or visit the <strong>Community</strong> feed.
              </p>
            </section>

            {/* 2. The Dashboard */}
            <section>
              <h3 className="text-base font-semibold text-foreground mb-2">2. The Dashboard</h3>
              <p className="mb-2">Your Dashboard gives you an overview of your practice consistency:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Streak Counter</strong> — Shows how many consecutive days you've practiced. Keep the streak alive!</li>
                <li><strong>Practice Calendar</strong> — Days you practiced are marked with teal dots. Click any date to jump to that day's journal entry.</li>
                <li><strong>Hours Summary</strong> — See your total practice time for the week, month, and all time.</li>
                <li><strong>Practice Time Graph</strong> — A visual chart of your daily practice minutes over the current period.</li>
                <li><strong>Badge Shelf</strong> — Earn milestone badges at 10, 30, 50, and 100-day streaks. Unearned badges appear as grayscale silhouettes.</li>
              </ul>
            </section>

            {/* 3. The Journal */}
            <section>
              <h3 className="text-base font-semibold text-foreground mb-2">3. The Journal</h3>
              <p className="mb-2">The Journal is where you fill out your daily practice log. Navigation is easy:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Month Tabs</strong> — Displayed across the top. Tap a month to jump to it.</li>
                <li><strong>Day Tabs</strong> — Located on the right side. Select a day of the week, or use the arrows to move between weeks.</li>
                <li><strong>Date Navigator</strong> — Use the left/right arrows or the "Today" button above the form to move between days.</li>
              </ul>
              <p className="mt-2">The form uses a <strong>two-column notebook layout</strong>. The left column holds your Repertoire & Exercises and Media Tools. The right column contains everything else — goals, time tracking, notes, tools, and more.</p>
            </section>

            {/* 4. Filling Out Your Practice Log */}
            <section>
              <h3 className="text-base font-semibold text-foreground mb-2">4. Filling Out Your Practice Log</h3>

              <h4 className="font-medium text-foreground mt-3 mb-1">Goals & Subgoals</h4>
              <p>Set a main goal for the session at the top of the right column, with optional subgoals underneath. This helps you stay focused.</p>

              <h4 className="font-medium text-foreground mt-3 mb-1">Start / Stop Time</h4>
              <p>Record when you begin and end your session. The total practice time is calculated automatically.</p>

              <h4 className="font-medium text-foreground mt-3 mb-1">Warm-ups & Scales</h4>
              <p>Log your warm-up exercises and scales in the dedicated fields.</p>

              <h4 className="font-medium text-foreground mt-3 mb-1">Repertoire & Exercises</h4>
              <p>The left column starts with rows for your repertoire pieces and exercises. Each row has a circular checkbox — check it off when you've completed that item. You can also make repertoire & exercise audio recordings for each individual rows to track your progress over time. Play the recordings back or down load them to your device.</p>

              <h4 className="font-medium text-foreground mt-3 mb-1">Notes & Focus</h4>
              <p>Use the Notes section for observations, reflections, or anything you want to remember. The Focus/Musicianship field is great for logging technique-specific work.</p>

              <h4 className="font-medium text-foreground mt-3 mb-1">Lesson PDFs</h4>
              <p>Upload PDF files from your teacher's lessons or PDF's from your collection. These are stored with your practice log for the day so you can reference them anytime.</p>

              <h4 className="font-medium text-foreground mt-3 mb-1">Ear Training, Additional Tasks & Music Listening</h4>
              <p>Each of these sections provides rows with checkboxes. Use them to log ear training exercises, extra tasks your teacher assigned, or pieces you're actively listening to for study.</p>

              <h4 className="font-medium text-foreground mt-3 mb-1">Media Tools</h4>
              <p>The Media Tools section is located in the left column, below Repertoire & Exercises. You can upload or drag-and-drop audio files (MP3, WAV, M4A), video files (MP4, MOV), and photos (JPG, PNG, WebP, GIF) directly into your practice log. You can also paste a YouTube URL to embed a video — great for referencing listening sessions or performances. Up to 5 media items can be attached per day. Each item can be played back, viewed, or deleted right from the journal.</p>
            </section>

            {/* 5. Built-in Tools */}
            <section>
              <h3 className="text-base font-semibold text-foreground mb-2">5. Built-in Tools</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Metronome</strong>Metronome — A built-in click track. Set your practice tempo right inside the journal. Use the slider to raise or lower the tempo, or push the plus and minus signs.</li>
                <li><strong>Tuner</strong> — Uses your device's microphone to help you tune your instrument.</li>
                <li><strong>Timer</strong> — Set a countdown timer for focused practice blocks. An alarm sounds when time is up.</li>
                <li><strong>Audio Recorder</strong>Metronome — A built-in click track. Set your practice tempo right inside the journal. Use the slider to raise or lower the tempo, or push the plus and minus signs.</li>
                <li><strong>Staff Paper</strong> — A blank staff paper canvas accessible from the day tabs. Use it to jot down musical ideas, and your drawings are saved per day.</li>
              </ul>
            </section>

            {/* 6. Music AI Assistant */}
            <section>
              <h3 className="text-base font-semibold text-foreground mb-2">6. Music AI Assistant</h3>
              <p className="mb-2">Your journal includes a built-in AI music tutor, located in the right column of the practice log. Use it to:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Ask any music theory question — circle of fifths, scales, chord progressions, intervals, and more.</li>
                <li>Get personalized practice advice based on your current goals, repertoire, and notes.</li>
                <li>Explore starter prompts to get the conversation going quickly.</li>
              </ul>
              <p className="mt-2 text-muted-foreground text-xs">Note: Conversations reset each session — no history is stored.</p>
            </section>

            {/* 7. Sharing */}
            <section>
              <h3 className="text-base font-semibold text-foreground mb-2">7. Sharing Your Practice Log</h3>
              <p>Want to show your teacher or a friend what you worked on? Use the <strong>Share</strong> button to generate a unique link to a read-only view of your practice log for that day. Anyone with the link can see it — no account required.</p>
            </section>

            {/* 8. Community */}
            <section>
              <h3 className="text-base font-semibold text-foreground mb-2">8. Community</h3>
              <p>The Community page is a simple feed where you can post updates about your practice. Share milestones, ask questions, or cheer on fellow musicians. You need an active practice streak to post.</p>
            </section>

            {/* 9. Best Practices */}
            <section>
              <h3 className="text-base font-semibold text-foreground mb-2">9. Best Practices</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Set a goal every session</strong> — Even a simple one like "work on measure 12-16" gives your session direction.</li>
                <li><strong>Use the timer</strong> — Short, focused blocks (15-25 minutes) are more effective than long, unfocused sessions.</li>
                <li><strong>Record yourself</strong> — Listening back reveals things you miss in the moment. Use the audio recorder regularly.</li>
                <li><strong>Review your Dashboard weekly</strong> — Check your streak, hours, and graph to see patterns and stay motivated.</li>
                <li><strong>Fill in your log after every session</strong> — The habit of logging is just as valuable as the practice itself. It builds self-awareness.</li>
                <li><strong>Build your streak</strong> — Even 10 minutes counts. Consistency beats intensity for long-term growth.</li>
                <li><strong>Use checkboxes</strong> — Checking off completed items gives a satisfying sense of progress and helps you see what still needs work.</li>
              </ul>
            </section>

          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>);

}