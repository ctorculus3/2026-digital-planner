

# Fix 6/8. (Dotted) Time Signature — "6/8 in 2"

## The Problem
Currently, 6/8. plays 6 clicks per measure with accents on beats 1 and 4. It should only produce **2 audible clicks** — one on beat 1 and one on beat 4 — with beats 2, 3, 5, 6 being completely silent. This is the "6/8 in 2" feel: Click (rest rest) Click (rest rest).

## The Fix

### 1. Update the pattern encoding
Change the 6/8. pattern from `[1, 0, 0, 1, 0, 0]` to `[1, -1, -1, 1, -1, -1]`, where:
- `1` = audible click (accent sound)
- `0` = audible click (normal sound)  
- `-1` = **silent** (no sound at all)

### 2. Update `playClick` logic
Add a check: if the current beat value is `-1`, skip playing any sound and just advance the beat counter. This is a small change — just one `if` check before the existing sound logic.

### Technical Details

**File: `src/components/practice-log/Metronome.tsx`**

Pattern change (line ~43):
```typescript
"6/8.": {
  beats: 6, subdivision: 8,
  patterns: [[1, -1, -1, 1, -1, -1]],  // only 2 clicks per measure
},
```

playClick change (around line 124):
```typescript
const playClick = useCallback(() => {
  const ctx = audioCtxRef.current;
  if (!ctx) return;

  const sig = TIME_SIGNATURES[timeSigRef.current];
  const pattern = sig.patterns[accentPatternIndexRef.current] ?? sig.patterns[0];
  const beatValue = pattern[beatIndexRef.current];

  // -1 means silent beat — skip sound entirely
  if (beatValue !== -1) {
    const isAccent = accentOnRef.current && beatValue === 1;
    const buffer = isAccent ? hiClaveBufferRef.current : claveBufferRef.current;
    // ... existing sound playback logic unchanged ...
  }

  beatIndexRef.current = (beatIndexRef.current + 1) % pattern.length;
}, []);
```

Only one file modified. All other time signatures and existing functionality remain untouched.
