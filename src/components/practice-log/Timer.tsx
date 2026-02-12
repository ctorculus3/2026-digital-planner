import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, Square, RotateCcw } from "lucide-react";

const PRESETS = [15, 20, 30];

function playBell() {
  const audio = new Audio("/audio/timer-alarm.mp3");
  audio.play().catch(() => {});
}

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function Timer() {
  const [durationMin, setDurationMin] = useState(15);
  const [secondsLeft, setSecondsLeft] = useState(15 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const intervalRef = useRef<number | null>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    if (secondsLeft <= 0) return;
    clearTimer();
    setIsRunning(true);
    setHasStarted(true);
    intervalRef.current = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearTimer();
          setIsRunning(false);
          playBell();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [secondsLeft, clearTimer]);

  const stop = useCallback(() => {
    clearTimer();
    setIsRunning(false);
  }, [clearTimer]);

  const reset = useCallback(() => {
    clearTimer();
    setIsRunning(false);
    setHasStarted(false);
    setSecondsLeft(durationMin * 60);
  }, [clearTimer, durationMin]);

  const selectPreset = (min: number) => {
    if (isRunning) return;
    setDurationMin(min);
    setSecondsLeft(min * 60);
    setHasStarted(false);
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isRunning) return;
    const val = Math.max(1, Math.min(180, Number(e.target.value) || 1));
    setDurationMin(val);
    setSecondsLeft(val * 60);
    setHasStarted(false);
  };

  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, [clearTimer]);

  return (
    <div className="mt-3 rounded-lg p-3 flex flex-col items-center gap-3 bg-[#103e84]">
      {/* Presets */}
      <div className="flex items-center gap-2">
        {PRESETS.map((min) => (
          <Button
            key={min}
            type="button"
            size="sm"
            variant={durationMin === min && !isRunning ? "default" : "outline"}
            className="rounded-full text-xs px-3 h-7"
            onClick={() => selectPreset(min)}
            disabled={isRunning}
          >
            {min}m
          </Button>
        ))}
        <input
          type="number"
          min={1}
          max={180}
          value={durationMin}
          onChange={handleCustomChange}
          disabled={isRunning}
          className="w-14 h-7 rounded-md bg-background/20 text-white text-center text-xs border border-white/20 focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Countdown */}
      <span className="text-3xl font-bold font-display text-white tabular-nums">
        {formatTime(secondsLeft)}
      </span>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="icon"
          variant={isRunning ? "destructive" : "default"}
          className="rounded-full w-10 h-10"
          onClick={isRunning ? stop : start}
        >
          {isRunning ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
        </Button>
        {hasStarted && !isRunning && (
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="rounded-full w-8 h-8"
            onClick={reset}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
