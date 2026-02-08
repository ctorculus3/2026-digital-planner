import { Trophy, Medal, Award, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface Badge {
  id: string;
  badge_type: string;
  earned_at: string;
}

interface BadgeShelfProps {
  badges: Badge[];
  loading?: boolean;
}

const BADGE_CONFIG = [
  {
    type: "streak_10",
    label: "10 Days",
    icon: Medal,
    description: "First 10-day streak",
  },
  {
    type: "streak_30",
    label: "30 Days",
    icon: Award,
    description: "30-day streak",
  },
  {
    type: "streak_50",
    label: "50 Days",
    icon: Trophy,
    description: "50-day streak",
  },
  {
    type: "streak_100",
    label: "100 Days",
    icon: Crown,
    description: "100-day streak",
  },
];

export function BadgeShelf({ badges, loading }: BadgeShelfProps) {
  const earnedMap = new Map(badges.map((b) => [b.badge_type, b]));

  return (
    <div className="bg-card rounded-lg border border-border p-4 md:p-6 shadow-sm">
      <h3 className="text-sm font-display font-bold text-foreground mb-4">
        Streak Badges
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {BADGE_CONFIG.map(({ type, label, icon: Icon, description }) => {
          const earned = earnedMap.get(type);
          const isEarned = !!earned;

          return (
            <div
              key={type}
              className={cn(
                "flex flex-col items-center gap-2 p-3 rounded-lg border transition-all",
                isEarned
                  ? "border-accent-foreground/30 bg-accent/50"
                  : "border-border bg-muted/10 opacity-50"
              )}
            >
              <div
                className={cn(
                  "flex items-center justify-center h-10 w-10 rounded-full",
                  isEarned
                    ? "bg-accent text-accent-foreground"
                    : "bg-muted/20 text-muted-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <span
                className={cn(
                  "text-xs font-bold text-center",
                  isEarned ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {label}
              </span>
              {isEarned && earned ? (
                <span className="text-[10px] text-muted-foreground">
                  {format(new Date(earned.earned_at), "MMM d, yyyy")}
                </span>
              ) : (
                <span className="text-[10px] text-muted-foreground">{description}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
