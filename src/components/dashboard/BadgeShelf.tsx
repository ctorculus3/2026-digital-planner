import { useState } from "react";
import { Trophy, Medal, Award, Crown, Music, Star, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ShareBadgeDialog } from "./ShareBadgeDialog";

interface Badge {
  id: string;
  badge_type: string;
  earned_at: string;
}

interface BadgeShelfProps {
  badges: Badge[];
  loading?: boolean;
  streak?: number;
  showShare?: boolean;
}

export const BADGE_CONFIG = [
  {
    type: "streak_10",
    number: 10,
    label: "10 Days",
    icon: Music,
    description: "First 10-day streak",
    gradient: "linear-gradient(135deg, hsl(168 60% 45%), hsl(160 70% 40%), hsl(145 65% 38%))",
    glowColor: "hsl(160 70% 45% / 0.4)",
  },
  {
    type: "streak_30",
    number: 30,
    label: "30 Days",
    icon: Star,
    description: "30-day streak",
    gradient: "linear-gradient(135deg, hsl(350 75% 55%), hsl(15 85% 55%), hsl(25 90% 55%))",
    glowColor: "hsl(15 85% 55% / 0.4)",
  },
  {
    type: "streak_50",
    number: 50,
    label: "50 Days",
    icon: Trophy,
    description: "50-day streak",
    gradient: "linear-gradient(135deg, hsl(270 65% 50%), hsl(255 70% 55%), hsl(240 60% 55%))",
    glowColor: "hsl(260 65% 55% / 0.4)",
  },
  {
    type: "streak_100",
    number: 100,
    label: "100 Days",
    icon: Crown,
    description: "100-day streak",
    gradient: "linear-gradient(135deg, hsl(38 90% 50%), hsl(30 95% 48%), hsl(20 90% 48%))",
    glowColor: "hsl(35 90% 50% / 0.4)",
  },
];

export function EnamelBadge({
  config,
  earned,
}: {
  config: (typeof BADGE_CONFIG)[0];
  earned: Badge | undefined;
}) {
  const isEarned = !!earned;
  const Icon = config.icon;

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Badge body */}
      <div
        className={cn(
          "relative w-[88px] h-[100px] md:w-[96px] md:h-[110px] transition-all duration-300",
          !isEarned && "grayscale opacity-40"
        )}
        style={{
          filter: isEarned ? undefined : "grayscale(1)",
        }}
      >
        {/* Gold border layer */}
        <div
          className="absolute inset-0"
          style={{
            clipPath:
              "polygon(50% 0%, 93% 15%, 100% 55%, 80% 90%, 50% 100%, 20% 90%, 0% 55%, 7% 15%)",
            background:
              "linear-gradient(160deg, hsl(43 80% 70%), hsl(38 85% 55%), hsl(30 75% 40%), hsl(38 85% 55%), hsl(45 90% 72%))",
          }}
        />

        {/* Inner badge face */}
        <div
          className="absolute inset-[3px] flex flex-col items-center justify-center"
          style={{
            clipPath:
              "polygon(50% 0%, 93% 15%, 100% 55%, 80% 90%, 50% 100%, 20% 90%, 0% 55%, 7% 15%)",
            background: config.gradient,
            boxShadow: `inset 0 2px 6px hsl(0 0% 100% / 0.25), inset 0 -3px 6px hsl(0 0% 0% / 0.2)`,
          }}
        >
          {/* Icon */}
          <Icon className="h-4 w-4 md:h-5 md:w-5 text-white/80 mb-0.5 drop-shadow-sm" />

          {/* Big number */}
          <span
            className="text-2xl md:text-3xl font-extrabold text-white drop-shadow-md leading-none"
            style={{
              textShadow: "0 2px 4px hsl(0 0% 0% / 0.35)",
            }}
          >
            {config.number}
          </span>

          {/* Label */}
          <span className="text-[8px] md:text-[9px] font-bold uppercase tracking-wider text-white/90 mt-0.5">
            days
          </span>
        </div>

        {/* Shine overlay */}
        {isEarned && (
          <div
            className="absolute inset-[3px] pointer-events-none"
            style={{
              clipPath:
                "polygon(50% 0%, 93% 15%, 100% 55%, 80% 90%, 50% 100%, 20% 90%, 0% 55%, 7% 15%)",
              background:
                "linear-gradient(135deg, hsl(0 0% 100% / 0.25) 0%, transparent 50%, transparent 100%)",
            }}
          />
        )}
      </div>

      {/* Text below badge */}
      {isEarned && earned ? (
        <span className="text-[10px] text-muted-foreground font-medium">
          {format(new Date(earned.earned_at), "MMM d, yyyy")}
        </span>
      ) : (
        <span className="text-[10px] text-muted-foreground">{config.description}</span>
      )}
    </div>
  );
}

export function BadgeShelf({ badges, loading, streak = 0, showShare = true }: BadgeShelfProps) {
  const earnedMap = new Map(badges.map((b) => [b.badge_type, b]));
  const [shareConfig, setShareConfig] = useState<{
    config: (typeof BADGE_CONFIG)[0];
    earned: Badge;
  } | null>(null);

  return (
    <div className="bg-card rounded-lg border border-border p-4 md:p-6 shadow-sm">
      <h3 className="text-sm font-display font-bold text-foreground mb-4">
        Streak Badges
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 justify-items-center">
        {BADGE_CONFIG.map((config) => {
          const earned = earnedMap.get(config.type);
          return (
            <div key={config.type} className="relative group">
              <EnamelBadge config={config} earned={earned} />
              {earned && showShare && (
                 <button
                  onClick={() => setShareConfig({ config, earned })}
                  className="absolute top-0 right-0 p-1 rounded-full bg-card/80 border border-border shadow-sm opacity-70 hover:opacity-100 transition-opacity"
                  aria-label={`Share ${config.label} badge`}
                >
                  <Share2 className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {shareConfig && (
        <ShareBadgeDialog
          open={!!shareConfig}
          onOpenChange={(open) => !open && setShareConfig(null)}
          badgeConfig={shareConfig.config}
          earned={shareConfig.earned}
          streak={streak}
        />
      )}
    </div>
  );
}
