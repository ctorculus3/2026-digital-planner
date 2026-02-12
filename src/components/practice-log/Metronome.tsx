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

  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    return audioCtxRef.current;
  }, []);

  const playClick = useCallback(() => {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Layer 1: Filtered noise burst for natural percussive attack
    const bufferSize = Math.floor(ctx.sampleRate * 0.04);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noiseSrc = ctx.createBufferSource();
    noiseSrc.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 1500;
    filter.Q.value = 1.5;

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.9, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

    noiseSrc.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noiseSrc.start(now);
    noiseSrc.stop(now + 0.04);

    // Layer 2: Brief tonal ping for "tap" character
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.frequency.setValueAtTime(1200, now);
    oscGain.gain.setValueAtTime(0.3, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);
    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.02);
  }, [getAudioContext]);

  const startMetronome = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    
    // Fire onStart callback only on first play
    if (!hasStartedRef.current) {
      hasStartedRef.current = true;
      onStart?.();
    }

    playClick(); // Immediate first beat
    const ms = 60000 / bpm;
    intervalRef.current = window.setInterval(playClick, ms);
    setIsPlaying(true);
  }, [bpm, playClick, onStart]);

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
    <div className="mt-3 bg-muted/30 rounded-lg p-3 space-y-3">
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
