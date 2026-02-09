import { Flame, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PracticeTime } from "@/hooks/useDashboardData";

interface StreakCounterProps {
  streak: number;
  loading?: boolean;
  practiceTime: PracticeTime;
}

function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}:${m.toString().padStart(2, "0")}`;
}

const TIME_LABELS = [
  { key: "today" as const, label: "Today" },
  { key: "thisWeek" as const, label: "This Week" },
  { key: "thisMonth" as const, label: "This Month" },
  { key: "total" as const, label: "Total" },
];

export function StreakCounter({ streak, loading, practiceTime }: StreakCounterProps) {
  return (
    <div className="bg-card rounded-lg border border-border p-6 shadow-sm flex flex-col md:flex-row md:items-center gap-6">
      {/* Streak section */}
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "flex items-center justify-center h-14 w-14 rounded-full shrink-0",
            streak > 0
              ? "bg-accent text-accent-foreground"
              : "bg-muted/20 text-muted-foreground"
          )}
        >
          <Flame className={cn("h-7 w-7", streak > 0 && "animate-pulse")} />
        </div>
        <div>
          {loading ? (
            <div className="h-8 w-16 bg-muted/20 rounded animate-pulse" />
          ) : (
            <p className="text-3xl font-bold font-display text-foreground">{streak}</p>
          )}
          <p className="text-sm text-muted-foreground font-medium">
            day streak
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className="hidden md:block w-px h-14 bg-border" />
      <div className="md:hidden h-px w-full bg-border" />

      {/* Practice time section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
        {TIME_LABELS.map(({ key, label }) => (
          <div key={key} className="flex flex-col items-center md:items-start">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              {label}
            </p>
            {loading ? (
              <div className="h-6 w-12 bg-muted/20 rounded animate-pulse mt-1" />
            ) : (
              <p className="text-lg font-bold font-display text-foreground">
                {formatTime(practiceTime[key])}
                <span className="text-xs font-normal text-muted-foreground ml-1">hrs</span>
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
