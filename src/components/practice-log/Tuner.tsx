import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Volume2 } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const TRANSPOSITION_OFFSETS: Record<string, number> = {
  C: 0,
  Bb: 2,
  Eb: 9,
  F: 5,
};

// Segment colors from left (very flat) to right (very sharp)
const SEGMENT_COLORS = [
  "hsl(0, 100%, 60%)",
  "hsl(25, 100%, 60%)",
  "hsl(45, 100%, 55%)",
  "hsl(55, 100%, 55%)",
  "hsl(140, 90%, 50%)",
  "hsl(55, 100%, 55%)",
  "hsl(45, 100%, 55%)",
  "hsl(25, 100%, 60%)",
  "hsl(0, 100%, 60%)",
];

const SEGMENT_GLOWS = [
  "0 0 10px hsl(0, 100%, 60%)",
  "0 0 10px hsl(25, 100%, 60%)",
  "0 0 10px hsl(45, 100%, 55%)",
  "0 0 10px hsl(55, 100%, 55%)",
  "0 0 12px hsl(140, 90%, 50%)",
  "0 0 10px hsl(55, 100%, 55%)",
  "0 0 10px hsl(45, 100%, 55%)",
  "0 0 10px hsl(25, 100%, 60%)",
  "0 0 10px hsl(0, 100%, 60%)",
];

const SEGMENT_COUNT = SEGMENT_COLORS.length;

function autoCorrelate(buffer: Float32Array, sampleRate: number): number {
  let rms = 0;
  for (let i = 0; i < buffer.length; i++) {
    rms += buffer[i] * buffer[i];
  }
  rms = Math.sqrt(rms / buffer.length);
  if (rms < 0.01) return -1;

  let r1 = 0;
  let r2 = buffer.length - 1;
  const threshold = 0.2;
  for (let i = 0; i < buffer.length / 2; i++) {
    if (Math.abs(buffer[i]) < threshold) { r1 = i; break; }
  }
  for (let i = 1; i < buffer.length / 2; i++) {
    if (Math.abs(buffer[buffer.length - i]) < threshold) { r2 = buffer.length - i; break; }
  }

  const buf = buffer.slice(r1, r2);
  const c = new Float32Array(buf.length);

  for (let i = 0; i < buf.length; i++) {
    for (let j = 0; j < buf.length - i; j++) {
      c[i] += buf[j] * buf[j + i];
    }
  }

  let d = 0;
  while (c[d] > c[d + 1]) {
    d++;
    if (d >= c.length - 1) return -1;
  }

  let maxVal = -1;
  let maxPos = -1;
  for (let i = d; i < c.length; i++) {
    if (c[i] > maxVal) {
      maxVal = c[i];
      maxPos = i;
    }
  }

  const t0 = maxPos > 0 ? c[maxPos - 1] : c[maxPos];
  const t1 = c[maxPos];
  const t2 = maxPos < c.length - 1 ? c[maxPos + 1] : c[maxPos];
  const a = (t0 + t2 - 2 * t1) / 2;
  const b = (t2 - t0) / 2;
  if (a) {
    maxPos = maxPos - b / (2 * a);
  }

  return sampleRate / maxPos;
}

function frequencyToNote(freq: number): { note: string; octave: number; cents: number; midiNote: number } {
  const noteNum = 12 * Math.log2(freq / 440) + 69;
  const roundedNote = Math.round(noteNum);
  const cents = Math.round((noteNum - roundedNote) * 100);
  const noteName = NOTE_NAMES[(roundedNote % 12 + 12) % 12];
  const octave = Math.floor(roundedNote / 12) - 1;
  return { note: noteName, octave, cents, midiNote: roundedNote };
}

function transposeNoteName(midiNote: number, offset: number): { note: string; octave: number } {
  const transposed = midiNote + offset;
  const note = NOTE_NAMES[(transposed % 12 + 12) % 12];
  const octave = Math.floor(transposed / 12) - 1;
  return { note, octave };
}

function midiToFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function centsToSegmentIndex(cents: number): number {
  const normalized = (cents + 50) / 100;
  const idx = Math.round(normalized * (SEGMENT_COUNT - 1));
  return Math.max(0, Math.min(SEGMENT_COUNT - 1, idx));
}

export function Tuner() {
  const [isListening, setIsListening] = useState(false);
  const [detectedNote, setDetectedNote] = useState<string | null>(null);
  const [detectedOctave, setDetectedOctave] = useState<number | null>(null);
  const [cents, setCents] = useState(0);
  const [activeSegment, setActiveSegment] = useState<number | null>(null);
  const [transposition, setTransposition] = useState("C");
  const [matchSoundEnabled, setMatchSoundEnabled] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const bufferRef = useRef<any>(null);

  // Match sound refs
  const stablePitchRef = useRef<{ midiNote: number; since: number } | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const outputCtxRef = useRef<AudioContext | null>(null);
  const matchSoundEnabledRef = useRef(false);
  const transpositionRef = useRef("C");

  // Keep refs in sync with state
  useEffect(() => { matchSoundEnabledRef.current = matchSoundEnabled; }, [matchSoundEnabled]);
  useEffect(() => { transpositionRef.current = transposition; }, [transposition]);

  const stopOscillator = useCallback(() => {
    if (gainNodeRef.current && oscillatorRef.current) {
      try {
        gainNodeRef.current.gain.setTargetAtTime(0, gainNodeRef.current.context.currentTime, 0.05);
        const osc = oscillatorRef.current;
        setTimeout(() => { try { osc.stop(); } catch {} }, 100);
      } catch {}
    }
    oscillatorRef.current = null;
    gainNodeRef.current = null;
  }, []);

  const detect = useCallback(() => {
    if (!analyserRef.current || !bufferRef.current) return;

    analyserRef.current.getFloatTimeDomainData(bufferRef.current);
    const freq = autoCorrelate(bufferRef.current, audioCtxRef.current!.sampleRate);

    if (freq > 0 && freq < 5000) {
      const { note, octave, cents: c, midiNote } = frequencyToNote(freq);

      // Apply transposition for display
      const offset = TRANSPOSITION_OFFSETS[transpositionRef.current] || 0;
      if (offset === 0) {
        setDetectedNote(note);
        setDetectedOctave(octave);
      } else {
        const t = transposeNoteName(midiNote, offset);
        setDetectedNote(t.note);
        setDetectedOctave(t.octave);
      }

      setCents(c);
      setActiveSegment(centsToSegmentIndex(c));

      // Match sound logic
      const now = performance.now();
      if (stablePitchRef.current && Math.abs(stablePitchRef.current.midiNote - midiNote) <= 1) {
        // Same note sustained (±1 semitone tolerance)
        if (matchSoundEnabledRef.current && !oscillatorRef.current && (now - stablePitchRef.current.since > 500)) {
          // Start reference tone using dedicated output context
          const ctx = outputCtxRef.current;
          if (!ctx) return;
          if (ctx.state === 'suspended') ctx.resume();
          // Reference tone started
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "triangle";
          osc.frequency.value = midiToFrequency(midiNote);
          gain.gain.value = 0;
          gain.gain.setTargetAtTime(0.25, ctx.currentTime, 0.08);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          oscillatorRef.current = osc;
          gainNodeRef.current = gain;
        }
      } else {
        // Pitch changed — update oscillator frequency instead of stopping
        if (oscillatorRef.current) {
          oscillatorRef.current.frequency.value = midiToFrequency(midiNote);
        }
        stablePitchRef.current = { midiNote, since: now };
      }
    } else {
      setActiveSegment(null);
      stopOscillator();
      stablePitchRef.current = null;
    }

    rafRef.current = requestAnimationFrame(detect);
  }, [stopOscillator]);

  const startListening = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const ctx = new AudioContext();
      audioCtxRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      analyserRef.current = analyser;
      bufferRef.current = new Float32Array(analyser.fftSize) as Float32Array<ArrayBuffer>;

      setIsListening(true);
      rafRef.current = requestAnimationFrame(detect);
    } catch {
      console.error("Microphone access denied");
    }
  }, [detect]);

  const stopListening = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    stopOscillator();
    stablePitchRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    audioCtxRef.current?.close();
    audioCtxRef.current = null;
    outputCtxRef.current?.close();
    outputCtxRef.current = null;
    analyserRef.current = null;
    streamRef.current = null;
    bufferRef.current = null;
    setIsListening(false);
    setDetectedNote(null);
    setDetectedOctave(null);
    setCents(0);
    setActiveSegment(null);
  }, [stopOscillator]);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      stopOscillator();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      audioCtxRef.current?.close();
      outputCtxRef.current?.close();
    };
  }, [stopOscillator]);

  return (
    <div className="mt-3 rounded-lg p-3 flex flex-col items-center gap-2 mx-0 bg-[hsl(var(--time-section-bg))]">
      {/* Transposition toggle */}
      <ToggleGroup
        type="single"
        value={transposition}
        onValueChange={(v) => { if (v) setTransposition(v); }}
        className="gap-1"
      >
        {Object.keys(TRANSPOSITION_OFFSETS).map((key) => (
          <ToggleGroupItem
            key={key}
            value={key}
            variant="outline"
            size="sm"
            className="text-xs px-2.5 h-7 font-semibold"
          >
            {key}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      {/* Mic button + label */}
      <div className="flex flex-col items-center gap-1">
        <Button
          type="button"
          size="icon"
          variant={isListening ? "destructive" : "default"}
          className="rounded-full w-8 h-8 shrink-0"
          onClick={isListening ? stopListening : startListening}
        >
          {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
        </Button>
        {!detectedNote && (
          <p className="text-xs text-muted-foreground">
            {isListening ? "Listening…" : "Tap mic to begin tuning"}
          </p>
        )}
      </div>

      {/* Circle gauge */}
      <div className="flex items-center gap-1.5">
        <span className="text-sm text-muted-foreground font-semibold mr-1">♭</span>
        {SEGMENT_COLORS.map((color, i) => {
          const isActive = activeSegment === i;
          const isCenter = i === 4;
          const size = isCenter ? "w-5 h-5" : "w-4 h-4";
          return (
            <div
              key={i}
              className={`rounded-full ${size} transition-all duration-150`}
              style={{
                backgroundColor: isActive ? color : "hsl(0, 0%, 75%)",
                opacity: isActive ? 1 : 0.4,
                boxShadow: isActive ? SEGMENT_GLOWS[i] : "none",
              }}
            />
          );
        })}
        <span className="text-sm text-muted-foreground font-semibold ml-1">♯</span>
      </div>

      {/* Match Sound toggle */}
      <Button
        type="button"
        variant={matchSoundEnabled ? "destructive" : "default"}
        size="sm"
        className="text-xs h-7 gap-1"
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
      >
        <Volume2 className="w-3 h-3" />
        Match Sound
      </Button>

      {/* Note display */}
      {isListening && detectedNote && (
        <div className="text-center">
          <span className="text-2xl font-bold font-display text-foreground">
            {detectedNote}
            <span className="text-sm text-muted-foreground">{detectedOctave}</span>
          </span>
          <p className="text-xs text-muted-foreground">
            {cents === 0 ? "In tune ✓" : `${cents > 0 ? "+" : ""}${cents}¢`}
          </p>
        </div>
      )}
    </div>
  );
}
