

## Add a "How to Use Practice Daily" Manual

### What

Create an in-app user manual that explains how to use every feature of Practice Daily, along with best practices for getting the most out of daily music practice. The manual will be accessible via a help button placed in the top bar of both the Dashboard and Journal pages.

### Where the Button Goes

A small "How To" button (with a `HelpCircle` icon) will be added to the top navigation bar -- right next to the existing Manage Subscription and User Menu buttons. Since both the Dashboard and Journal pages share the same top-bar layout, the button will appear in both places.

Clicking the button opens a dialog/modal with the full manual content, organized into clearly labeled sections users can scroll through.

### Manual Content Outline

The manual will cover:

1. **Getting Started** -- What Practice Daily is and how to begin
2. **The Dashboard** -- Streak counter, practice calendar, hours summary, practice time graph, and badge shelf
3. **The Journal** -- How to navigate dates, months, and days; understanding the two-column layout
4. **Filling Out Your Practice Log**
   - Goals and Subgoals
   - Start/Stop Time tracking
   - Warm-ups and Scales
   - Repertoire and Exercises (with checkboxes and audio recordings)
   - Notes and Focus
   - Lesson PDFs
   - Ear Training, Additional Tasks, Music Listening
5. **Built-in Tools** -- Metronome, Tuner, Timer, Audio Recorder, Staff Paper
6. **Sharing Your Practice Log** -- How to generate and share a link
7. **Community** -- Posting updates and viewing the feed
8. **Best Practices** -- Tips like setting daily goals, using the timer, reviewing progress on the dashboard, and building streaks

### Technical Details

**New file:** `src/components/HowToManual.tsx`
- A dialog component using the existing `Dialog` UI primitive
- Contains all manual content as structured sections with headings and paragraphs
- Uses `ScrollArea` so the content is scrollable within the modal
- Triggered by a `Button` with a `HelpCircle` icon and "How To" label

**Modified files:**
- `src/pages/Dashboard.tsx` -- Import and add `<HowToManual />` button in the top bar alongside ManageSubscription and UserMenu
- `src/components/practice-log/PracticeLogCalendar.tsx` -- Same change, add the button to the Journal's top bar

No new dependencies or database changes needed.

