import { Clock } from "lucide-react";
import type { PracticeTime } from "@/hooks/useDashboardData";

interface PracticeTimeSummaryProps {
  practiceTime: PracticeTime;
  loading?: boolean;
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

export function PracticeTimeSummary({ practiceTime, loading }: PracticeTimeSummaryProps) {
  return (
    <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
      <h2 className="text-center text-lg font-display font-bold text-foreground mb-4">
        Hours of Practice
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {TIME_LABELS.map(({ key, label }) => (
          <div key={key} className="flex flex-col items-center">
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
