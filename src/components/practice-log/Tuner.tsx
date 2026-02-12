import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff } from "lucide-react";

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

// Segment colors from left (very flat) to right (very sharp)
// 9 segments: 2 red, 2 orange, 2 yellow, 1 green center, then mirror
const SEGMENT_COLORS = [
"hsl(0, 100%, 60%)", // far flat - bright red
"hsl(25, 100%, 60%)", // flat - bright orange
"hsl(45, 100%, 55%)", // slightly flat - bright amber
"hsl(55, 100%, 55%)", // almost - bright yellow
"hsl(140, 90%, 50%)", // in tune - bright green
"hsl(55, 100%, 55%)", // almost - bright yellow
"hsl(45, 100%, 55%)", // slightly sharp - bright amber
"hsl(25, 100%, 60%)", // sharp - bright orange
"hsl(0, 100%, 60%)" // far sharp - bright red
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
"0 0 10px hsl(0, 100%, 60%)"
];

const SEGMENT_COUNT = SEGMENT_COLORS.length;

function autoCorrelate(buffer: Float32Array, sampleRate: number): number {
  // Check if there's enough signal
  let rms = 0;
  for (let i = 0; i < buffer.length; i++) {
    rms += buffer[i] * buffer[i];
  }
  rms = Math.sqrt(rms / buffer.length);
  if (rms < 0.01) return -1; // not enough signal

  // Trim silence from ends
  let r1 = 0;
  let r2 = buffer.length - 1;
  const threshold = 0.2;
  for (let i = 0; i < buffer.length / 2; i++) {
    if (Math.abs(buffer[i]) < threshold) {r1 = i;break;}
  }
  for (let i = 1; i < buffer.length / 2; i++) {
    if (Math.abs(buffer[buffer.length - i]) < threshold) {r2 = buffer.length - i;break;}
  }

  const buf = buffer.slice(r1, r2);
  const c = new Float32Array(buf.length);

  for (let i = 0; i < buf.length; i++) {
    for (let j = 0; j < buf.length - i; j++) {
      c[i] += buf[j] * buf[j + i];
    }
  }

  // Find first dip
  let d = 0;
  while (c[d] > c[d + 1]) {
    d++;
    if (d >= c.length - 1) return -1;
  }

  // Find peak after dip
  let maxVal = -1;
  let maxPos = -1;
  for (let i = d; i < c.length; i++) {
    if (c[i] > maxVal) {
      maxVal = c[i];
      maxPos = i;
    }
  }

  // Parabolic interpolation for better precision
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

function frequencyToNote(freq: number): {note: string;octave: number;cents: number;} {
  const noteNum = 12 * Math.log2(freq / 440) + 69;
  const roundedNote = Math.round(noteNum);
  const cents = Math.round((noteNum - roundedNote) * 100);
  const noteName = NOTE_NAMES[(roundedNote % 12 + 12) % 12];
  const octave = Math.floor(roundedNote / 12) - 1;
  return { note: noteName, octave, cents };
}

function centsToSegmentIndex(cents: number): number {
  // Map -50..+50 cents to segment 0..8
  // Center (0 cents) = segment 4
  const normalized = (cents + 50) / 100; // 0..1
  const idx = Math.round(normalized * (SEGMENT_COUNT - 1));
  return Math.max(0, Math.min(SEGMENT_COUNT - 1, idx));
}

export function Tuner() {
  const [isListening, setIsListening] = useState(false);
  const [detectedNote, setDetectedNote] = useState<string | null>(null);
  const [detectedOctave, setDetectedOctave] = useState<number | null>(null);
  const [cents, setCents] = useState(0);
  const [activeSegment, setActiveSegment] = useState<number | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const bufferRef = useRef<any>(null);

  const detect = useCallback(() => {
    if (!analyserRef.current || !bufferRef.current) return;

    analyserRef.current.getFloatTimeDomainData(bufferRef.current);
    const freq = autoCorrelate(bufferRef.current, audioCtxRef.current!.sampleRate);

    if (freq > 0 && freq < 5000) {
      const { note, octave, cents: c } = frequencyToNote(freq);
      setDetectedNote(note);
      setDetectedOctave(octave);
      setCents(c);
      setActiveSegment(centsToSegmentIndex(c));
    } else {
      setActiveSegment(null);
    }

    rafRef.current = requestAnimationFrame(detect);
  }, []);

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
    streamRef.current?.getTracks().forEach((t) => t.stop());
    audioCtxRef.current?.close();
    audioCtxRef.current = null;
    analyserRef.current = null;
    streamRef.current = null;
    bufferRef.current = null;
    setIsListening(false);
    setDetectedNote(null);
    setDetectedOctave(null);
    setCents(0);
    setActiveSegment(null);
  }, []);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      audioCtxRef.current?.close();
    };
  }, []);

  return (
    <div className="mt-3 rounded-lg p-3 flex flex-col items-center gap-2 mx-0 bg-[#103e84]">
      {/* Mic button + label */}
      <div className="flex flex-col items-center gap-1">
        <Button
          type="button"
          size="icon"
          variant={isListening ? "destructive" : "default"}
          className="rounded-full w-8 h-8 shrink-0"
          onClick={isListening ? stopListening : startListening}>
          {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
        </Button>
        {!detectedNote && (
          <p className="text-xs text-neutral-400">
            {isListening ? "Listening…" : "Tap mic"}
          </p>
        )}
      </div>

      {/* Circle gauge */}
      <div className="flex items-center gap-1.5">
        <span className="text-sm text-neutral-400 font-semibold mr-1">♭</span>
        {SEGMENT_COLORS.map((color, i) => {
          const isActive = activeSegment === i;
          const isCenter = i === 4;
          const size = isCenter ? "w-5 h-5" : "w-4 h-4";
          return (
            <div
              key={i}
              className={`rounded-full ${size} transition-all duration-150`}
              style={{
                backgroundColor: isActive ? color : "hsl(220, 20%, 30%)",
                opacity: isActive ? 1 : 0.4,
                boxShadow: isActive ? SEGMENT_GLOWS[i] : "none",
              }}
            />
          );
        })}
        <span className="text-sm text-neutral-400 font-semibold ml-1">♯</span>
      </div>

      {/* Note display */}
      {isListening && detectedNote && (
        <div className="text-center">
          <span className="text-2xl font-bold font-display text-white">
            {detectedNote}
            <span className="text-sm text-neutral-400">{detectedOctave}</span>
          </span>
          <p className="text-xs text-neutral-400">
            {cents === 0 ? "In tune ✓" : `${cents > 0 ? "+" : ""}${cents}¢`}
          </p>
        </div>
      )}
    </div>);

}