

## Fix How To Manual: Repeated Words + Add Missing Feature Updates

### Issues to Fix

**1. Metronome repeated word (line 97)**
- Currently: `<strong>Metronome</strong>Metronome -- A built-in click track...`
- Fix to: `<strong>Metronome</strong> -- A built-in click track...`

**2. Audio Recorder repeated word + wrong description (line 100)**
- Currently: `<strong>Audio Recorder</strong>Audio Recorder -- A built-in click track...` (copy of Metronome text)
- Fix to: `<strong>Audio Recorder</strong> -- Record yourself practicing directly from the journal. Each repertoire row has its own recorder so you can track your progress over time. Play recordings back or download them to your device.`

### Missing Feature Updates to Add

**3. Tuner (line 98)**
- Expand to mention instrument transposition (C, Bb, Eb, F keys) and the Match Sound reference tone.

**4. Copy From Previous Day (new subsection after Media Tools, ~line 90)**
- Add a new subsection in Section 4 explaining how to duplicate a prior day's log via the Copy button and calendar picker. Text fields are overwritten; media and PDFs are appended.

**5. Music AI Voice (Section 6, after existing bullets ~line 112)**
- Add a bullet about voice playback: AI responses can be read aloud via text-to-speech, with auto-speak on by default and manual playback via speaker icons. Mention the monthly voice limit.

### Files Changed
- `src/components/HowToManual.tsx` -- all fixes are in this single file

