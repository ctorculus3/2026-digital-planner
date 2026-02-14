

## Add Music AI Assistant to Landing Page and How To Manual

### Overview

Promote the Music AI Assistant as a key feature on both the Landing page and the in-app How To manual, highlighting that users get an AI music theory tutor built right into their journal.

### Changes

**1. `src/pages/Landing.tsx`** -- 2 additions:

- Add a new entry to the `features` array (using the `Sparkles` icon from lucide-react):
  - Title: "Music AI Assistant"
  - Description: "Ask music theory questions, get practice advice, and receive personalized coaching — all powered by AI, right inside your journal."
- Add `Sparkles` to the lucide-react import
- Add a line to the `pricingFeatures` array: "Music AI assistant for theory questions & practice coaching"

**2. `src/components/HowToManual.tsx`** -- 1 addition:

- Add a new section (Section 5.5 or renumber to fit) between "Built-in Tools" and "Sharing" titled **"Music AI Assistant"** with content explaining:
  - Located in the right column of the journal
  - Ask any music theory question (circle of fifths, scales, chords, etc.)
  - Get personalized practice advice based on your current goals, repertoire, and notes
  - Starter prompts are provided to get you going
  - Conversation resets each session (no history stored)

### No Existing Features Affected

All changes are purely additive -- new array entries and a new manual section. No existing content is modified or removed.

