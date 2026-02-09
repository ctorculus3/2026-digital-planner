import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface StreakCounterProps {
  streak: number;
  loading?: boolean;
}

export function StreakCounter({ streak, loading }: StreakCounterProps) {
  return (
    <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
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
    </div>
  );
}
