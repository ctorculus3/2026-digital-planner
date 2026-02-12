import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff } from "lucide-react";

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

// Segment colors from left (very flat) to right (very sharp)
// 9 segments: 2 red, 2 orange, 2 yellow, 1 green center, then mirror
const SEGMENT_COLORS = [
"hsl(0, 80%, 55%)", // far flat - red
"hsl(20, 90%, 55%)", // flat - orange
"hsl(40, 95%, 55%)", // slightly flat - amber
"hsl(55, 95%, 50%)", // almost - yellow
"hsl(140, 70%, 45%)", // in tune - green
"hsl(55, 95%, 50%)", // almost - yellow
"hsl(40, 95%, 55%)", // slightly sharp - amber
"hsl(20, 90%, 55%)", // sharp - orange
"hsl(0, 80%, 55%)" // far sharp - red
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

  // Build SVG gauge arc
  const gaugeRadius = 90;
  const gaugeCx = 120;
  const gaugeCy = 110;
  const startAngle = Math.PI; // left
  const endAngle = 0; // right (top semicircle)
  const gap = 0.03; // gap between segments in radians

  const segments = Array.from({ length: SEGMENT_COUNT }, (_, i) => {
    const totalArc = Math.PI - gap * (SEGMENT_COUNT - 1);
    const segArc = totalArc / SEGMENT_COUNT;
    const a1 = startAngle - i * (segArc + gap);
    const a2 = a1 - segArc;

    const x1 = gaugeCx + gaugeRadius * Math.cos(a1);
    const y1 = gaugeCy - gaugeRadius * Math.sin(a1);
    const x2 = gaugeCx + gaugeRadius * Math.cos(a2);
    const y2 = gaugeCy - gaugeRadius * Math.sin(a2);

    const innerRadius = gaugeRadius - 18;
    const x3 = gaugeCx + innerRadius * Math.cos(a2);
    const y3 = gaugeCy - innerRadius * Math.sin(a2);
    const x4 = gaugeCx + innerRadius * Math.cos(a1);
    const y4 = gaugeCy - innerRadius * Math.sin(a1);

    const isActive = activeSegment === i;
    const dimColor = "hsl(var(--muted))";

    return (
      <path
        key={i}
        d={`M ${x1} ${y1} A ${gaugeRadius} ${gaugeRadius} 0 0 0 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 0 1 ${x4} ${y4} Z`}
        fill={isActive ? SEGMENT_COLORS[i] : dimColor}
        opacity={isActive ? 1 : 0.4}
        style={{ transition: "fill 0.15s, opacity 0.15s" }} />);


  });

  return (
    <div className="mt-3 rounded-lg p-2 flex items-center gap-2 mx-0 bg-[#103e84]">
      {/* Mic button */}
      <Button
        type="button"
        size="icon"
        variant={isListening ? "destructive" : "default"}
        className="rounded-full w-8 h-8 shrink-0"
        onClick={isListening ? stopListening : startListening}>

        {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
      </Button>

      {/* Gauge */}
      <svg viewBox="0 0 240 130" className="w-full max-w-[180px] shrink-0 mx-[35px]" aria-hidden>
        {segments}
        <polygon
          points={`${gaugeCx - 6},${gaugeCy - gaugeRadius - 6} ${gaugeCx + 6},${gaugeCy - gaugeRadius - 6} ${gaugeCx},${gaugeCy - gaugeRadius + 4}`}
          fill="hsl(0 0% 85%)" />

        <text x="18" y={gaugeCy + 4} fill="hsl(0 0% 60%)" fontSize="13" fontWeight="600">♭</text>
        <text x="218" y={gaugeCy + 4} fill="hsl(0 0% 60%)" fontSize="13" fontWeight="600">♯</text>
      </svg>

      {/* Note display */}
      <div className="shrink-0 min-w-[60px] text-center">
        {isListening && detectedNote ?
        <>
            <span className="text-2xl font-bold font-display text-white">
              {detectedNote}
              <span className="text-sm text-neutral-400">{detectedOctave}</span>
            </span>
            <p className="text-xs text-neutral-400">
              {cents === 0 ? "In tune ✓" : `${cents > 0 ? "+" : ""}${cents}¢`}
            </p>
          </> :

        <p className="text-xs text-muted mx-0 px-0">
            {isListening ? "Listening…" : "Tap mic"}
          </p>
        }
      </div>
    </div>);

}