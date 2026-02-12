
## Add Practice Timer

A new `Timer` component will be created and placed directly beneath the Tuner section in the practice log form.

### Features
- **Preset intervals**: 15 min, 20 min, 30 min buttons for quick selection
- **Custom time**: An input field where users can enter any number of minutes
- **Countdown display**: Shows remaining time in MM:SS format
- **Bell sound**: Plays a bell/chime when the timer reaches zero using the Web Audio API (synthesized tone, no external file needed)
- **Start / Stop / Reset controls**

### Technical Details

#### 1. New file: `src/components/practice-log/Timer.tsx`
- Three preset buttons (15, 20, 30 min) that set the duration on click
- A small numeric input for custom minutes
- Start/Pause button toggles the countdown
- Reset button clears the timer
- Countdown runs via `setInterval` with 1-second ticks
- When the timer hits zero, a bell sound is synthesized using the Web Audio API (`OscillatorNode` with a decaying gain envelope to simulate a bell chime)
- Visual style will match the existing Metronome/Tuner components: dark card background, rounded layout, consistent button sizing

#### 2. Edit: `src/components/practice-log/PracticeLogForm.tsx`
- Import `Timer` component
- Add a new card section immediately after the Tuner block (after line 556), with the label "Timer" and the `<Timer />` component inside
