

## Fix: Show Repertoire Completion Status on Shared Practice Logs

### Problem

The shared practice log view always shows empty circles next to Repertoire items, even when they were checked off as completed. The `repertoire_completed` array is neither fetched from the database nor included in the data interface, and the `music_listening` / `music_listening_completed` fields are also missing.

### Solution

Three small, targeted changes in `src/pages/SharedPracticeLog.tsx`:

1. **Add missing fields to the `PracticeLogData` interface** -- add `repertoire_completed`, `music_listening`, and `music_listening_completed`.

2. **Add the missing fields to the SELECT query** (line 88) -- include `repertoire_completed, music_listening, music_listening_completed`.

3. **Update the repertoire circle rendering** (line 308) -- change the static empty circle to a conditional one that fills in when `repertoire_completed[idx]` is true, matching the same pattern already used for Ear Training and Additional Tasks.

4. **Add a Music Listening section** to the shared view, following the same pattern as Ear Training and Additional Tasks.

### What stays the same

- No database or RLS changes needed
- No changes to any other files
- Ear Training and Additional Tasks completion circles already work correctly

