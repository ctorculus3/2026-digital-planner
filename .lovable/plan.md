
# Restore Audio Recording Buttons

## Overview

The AudioRecorder component was accidentally removed during the previous update. This plan restores all the missing audio recording functionality in the Repertoire & Exercises section.

---

## What's Missing

| Component | Status |
|-----------|--------|
| AudioRecorder import | Missing |
| repertoireRecordings state | Missing |
| Recording event handlers | Missing |
| Data loading from database | Missing |
| Data saving to database | Hardcoded as empty array |
| AudioRecorder in UI | Not rendered |

---

## Changes Required

### File: `src/components/practice-log/PracticeLogForm.tsx`

**1. Add Import (Line 8)**

Add the AudioRecorder component to imports.

**2. Add State Variable (after line 83)**

Add state to track recording file paths for each repertoire item:
- `repertoireRecordings` - array of 15 strings for file paths

**3. Add Event Handlers (after line 277)**

Two callback functions:
- `handleRecordingComplete` - saves the file path when recording finishes
- `handleRecordingDeleted` - clears the file path when recording is deleted

Both will call `markChanged()` to trigger auto-save.

**4. Load Data from Database (in useEffect, around line 146)**

After loading `repertoire_completed`, also load `repertoire_recordings` from the database.

**5. Reset Data for New Days (around line 186)**

Reset `repertoireRecordings` to an empty array when switching to a new day with no data.

**6. Update Save Payload (line 225)**

Change from `repertoire_recordings: []` to pass the actual `repertoireRecordings` state.

**7. Add AudioRecorder to Repertoire Rows (lines 437-440)**

Add the AudioRecorder component to each repertoire row, positioned after the text input.

---

## Visual Result

Each repertoire row will show:

```text
[Checkbox] [Text Input                    ] [Mic/Play Button]
```

- Empty row shows a microphone icon to start recording
- Recording in progress shows a pulsing stop button
- Completed recording shows play/delete buttons

---

## Summary

This is a restoration of existing functionality, not new code. All the patterns already exist in the codebase - they just need to be re-added to the form component.
