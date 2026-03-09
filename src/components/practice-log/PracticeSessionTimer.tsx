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
  currentDate: string; // YYYY-MM-DD — scopes persisted timer state to this date
  onSessionComplete: (startTime: string, stopTime: string, totalTime: string) => void;
}

// --- sessionStorage persistence helpers ---

const TIMER_STORAGE_KEY = "pd_timer_state";

interface PersistedTimerState {
  sessionState: "running" | "paused";
  startTimestamp: string; // ISO string
  elapsedSeconds: number;
  accumulatedSeconds: number;
  forDate: string; // YYYY-MM-DD
  persistedAt: number; // Date.now() when state was saved
}

function persistTimerState(state: PersistedTimerState): void {
  try {
    sessionStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // sessionStorage full or unavailable — silently fail
  }
}

function restoreTimerState(): PersistedTimerState | null {
  try {
    const raw = sessionStorage.getItem(TIMER_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedTimerState;
    if (
      (parsed.sessionState === "running" || parsed.sessionState === "paused") &&
      typeof parsed.startTimestamp === "string" &&
      typeof parsed.elapsedSeconds === "number" &&
      typeof parsed.accumulatedSeconds === "number" &&
      typeof parsed.forDate === "string" &&
      typeof parsed.persistedAt === "number"
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

function clearTimerState(): void {
  sessionStorage.removeItem(TIMER_STORAGE_KEY);
}

// --- Formatting helpers ---

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
  const s = totalSeconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")} hrs`;
  }
  if (m > 0) {
    return `${m}:${String(s).padStart(2, "0")} mins`;
  }
  return `0:${String(s).padStart(2, "0")} secs`;
}

/** Parse various time formats into total seconds */
function parseDurationToSeconds(str: string): number {
  if (!str) return 0;
  // Strip unit labels like "hrs", "mins", "secs"
  const cleaned = str.replace(/\s*(hrs|mins|secs|hr|min|sec)\s*/gi, "").trim();
  // HH:MM:SS (e.g. "03:41:00" from DB interval)
  const hms = cleaned.match(/^(\d+):(\d{2}):(\d{2})$/);
  if (hms) return parseInt(hms[1]) * 3600 + parseInt(hms[2]) * 60 + parseInt(hms[3]);
  // H:MM or M:SS (e.g. "3:41" or "1:24")
  const hm = cleaned.match(/^(\d+):(\d{2})$/);
  if (hm) {
    const a = parseInt(hm[1]);
    const b = parseInt(hm[2]);
    // If original had "hrs", treat as H:MM
    if (/hrs?/i.test(str)) return a * 3600 + b * 60;
    // If original had "mins", treat as M:SS
    if (/mins?/i.test(str)) return a * 60 + b;
    // Default: assume H:MM (legacy computed format)
    return a * 3600 + b * 60;
  }
  return 0;
}

/** Format seconds as HH:MM:SS for DB interval storage */
function formatDurationForDb(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
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
  currentDate,
  onSessionComplete,
}: PracticeSessionTimerProps) {
  const { streak, refetch: refetchStreak } = useUserStreak();

  // Determine initial state based on existing data
  const hasExistingSession = !!(existingStartTime && existingStopTime);

  // Check for persisted timer state (survives unmount / page refresh)
  const persisted = restoreTimerState();
  const isRestorable = !!(persisted && persisted.forDate === currentDate && !hasExistingSession);

  const [sessionState, setSessionState] = useState<SessionState>(() => {
    if (hasExistingSession) return "completed";
    if (isRestorable) return persisted!.sessionState;
    return "idle";
  });
  const [elapsedSeconds, setElapsedSeconds] = useState(() => {
    if (isRestorable) {
      if (persisted!.sessionState === "running") {
        // Add wall-clock time that passed while component was unmounted
        const msSincePersisted = Date.now() - persisted!.persistedAt;
        return persisted!.elapsedSeconds + Math.floor(msSincePersisted / 1000);
      }
      return persisted!.elapsedSeconds; // paused — exact value
    }
    return 0;
  });
  const [startTimestamp, setStartTimestamp] = useState<Date | null>(() => {
    if (isRestorable) return new Date(persisted!.startTimestamp);
    return null;
  });
  const [completedStartTime, setCompletedStartTime] = useState(existingStartTime);
  const [completedTotalTime, setCompletedTotalTime] = useState(
    existingTotalTime ? formatDuration(parseDurationToSeconds(existingTotalTime)) : ""
  );
  const accumulatedRef = useRef(isRestorable ? persisted!.accumulatedSeconds : 0);
  const intervalRef = useRef<number | null>(null);
  const justCompletedRef = useRef(false);

  // On mount: if restored into a running state, restart the interval
  useEffect(() => {
    if (sessionState === "running" && !intervalRef.current) {
      intervalRef.current = window.setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist timer state for recovery after unmount (e.g. token refresh, page reload)
  useEffect(() => {
    if (sessionState === "running" || sessionState === "paused") {
      persistTimerState({
        sessionState,
        startTimestamp: startTimestamp?.toISOString() || new Date().toISOString(),
        elapsedSeconds,
        accumulatedSeconds: accumulatedRef.current,
        forDate: currentDate,
        persistedAt: Date.now(),
      });
    } else {
      // idle or completed — clear persisted state
      clearTimerState();
    }
  }, [sessionState, elapsedSeconds, currentDate, startTimestamp]);

  // Warn user before closing tab if timer is running
  useEffect(() => {
    if (sessionState === "running" || sessionState === "paused") {
      const handler = (e: BeforeUnloadEvent) => {
        e.preventDefault();
      };
      window.addEventListener("beforeunload", handler);
      return () => window.removeEventListener("beforeunload", handler);
    }
  }, [sessionState]);

  // Sync with external data changes (e.g. date navigation)
  useEffect(() => {
    if (justCompletedRef.current) {
      justCompletedRef.current = false;
      return;
    }
    if (hasExistingSession) {
      setSessionState("completed");
      setCompletedStartTime(existingStartTime);
      setCompletedTotalTime(
        existingTotalTime ? formatDuration(parseDurationToSeconds(existingTotalTime)) : ""
      );
      clearTimerState();
    } else {
      setSessionState("idle");
      setElapsedSeconds(0);
      accumulatedRef.current = 0;
      setStartTimestamp(null);
      clearTimerState();
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
    justCompletedRef.current = true;
    const now = new Date();
    const start = startTimestamp || new Date(now.getTime() - elapsedSeconds * 1000);

    const startDb = formatTimeForDb(start);
    const stopDb = formatTimeForDb(now);

    // Accumulate: add new session seconds to any existing total
    const existingSeconds = parseDurationToSeconds(existingTotalTime);
    const combinedSeconds = existingSeconds + elapsedSeconds;
    const displayDuration = formatDuration(combinedSeconds);
    const dbDuration = formatDurationForDb(combinedSeconds);

    // For start time display, keep earliest start if there was a previous session
    const displayStart = existingStartTime || formatTimeTo12Hr(start);

    setCompletedStartTime(displayStart);
    setCompletedTotalTime(displayDuration);
    setSessionState("completed");
    clearTimerState();

    // Send DB-format duration to parent for proper interval storage
    onSessionComplete(startDb, stopDb, dbDuration);
    refetchStreak();
  }, [clearTimer, startTimestamp, elapsedSeconds, existingTotalTime, existingStartTime, onSessionComplete, refetchStreak]);

  const resetSession = useCallback(() => {
    clearTimer();
    setSessionState("idle");
    setElapsedSeconds(0);
    accumulatedRef.current = 0;
    setStartTimestamp(null);
    clearTimerState();
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
