

## Fix: Timer Bell Not Playing

### Problem
The bell doesn't sound when the timer reaches zero. This is caused by the browser's **autoplay policy** -- creating a new `AudioContext` inside a `setInterval` callback is blocked because it's not a direct user gesture (like a click or tap).

### Solution
Pre-create the `AudioContext` when the user clicks **Start** (which IS a user gesture), and keep a reference to it. When the timer finishes, reuse that already-unlocked context to play the bell.

### Changes to `src/components/practice-log/Timer.tsx`

1. **Add a ref** to hold the `AudioContext`:
   - `const audioCtxRef = useRef<AudioContext | null>(null);`

2. **Create/resume the context on Start** (inside the `start` function, which runs on a user click):
   - If no context exists, create one. If it's in a "suspended" state, resume it.

3. **Update `playBell`** to accept an existing `AudioContext` instead of creating a new one:
   - Change signature to `playBell(ctx: AudioContext)`
   - Remove the `new AudioContext()` and `ctx.close()` calls from inside `playBell`

4. **Call `playBell(audioCtxRef.current)`** when the countdown hits zero (line 53), passing the pre-unlocked context.

5. **Clean up** the AudioContext in the component's unmount effect.

### What stays the same
- All timer logic (presets, custom input, countdown, start/stop/reset)
- The bell sound itself (same oscillator frequency sweep and gain envelope)
- All UI and styling
