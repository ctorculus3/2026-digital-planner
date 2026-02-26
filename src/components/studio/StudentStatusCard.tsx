import { Flame, Clock, CalendarDays } from "lucide-react";
import { BadgeShelf } from "@/components/dashboard/BadgeShelf";
import type { StudioStudent } from "@/hooks/useStudioData";

interface Badge {
  id: string;
  badge_type: string;
  earned_at: string;
}

interface Props {
  student: StudioStudent;
  badges: Badge[];
  badgesLoading: boolean;
}

export function StudentStatusCard({ student, badges, badgesLoading }: Props) {
  const formatWeeklyTime = (minutes: number) => {
    if (minutes === 0) return "0m";
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  };

  const formatLastActive = (date: string | null) => {
    if (!date) return "No activity yet";
    const d = new Date(date + "T00:00:00");
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const diff = Math.floor((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    if (diff < 7) return `${diff} days ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className="space-y-4">
      {/* Student info + stats */}
      <div className="bg-accent rounded-lg p-4 md:p-6 shadow-sm border border-border">
        <div className="flex items-center gap-4 mb-4">
          {/* Avatar */}
          {student.avatar_url ? (
            <img
              src={student.avatar_url}
              alt={student.display_name || "Student"}
              className="w-14 h-14 rounded-full object-cover border-2 border-border"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center border-2 border-border">
              <span className="text-lg font-bold text-muted-foreground">
                {(student.display_name || "?")[0].toUpperCase()}
              </span>
            </div>
          )}

          {/* Name */}
          <h1 className="text-xl font-display font-bold text-foreground">
            {student.display_name || "Student"}
          </h1>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            <div>
              <p className="text-lg font-bold text-foreground leading-tight">{student.streak}</p>
              <p className="text-[11px] text-muted-foreground">day streak</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <div>
              <p className="text-lg font-bold text-foreground leading-tight">
                {formatWeeklyTime(student.weekly_minutes)}
              </p>
              <p className="text-[11px] text-muted-foreground">this week</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground leading-tight">
                {formatLastActive(student.last_practice_date)}
              </p>
              <p className="text-[11px] text-muted-foreground">last active</p>
            </div>
          </div>
        </div>
      </div>

      {/* Badges */}
      <BadgeShelf badges={badges} loading={badgesLoading} streak={student.streak} showShare={false} />
    </div>
  );
}
