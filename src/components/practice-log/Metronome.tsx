import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Square, Minus, Plus } from "lucide-react";

interface MetronomeProps {
  onStart?: () => void;
}

export function Metronome({ onStart }: MetronomeProps) {
  const [bpm, setBpm] = useState(100);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<number | null>(null);
  const hasStartedRef = useRef(false);
  const claveBufferRef = useRef<AudioBuffer | null>(null);

  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    return audioCtxRef.current;
  }, []);

  const loadClave = useCallback(async () => {
    if (claveBufferRef.current) return;
    const ctx = getAudioContext();
    const response = await fetch("/audio/Clave-4.wav");
    const arrayBuffer = await response.arrayBuffer();
    claveBufferRef.current = await ctx.decodeAudioData(arrayBuffer);
  }, [getAudioContext]);

  const playClick = useCallback(() => {
    if (!claveBufferRef.current) return;
    const ctx = getAudioContext();
    const source = ctx.createBufferSource();
    source.buffer = claveBufferRef.current;
    source.connect(ctx.destination);
    source.start();
  }, [getAudioContext]);

  const startMetronome = useCallback(async () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    
    // Load clave sample if not yet loaded
    await loadClave();

    // Fire onStart callback only on first play
    if (!hasStartedRef.current) {
      hasStartedRef.current = true;
      onStart?.();
    }

    playClick(); // Immediate first beat
    const ms = 60000 / bpm;
    intervalRef.current = window.setInterval(playClick, ms);
    setIsPlaying(true);
  }, [bpm, playClick, onStart, loadClave]);

  const stopMetronome = useCallback(() => {
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
      const ms = 60000 / bpm;
      intervalRef.current = window.setInterval(playClick, ms);
    }
  }, [bpm, isPlaying, playClick]);

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

  return (
    <div className="mt-3 bg-[hsl(var(--time-section-bg))] rounded-lg p-3 space-y-3">
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
    </div>
  );
}
