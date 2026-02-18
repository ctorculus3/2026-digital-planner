

## Update How To Manual and Landing Page with Latest Features

Three features need to be documented: the enhanced Tuner (with transposition and Match Sound), Music AI Voice playback, and the Copy From feature.

### 1. How To Manual (`src/components/HowToManual.tsx`)

**Tuner (Section 5 - Built-in Tools, line 98)**
- Expand the existing one-line Tuner bullet to mention instrument transposition (C, Bb, Eb, F keys) and the Match Sound reference tone feature.

**Music AI Voice (Section 6 - Music AI Assistant, lines 107-114)**
- Add a bullet point about voice playback: AI responses can be read aloud using text-to-speech, with auto-speak enabled by default and manual playback via speaker icons. Mention the monthly voice limit.

**Copy From (Section 4 - Filling Out Your Practice Log, after the Media Tools subsection ~line 90)**
- Add a new subsection called "Copy From Previous Day" explaining how users can duplicate a prior day's log via the Copy button and calendar picker, and that text fields are overwritten while media/PDFs are appended.

### 2. Landing Page (`src/pages/Landing.tsx`)

**Tuner feature card (line 38-41)**
- Update the description to mention transposition keys and Match Sound reference tone.

**Music AI feature card (line 54-57)**
- Update the description to mention voice playback / text-to-speech.

**Copy From - new feature card**
- Add a new entry to the `features` array with a `Copy` icon, title "Copy From Previous Day", and a description about duplicating logs.

**Pricing features list (line 84)**
- Add "Copy from previous days to reuse your practice template" and update the AI line to mention voice playback.

### Technical Notes

- The `features` array and `pricingFeatures` array in Landing.tsx are simple data arrays -- adding entries is straightforward.
- The `Copy` icon from lucide-react is already imported in the CopyFromButton; it will need to be added to the Landing page imports.
- No structural or architectural changes required -- all edits are content additions.

