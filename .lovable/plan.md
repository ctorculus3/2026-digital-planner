

## Reorder Shared Practice Log: Lesson PDFs Before Media Tools

### Change

**File: `src/pages/SharedPracticeLog.tsx`**

Move the "Lesson PDF's" section (currently around lines 310-340) to appear **before** the "Media Tools" section (currently around lines 278-308). This is a straightforward cut-and-paste reorder of two JSX blocks -- no logic or data changes needed.

### Result

On the shared practice log page, the section order will be:
1. Goals / Subgoals
2. Time Tracking
3. Warmups / Scales
4. Repertoire / Notes / Ear Training / etc.
5. **Lesson PDF's** (moved up)
6. **Media Tools** (moved down)
7. Footer

