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

export function StudioHowTo() {
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
          <DialogTitle className="text-xl font-display">How to Use the Teacher Studio</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[70vh] px-6 pb-6">
          <div className="space-y-6 pr-4 text-sm text-foreground/90 leading-relaxed">

            {/* 1. What Is the Studio? */}
            <section>
              <h3 className="text-base font-semibold text-foreground mb-2">1. What Is the Studio?</h3>
              <p>
                The Teacher Studio is your command center for managing students. From here you can invite students to your studio, monitor their practice activity at a glance, view their daily practice logs, leave comments and feedback, upload lesson PDFs, and set weekly assignments — all in one place.
              </p>
              <p className="mt-2 text-muted-foreground text-xs">Note: A Teacher subscription is required to access Studio features.</p>
            </section>

            {/* 2. Creating Your Studio */}
            <section>
              <h3 className="text-base font-semibold text-foreground mb-2">2. Creating Your Studio</h3>
              <p>
                When you first visit the Studio page, you'll see a prompt to create your teaching studio. Click <strong>Get Started</strong>, enter your studio name (e.g. "Ms. Johnson's Piano Studio"), and you're ready to go. You can only have one studio at a time.
              </p>
            </section>

            {/* 3. Inviting Students */}
            <section>
              <h3 className="text-base font-semibold text-foreground mb-2">3. Inviting Students</h3>
              <p className="mb-2">Once your studio is created, you'll see an invite code and a shareable join link at the top of your studio dashboard.</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Invite Code</strong> — A short alphanumeric code displayed prominently. Copy it and share it with your students directly.</li>
                <li><strong>Join Link</strong> — A clickable link students can open in their browser. Click "Copy join link" to copy the full URL to your clipboard.</li>
                <li><strong>Student Capacity</strong> — Your studio supports up to 30 students. The current count is shown below your studio name.</li>
              </ul>
              <p className="mt-2">When a student opens the join link (or navigates to it manually), they'll see your studio name and can confirm they want to join. They need to be signed in to Practice Daily first. Once they join, they'll appear in your student list.</p>
            </section>

            {/* 4. The Student List */}
            <section>
              <h3 className="text-base font-semibold text-foreground mb-2">4. The Student List</h3>
              <p className="mb-2">Your student list shows all enrolled students in a table with four columns:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Student</strong> — The student's display name. Click their name to view their practice logs.</li>
                <li><strong>Status</strong> — A color-coded indicator showing practice consistency:
                  <ul className="list-disc pl-5 mt-1 space-y-0.5">
                    <li><span className="text-primary font-medium">On track</span> — practiced today or yesterday</li>
                    <li><span className="font-medium">Missed a day</span> — last practiced 2 days ago</li>
                    <li><span className="text-destructive font-medium">X days missed</span> — 3+ days since last practice</li>
                  </ul>
                </li>
                <li><strong>Streak</strong> — How many consecutive days the student has practiced.</li>
                <li><strong>This Week</strong> — Total practice time logged for the current week (Monday through Sunday).</li>
              </ul>
              <p className="mt-2">Use the <strong>remove</strong> button (person icon with minus) on the right to remove a student from your studio.</p>
            </section>

            {/* 5. Viewing Student Practice Logs */}
            <section>
              <h3 className="text-base font-semibold text-foreground mb-2">5. Viewing Student Practice Logs</h3>
              <p className="mb-2">Click on any student's name to open their practice log viewer. You'll see a read-only view of everything they logged for that day:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Goals and subgoals</li>
                <li>Start time, stop time, and total practice time</li>
                <li>Warm-ups and scales</li>
                <li>Repertoire & exercises (with completion status and audio recordings)</li>
                <li>Notes & focus</li>
                <li>Ear training, music listening, and additional tasks</li>
                <li>Lesson PDFs</li>
                <li>Media items (audio, video, photos, YouTube embeds)</li>
              </ul>
              <p className="mt-2">Use the <strong>date navigator</strong> at the top to move between days — arrows to go forward/back, or the "Today" button to jump to the current date. Click the <strong>back arrow</strong> to return to your studio dashboard.</p>
            </section>

            {/* 6. Leaving Teacher Comments */}
            <section>
              <h3 className="text-base font-semibold text-foreground mb-2">6. Leaving Teacher Comments</h3>
              <p>
                Below each student's practice log, you'll find the <strong>Teacher Comment</strong> panel. Click "Leave a comment" to open a text area where you can write feedback specific to that day's practice session. Your comment is saved per student, per date — so you can leave different feedback for each day. You can edit or delete a comment at any time.
              </p>
            </section>

            {/* 7. Weekly Assignments */}
            <section>
              <h3 className="text-base font-semibold text-foreground mb-2">7. Weekly Assignments</h3>
              <p className="mb-2">The <strong>Weekly Assignment</strong> panel lets you set structured assignments for each student, organized by week. Each assignment includes:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Goals & Subgoals</strong> — Write the main objectives for the week.</li>
                <li><strong>Repertoire</strong> — List the pieces and exercises the student should work on.</li>
                <li><strong>Warm-ups</strong> — Specify warm-up routines.</li>
                <li><strong>Scales</strong> — Assign scales to practice.</li>
                <li><strong>Ear Training</strong> — Set ear training exercises.</li>
                <li><strong>Additional Tasks</strong> — Any extra assignments or activities.</li>
                <li><strong>Notes</strong> — Free-form notes for the student.</li>
              </ul>
              <p className="mt-2">Use the <strong>left/right arrows</strong> to navigate between weeks. Each section starts with 4 rows, and you can add more (up to 10) with the <strong>+</strong> button. Click <strong>Save Assignment</strong> to save, or <strong>Delete</strong> to remove an assignment for that week.</p>
            </section>

            {/* 8. Uploading Lesson PDFs */}
            <section>
              <h3 className="text-base font-semibold text-foreground mb-2">8. Uploading Lesson PDFs</h3>
              <p>
                When viewing a student's practice log, you can upload lesson PDFs directly to their log for that date. Click <strong>Choose PDF</strong> in the "Upload Lesson PDF" section and select a file from your device. PDFs must be under 20MB. The uploaded PDF will appear in the student's Lesson PDFs section, where both you and the student can view it.
              </p>
            </section>

            {/* 9. Tips for Teachers */}
            <section>
              <h3 className="text-base font-semibold text-foreground mb-2">9. Tips for Teachers</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Check in regularly</strong> — Glance at the student list daily to spot students who may be falling behind.</li>
                <li><strong>Use status colors</strong> — The color-coded status makes it easy to identify who needs encouragement.</li>
                <li><strong>Leave specific feedback</strong> — Comments tied to a specific day are more actionable than general advice.</li>
                <li><strong>Set weekly assignments early</strong> — Give students clear direction at the start of each week.</li>
                <li><strong>Upload relevant materials</strong> — Lesson PDFs keep everything in one place so students can reference them during practice.</li>
                <li><strong>Celebrate streaks</strong> — Acknowledge students who maintain long practice streaks to keep them motivated.</li>
              </ul>
            </section>

          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>);

}
