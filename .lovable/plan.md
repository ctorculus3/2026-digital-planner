

## Fix: Always Show All Sections on Shared Practice Log

### What I Found

After testing the shared link in a browser, I confirmed:
- **"Used Metronome"** and **"Music Listening"** (with its completion circle) ARE actually rendering correctly with the latest code changes
- **"Ear Training"** and **"Additional Tasks"** are hidden because those arrays are empty (`[]`) in the database for the Feb 10 log -- the code only shows those sections when they contain data

The issue is likely one of two things:
1. You may be seeing a cached version of the page (try a hard refresh)
2. The sections are hidden when they have no entries, unlike the journal view which always shows them

### Proposed Changes

**File: `src/pages/SharedPracticeLog.tsx`**

Make all four sections always visible on the shared view, even when empty, to match the journal:

1. **"Used Metronome Today"** -- already shows when `metronome_used` is true. Change it to always render, showing either a checkmark or an unchecked state (currently it hides entirely when `false`).

2. **Ear Training** -- remove the conditional that hides it when the array is empty. Show "No ear training recorded" placeholder when empty.

3. **Additional Tasks** -- same treatment: always show with an empty-state message.

4. **Music Listening** -- same treatment: always show with an empty-state message.

5. All completion circles already use the correct conditional logic (`bg-primary border-primary` when completed) -- no changes needed there.

### Technical Details

For each section, replace the conditional wrapper like:
```
{practiceLog.ear_training && practiceLog.ear_training.filter(e => e).length > 0 && (...)}
```
with an always-rendered block that shows a placeholder when empty:
```
<div className="bg-card rounded-lg p-4 shadow-sm border border-border">
  <h3 ...>Ear Training</h3>
  {hasItems ? <ul>...</ul> : <p className="text-muted-foreground italic">No ear training recorded</p>}
</div>
```

For metronome, change from conditional render to always showing:
- `true`: "Used Metronome Today" with checkmark
- `false`/`null`: "Used Metronome Today" with unchecked indicator

### What stays the same
- No database or RLS changes
- No changes to other files
- Completion circle logic is already correct

