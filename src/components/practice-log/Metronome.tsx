import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Play, Square, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

/* ───── time-signature data ───── */

type TimeSigKey = "2/4" | "3/4" | "4/4" | "5/4" | "5/8" | "6/8" | "6/8." | "7/8";

interface TimeSigDef {
  beats: number;
  subdivision: 4 | 8;
  patterns: number[][];
  patternLabels?: string[];
}

const TIME_SIGNATURES: Record<TimeSigKey, TimeSigDef> = {
  "2/4": { beats: 2, subdivision: 4, patterns: [[1, 0]] },
  "3/4": { beats: 3, subdivision: 4, patterns: [[1, 0, 0]] },
  "4/4": { beats: 4, subdivision: 4, patterns: [[1, 0, 0, 0]] },
  "5/4": {
    beats: 5, subdivision: 4,
    patterns: [[1, 0, 0, 1, 0], [1, 0, 1, 0, 0]],
    patternLabels: ["3+2", "2+3"],
  },
  "5/8": {
    beats: 5, subdivision: 8,
    patterns: [[1, 0, 0, 1, 0], [1, 0, 1, 0, 0]],
    patternLabels: ["3+2", "2+3"],
  },
  "6/8": {
    beats: 6, subdivision: 8,
    patterns: [[1, 0, 0, 1, 0, 0], [1, 0, 1, 0, 1, 0]],
    patternLabels: ["3+3", "2+2+2"],
  },
  "6/8.": {
    beats: 6, subdivision: 8,
    patterns: [[1, 0, 0, 1, 0, 0]],
  },
  "7/8": {
    beats: 7, subdivision: 8,
    patterns: [
      [1, 0, 0, 1, 0, 0, 0],
      [1, 0, 0, 0, 1, 0, 0],
      [1, 0, 0, 1, 0, 1, 0],
      [1, 0, 1, 0, 1, 0, 0],
    ],
    patternLabels: ["3+4", "4+3", "3+2+2", "2+2+3"],
  },
};

const TIME_SIG_KEYS: TimeSigKey[] = ["2/4", "3/4", "4/4", "5/4", "5/8", "6/8", "6/8.", "7/8"];

/* ───── component ───── */

interface MetronomeProps {
  onStart?: () => void;
}

export function Metronome({ onStart }: MetronomeProps) {
  const [bpm, setBpm] = useState(100);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeSig, setTimeSig] = useState<TimeSigKey>("4/4");
  const [accentOn, setAccentOn] = useState(false);
  const [accentPatternIndex, setAccentPatternIndex] = useState(0);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<number | null>(null);
  const hasStartedRef = useRef(false);
  const claveBufferRef = useRef<AudioBuffer | null>(null);
  const hiClaveBufferRef = useRef<AudioBuffer | null>(null);
  const isPlayingRef = useRef(false);
  const beatIndexRef = useRef(0);

  // Keep refs in sync for use inside setInterval callbacks
  const accentOnRef = useRef(accentOn);
  const timeSigRef = useRef(timeSig);
  const accentPatternIndexRef = useRef(accentPatternIndex);

  useEffect(() => { accentOnRef.current = accentOn; }, [accentOn]);
  useEffect(() => { timeSigRef.current = timeSig; }, [timeSig]);
  useEffect(() => { accentPatternIndexRef.current = accentPatternIndex; }, [accentPatternIndex]);

  // Reset pattern index when time sig changes
  useEffect(() => {
    setAccentPatternIndex(0);
    beatIndexRef.current = 0;
  }, [timeSig]);

  const getAudioContext = useCallback(async () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    if (audioCtxRef.current.state === "suspended") {
      await audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  const loadSample = useCallback(async (url: string): Promise<AudioBuffer | null> => {
    try {
      const ctx = await getAudioContext();
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.status}`);
      const arrayBuffer = await response.arrayBuffer();
      return await ctx.decodeAudioData(arrayBuffer);
    } catch (err) {
      console.error(`Failed to load sample ${url}:`, err);
      return null;
    }
  }, [getAudioContext]);

  const loadSamples = useCallback(async () => {
    if (!claveBufferRef.current) {
      claveBufferRef.current = await loadSample("/audio/Clave-4.wav");
    }
    if (!hiClaveBufferRef.current) {
      hiClaveBufferRef.current = await loadSample("/audio/Hi-Clave-3.wav");
    }
  }, [loadSample]);

  const playClick = useCallback(() => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    // Determine which buffer to play
    const sig = TIME_SIGNATURES[timeSigRef.current];
    const pattern = sig.patterns[accentPatternIndexRef.current] ?? sig.patterns[0];
    const isAccent = accentOnRef.current && pattern[beatIndexRef.current] === 1;
    const buffer = isAccent ? hiClaveBufferRef.current : claveBufferRef.current;

    if (buffer) {
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start();
    } else {
      // Fallback oscillator beep
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.value = isAccent ? 1500 : 1000;
      gain.gain.value = 0.3;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.03);
    }

    beatIndexRef.current = (beatIndexRef.current + 1) % pattern.length;
  }, []);

  const startMetronome = useCallback(async () => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    isPlayingRef.current = true;
    beatIndexRef.current = 0;

    // Initialize AudioContext on user gesture
    const ctx = await getAudioContext();
    if (!isPlayingRef.current) return;

    // Unlock iOS audio with silent buffer
    const silentBuffer = ctx.createBuffer(1, 1, ctx.sampleRate);
    const silentSource = ctx.createBufferSource();
    silentSource.buffer = silentBuffer;
    silentSource.connect(ctx.destination);
    silentSource.start();

    // Load both samples
    await loadSamples();
    if (!isPlayingRef.current) return;

    // Resume again after async work (iOS may have re-suspended)
    if (audioCtxRef.current?.state === "suspended") {
      await audioCtxRef.current.resume();
    }

    // Fire onStart callback only on first play
    if (!hasStartedRef.current) {
      hasStartedRef.current = true;
      onStart?.();
    }

    playClick(); // Immediate first beat
    const ms = 60000 / bpm;
    intervalRef.current = window.setInterval(playClick, ms);
    setIsPlaying(true);
  }, [bpm, playClick, onStart, loadSamples, getAudioContext]);

  const stopMetronome = useCallback(() => {
    isPlayingRef.current = false;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  // Restart interval when BPM changes while playing
  useEffect(() => {
    if (isPlaying) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      beatIndexRef.current = 0;
      const ms = 60000 / bpm;
      intervalRef.current = window.setInterval(playClick, ms);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [bpm, isPlaying, playClick]);

  // Reset beat index when time sig or pattern changes while playing
  useEffect(() => {
    beatIndexRef.current = 0;
  }, [timeSig, accentPatternIndex]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      audioCtxRef.current?.close();
    };
  }, []);

  const adjustBpm = (delta: number) => {
    setBpm((prev) => Math.max(20, Math.min(300, prev + delta)));
  };

  const currentSig = TIME_SIGNATURES[timeSig];
  const hasMultiplePatterns = currentSig.patterns.length > 1 && currentSig.patternLabels;

  return (
    <div className="mt-3 bg-[hsl(var(--time-section-bg))] rounded-lg p-3 space-y-3">
      {/* BPM display + play/stop */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-3xl font-bold font-display text-foreground">{bpm}</span>
          <span className="text-sm text-muted-foreground ml-1">BPM</span>
        </div>
        <Button
          type="button"
          size="icon"
          variant={isPlaying ? "destructive" : "default"}
          className="rounded-full w-10 h-10"
          onClick={isPlaying ? stopMetronome : startMetronome}
        >
          {isPlaying ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
        </Button>
      </div>

      {/* BPM slider */}
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8 shrink-0 rounded-full"
          onClick={() => adjustBpm(-1)}
        >
          <Minus className="w-4 h-4" />
        </Button>
        <Slider
          value={[bpm]}
          onValueChange={([v]) => setBpm(v)}
          min={20}
          max={300}
          step={1}
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8 shrink-0 rounded-full"
          onClick={() => adjustBpm(1)}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Time Signature selector */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
        {TIME_SIG_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTimeSig(key)}
            className={cn(
              "shrink-0 px-2.5 py-1 rounded-md text-xs font-medium transition-colors border",
              timeSig === key
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-muted-foreground border-input hover:bg-accent hover:text-accent-foreground"
            )}
          >
            {key}
          </button>
        ))}
      </div>

      {/* Accent toggle + pattern selector */}
      <div className="flex items-center gap-3 flex-wrap">
        <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
          <Switch checked={accentOn} onCheckedChange={setAccentOn} />
          <span>Accent</span>
        </label>

        {accentOn && hasMultiplePatterns && (
          <div className="flex gap-1.5">
            {currentSig.patternLabels!.map((label, idx) => (
              <button
                key={label}
                type="button"
                onClick={() => setAccentPatternIndex(idx)}
                className={cn(
                  "px-2 py-0.5 rounded text-xs font-medium transition-colors border",
                  accentPatternIndex === idx
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-input hover:bg-accent hover:text-accent-foreground"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
