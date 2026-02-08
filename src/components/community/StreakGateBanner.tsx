import { Flame } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface StreakGateBannerProps {
  streak: number;
}

export function StreakGateBanner({ streak }: StreakGateBannerProps) {
  const progress = Math.min((streak / 10) * 100, 100);
  const daysLeft = Math.max(10 - streak, 0);

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Flame className="h-5 w-5 text-primary" />
        <h3 className="text-sm font-medium text-foreground">
          Unlock Posting
        </h3>
      </div>
      <p className="text-sm text-muted-foreground">
        Reach a <strong>10-day practice streak</strong> to share with the
        community!{" "}
        {daysLeft > 0
          ? `${daysLeft} more day${daysLeft === 1 ? "" : "s"} to go.`
          : "You're almost there!"}
      </p>
      <div className="space-y-1">
        <Progress value={progress} className="h-2" />
        <p className="text-xs text-muted-foreground text-right">
          {streak}/10 days
        </p>
      </div>
    </div>
  );
}
