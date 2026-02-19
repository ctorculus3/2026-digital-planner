

# Update Metronome Descriptions in How To Manual and Landing Page

## Overview
Update the metronome descriptions in two files to reflect the new time signature and accent features.

---

## 1. How To Manual (`src/components/HowToManual.tsx`)

**Section 5 — Built-in Tools — Metronome bullet:**

Current:
> Metronome -- A built-in click track. Set your practice tempo right inside the journal. Use the slider to raise or lower the tempo, or push the plus and minus signs.

Updated:
> Metronome -- A built-in click track with clave samples. Set your tempo (20-300 BPM) using the slider or the plus/minus buttons. Choose from common and complex time signatures including 2/4, 3/4, 4/4, 5/4, 5/8, 6/8, 6/8 in 2, and 7/8. Toggle Accent to hear a high-pitched click on downbeats, and select accent grouping patterns (e.g. 3+2 or 2+3) for asymmetric meters.

---

## 2. Landing Page (`src/pages/Landing.tsx`)

Three spots to update:

**a) Top Features card (line ~41):**

Current: `"Built-in clave-sample metronome, chromatic tuner with transposition, and a 12-key drone player — all inside your journal."`

Updated: `"Built-in metronome with time signatures, accent patterns, and clave samples — plus a chromatic tuner, and 12-key drone player, all inside your journal."`

**b) Pricing features list (line ~75):**

Current: `"Built-in metronome with clave sample"`

Updated: `"Built-in metronome with time signatures & accent patterns"`

**c) Benefits section (line ~335) -- no change needed** since "Built-in metronome, tuner & drone" is already accurate at the summary level.

---

## Files Modified
- `src/components/HowToManual.tsx` -- update metronome bullet text
- `src/pages/Landing.tsx` -- update two description strings

All changes are text-only. No logic or layout changes.

