import type { PracticeTime } from "@/hooks/useDashboardData";

interface PracticeTimeSummaryProps {
  practiceTime: PracticeTime;
  loading?: boolean;
}

function formatTime(totalSeconds: number): { value: string; unit: string } {
  if (totalSeconds === 0) return { value: "0", unit: "mins" };

  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;

  // Under 1 minute — show seconds
  if (h === 0 && m === 0) {
    return { value: `${s}`, unit: s === 1 ? "sec" : "secs" };
  }
  // Under 1 hour — show minutes and seconds
  if (h === 0) {
    if (s === 0) return { value: `${m}`, unit: m === 1 ? "min" : "mins" };
    return { value: `${m} min ${s}`, unit: "sec" };
  }
  // 1+ hours — show hours and minutes (drop seconds for readability)
  if (m === 0) {
    return { value: `${h}`, unit: h === 1 ? "hr" : "hrs" };
  }
  return { value: `${h} hr ${m}`, unit: "min" };
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
        Practice Time
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {TIME_LABELS.map(({ key, label }) => {
          const { value, unit } = formatTime(practiceTime[key]);
          return (
            <div key={key} className="flex flex-col items-center">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                {label}
              </p>
              {loading ? (
                <div className="h-6 w-12 bg-muted/20 rounded animate-pulse mt-1" />
              ) : (
                <p className="text-lg font-bold font-display text-foreground">
                  {value}
                  <span className="text-xs font-normal text-muted-foreground ml-1">{unit}</span>
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
