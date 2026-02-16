

## Fix Match Sound: Use Separate Audio Output Context

### Root Cause

The real problem is that on mobile browsers (especially iOS Safari), an `AudioContext` created with `getUserMedia` for microphone input often cannot simultaneously output sound. The browser ties that context to the input routing and blocks or silences audio output through it. All previous fixes (resume, volume) were applied to this same blocked context.

### Solution: Dedicated Output AudioContext

Create a **separate AudioContext** specifically for sound output, initialized on the "Match Sound" button tap (which is a user gesture, satisfying browser autoplay policies). The mic input continues using its own context. The oscillator plays through the output context.

### Changes in `src/components/practice-log/Tuner.tsx`

#### 1. Add a new ref for the output AudioContext
```typescript
const outputCtxRef = useRef<AudioContext | null>(null);
```

#### 2. Create output context on Match Sound button click (user gesture)
When the user taps "Match Sound" to enable it, create the output AudioContext immediately. This satisfies iOS Safari's requirement that audio contexts are created/resumed from a user gesture:
```typescript
onClick={() => {
  if (matchSoundEnabled) {
    stopOscillator();
    outputCtxRef.current?.close();
    outputCtxRef.current = null;
  } else {
    // Create output context on user gesture - critical for iOS
    const outCtx = new AudioContext();
    outputCtxRef.current = outCtx;
  }
  setMatchSoundEnabled(!matchSoundEnabled);
}}
```

#### 3. Use the output context for the oscillator (in detect loop)
Change the oscillator creation (around line 189) to use `outputCtxRef.current` instead of `audioCtxRef.current`:
```typescript
const ctx = outputCtxRef.current;
if (!ctx) return; // safety check
if (ctx.state === 'suspended') ctx.resume();
const osc = ctx.createOscillator();
// ... rest stays the same
```

#### 4. Clean up output context on stop/unmount
- In `stopListening`: close `outputCtxRef.current` and set to null
- In the cleanup `useEffect`: close `outputCtxRef.current`

#### 5. Add console.log for debugging (temporary)
Add a log when the oscillator starts so we can verify the code path is reached:
```typescript
console.log("Match Sound: playing reference tone at", midiToFrequency(midiNote), "Hz");
```

### What stays the same
- All pitch detection logic, transposition, gauge, UI layout unchanged
- Triangle waveform, 500ms threshold, 1-semitone tolerance unchanged
- The mic input AudioContext (`audioCtxRef`) is untouched

