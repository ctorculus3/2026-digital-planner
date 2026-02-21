import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { UserMinus } from "lucide-react";
import type { StudioStudent } from "@/hooks/useStudioData";

interface Props {
  students: StudioStudent[];
  onRemove: (studentId: string) => void;
}

function getStatusColor(lastPracticeDate: string | null): { color: string; label: string } {
  if (!lastPracticeDate) return { color: "bg-destructive", label: "No activity" };

  const last = new Date(lastPracticeDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  last.setHours(0, 0, 0, 0);

  const diffDays = Math.floor((today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays <= 1) return { color: "bg-primary", label: "On track" };
  if (diffDays <= 2) return { color: "bg-accent-foreground", label: "Missed a day" };
  return { color: "bg-destructive", label: `${diffDays}d missed` };
}

function formatWeeklyTime(minutes: number): string {
  if (minutes === 0) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

export function StudentList({ students, onRemove }: Props) {
  if (students.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg font-medium">No students yet</p>
        <p className="text-sm mt-1">Share your invite code to get started!</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Student</TableHead>
          <TableHead className="text-center">Status</TableHead>
          <TableHead className="text-center">Streak</TableHead>
          <TableHead className="text-center">This Week</TableHead>
          <TableHead className="w-12" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {students.map((s) => {
          const status = getStatusColor(s.last_practice_date);
          return (
            <TableRow key={s.student_user_id}>
              <TableCell className="font-medium">
                {s.display_name || "Unnamed Student"}
              </TableCell>
              <TableCell className="text-center">
                <span className="inline-flex items-center gap-1.5 text-xs">
                  <span className={`inline-block h-2.5 w-2.5 rounded-full ${status.color}`} />
                  {status.label}
                </span>
              </TableCell>
              <TableCell className="text-center font-mono">
                {s.streak > 0 ? `🔥 ${s.streak}` : "0"}
              </TableCell>
              <TableCell className="text-center">
                {formatWeeklyTime(s.weekly_minutes)}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => onRemove(s.student_user_id)}
                  title="Remove student"
                >
                  <UserMinus className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
