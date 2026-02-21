import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Play, Pause, CheckCircle2, RotateCcw } from "lucide-react";
import { useUserStreak } from "@/hooks/useUserStreak";

type SessionState = "idle" | "running" | "paused" | "completed";

interface PracticeSessionTimerProps {
  existingStartTime: string;
  existingStopTime: string;
  existingTotalTime: string;
  onSessionComplete: (startTime: string, stopTime: string, totalTime: string) => void;
}

function formatElapsed(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}`;
  }
  return `0:${String(m).padStart(2, "0")}`;
}

function formatTimeTo12Hr(date: Date): string {
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const period = hours >= 12 ? "PM" : "AM";
  if (hours === 0) hours = 12;
  else if (hours > 12) hours -= 12;
  return `${hours}:${minutes} ${period}`;
}

function formatTimeForDb(date: Date): string {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export function PracticeSessionTimer({
  existingStartTime,
  existingStopTime,
  existingTotalTime,
  onSessionComplete,
}: PracticeSessionTimerProps) {
  const { streak, refetch: refetchStreak } = useUserStreak();

  // Determine initial state based on existing data
  const hasExistingSession = !!(existingStartTime && existingStopTime);

  const [sessionState, setSessionState] = useState<SessionState>(
    hasExistingSession ? "completed" : "idle"
  );
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [startTimestamp, setStartTimestamp] = useState<Date | null>(null);
  const [completedStartTime, setCompletedStartTime] = useState(existingStartTime);
  const [completedTotalTime, setCompletedTotalTime] = useState(existingTotalTime);
  const accumulatedRef = useRef(0);
  const intervalRef = useRef<number | null>(null);

  // Sync with external data changes (e.g. date navigation)
  useEffect(() => {
    if (hasExistingSession) {
      setSessionState("completed");
      setCompletedStartTime(existingStartTime);
      setCompletedTotalTime(existingTotalTime);
    } else {
      setSessionState("idle");
      setElapsedSeconds(0);
      accumulatedRef.current = 0;
      setStartTimestamp(null);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [existingStartTime, existingStopTime]);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startSession = useCallback(() => {
    const now = new Date();
    setStartTimestamp(now);
    accumulatedRef.current = 0;
    setElapsedSeconds(0);
    setSessionState("running");

    intervalRef.current = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
  }, []);

  const pauseSession = useCallback(() => {
    clearTimer();
    accumulatedRef.current = elapsedSeconds;
    setSessionState("paused");
  }, [clearTimer, elapsedSeconds]);

  const resumeSession = useCallback(() => {
    setSessionState("running");
    intervalRef.current = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
  }, []);

  const completeSession = useCallback(() => {
    clearTimer();
    const now = new Date();
    const start = startTimestamp || new Date(now.getTime() - elapsedSeconds * 1000);

    const startDisplay = formatTimeTo12Hr(start);
    const stopDisplay = formatTimeTo12Hr(now);
    const startDb = formatTimeForDb(start);
    const stopDb = formatTimeForDb(now);
    const duration = formatDuration(elapsedSeconds);

    setCompletedStartTime(startDisplay);
    setCompletedTotalTime(duration);
    setSessionState("completed");

    onSessionComplete(startDb, stopDb, duration);
    refetchStreak();
  }, [clearTimer, startTimestamp, elapsedSeconds, onSessionComplete, refetchStreak]);

  const resetSession = useCallback(() => {
    clearTimer();
    setSessionState("idle");
    setElapsedSeconds(0);
    accumulatedRef.current = 0;
    setStartTimestamp(null);
  }, [clearTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  // Progress bar: soft goal of 30 min
  const progressPercent = Math.min((elapsedSeconds / (30 * 60)) * 100, 100);

  return (
    <div className="bg-[hsl(var(--time-section-bg))] rounded-lg p-4 shadow-sm border border-border">
      {/* Idle State */}
      {sessionState === "idle" && (
        <div className="flex flex-col items-center py-4">
          <Button
            type="button"
            onClick={startSession}
            className="rounded-full px-8 h-12 text-base font-display gap-2"
          >
            <Play className="w-5 h-5" />
            Start Practice Session
          </Button>
        </div>
      )}

      {/* Running / Paused State */}
      {(sessionState === "running" || sessionState === "paused") && (
        <div className="flex flex-col items-center gap-4 py-2">
          <p className="font-display text-sm text-muted-foreground">
            {sessionState === "paused" ? "Session paused" : "Session in progress"}
          </p>

          <span className="font-display text-5xl font-bold tabular-nums text-foreground">
            {formatElapsed(elapsedSeconds)}
          </span>

          <Progress value={progressPercent} className="w-full max-w-xs h-2" />

          <div className="flex items-center gap-3">
            {sessionState === "running" ? (
              <Button
                type="button"
                variant="outline"
                onClick={pauseSession}
                className="rounded-full px-6 h-10 gap-2"
              >
                <Pause className="w-4 h-4" />
                Pause
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={resumeSession}
                className="rounded-full px-6 h-10 gap-2"
              >
                <Play className="w-4 h-4" />
                Resume
              </Button>
            )}
            <Button
              type="button"
              onClick={completeSession}
              className="rounded-full px-6 h-10 gap-2 bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              <CheckCircle2 className="w-4 h-4" />
              Complete
            </Button>
          </div>
        </div>
      )}

      {/* Completed State */}
      {sessionState === "completed" && (
        <div className="flex flex-col items-center gap-3 py-3">
          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          <p className="text-emerald-500 font-bold font-display text-lg">
            Today's session complete!
          </p>
          <p className="text-muted-foreground text-sm text-center">
            You practiced for {completedTotalTime || "0:00"}. See you tomorrow.
          </p>
          <Badge variant="secondary" className="text-sm font-bold px-4 py-1">
            🔥 STREAK: {streak} DAYS
          </Badge>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={resetSession}
            className="text-muted-foreground hover:text-foreground gap-1 mt-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Start another session
          </Button>
        </div>
      )}
    </div>
  );
}
