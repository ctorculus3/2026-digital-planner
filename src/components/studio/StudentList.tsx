import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { UserMinus, FileText, Send, Minus, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { StudioStudent } from "@/hooks/useStudioData";
import type { AssignmentStatus } from "@/hooks/useAssignmentStatuses";

interface Props {
  students: StudioStudent[];
  onRemove: (studentId: string) => void;
  assignmentStatuses?: Record<string, AssignmentStatus>;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
  onBulkSend?: () => void;
}

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
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

export function StudentList({
  students,
  onRemove,
  assignmentStatuses = {},
  selectedIds,
  onSelectionChange,
  onBulkSend,
}: Props) {
  const navigate = useNavigate();
  const selectable = !!selectedIds && !!onSelectionChange;

  if (students.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg font-medium">No students yet</p>
        <p className="text-sm mt-1">Share your invite code to get started!</p>
      </div>
    );
  }

  const allSelected = selectable && students.length > 0 && students.every((s) => selectedIds.has(s.student_user_id));
  const someSelected = selectable && selectedIds.size > 0 && !allSelected;

  const toggleAll = () => {
    if (!onSelectionChange) return;
    if (allSelected) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(students.map((s) => s.student_user_id)));
    }
  };

  const toggleOne = (id: string) => {
    if (!selectedIds || !onSelectionChange) return;
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    onSelectionChange(next);
  };

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            {selectable && (
              <TableHead className="w-10">
                <Checkbox
                  checked={allSelected ? true : someSelected ? "indeterminate" : false}
                  onCheckedChange={toggleAll}
                  aria-label="Select all students"
                />
              </TableHead>
            )}
            <TableHead>Student</TableHead>
            <TableHead className="text-center">Status</TableHead>
            <TableHead className="text-center">Streak</TableHead>
            <TableHead className="text-center">This Week</TableHead>
            <TableHead className="text-center">Assignment</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((s) => {
            const status = getStatusColor(s.last_practice_date);
            const isSelected = selectable && selectedIds.has(s.student_user_id);
            return (
              <TableRow key={s.student_user_id} data-state={isSelected ? "selected" : undefined}>
                {selectable && (
                  <TableCell>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleOne(s.student_user_id)}
                      aria-label={`Select ${s.display_name || "student"}`}
                    />
                  </TableCell>
                )}
                <TableCell
                  className="font-medium cursor-pointer hover:text-primary transition-colors"
                  onClick={() => navigate(`/studio/student/${s.student_user_id}`)}
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      {s.avatar_url && (
                        <AvatarImage src={s.avatar_url} alt={s.display_name || "Student"} />
                      )}
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {getInitials(s.display_name)}
                      </AvatarFallback>
                    </Avatar>
                    {s.display_name || "Unnamed Student"}
                  </div>
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
                <TableCell className="text-center">
                  {assignmentStatuses[s.student_user_id] === "sent" ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full">
                      <Send className="w-3 h-3" /> Sent
                    </span>
                  ) : assignmentStatuses[s.student_user_id] === "draft" ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      <FileText className="w-3 h-3" /> Draft
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground/50">
                      <Minus className="w-3 h-3" /> None
                    </span>
                  )}
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

      {/* Bulk action bar */}
      {selectable && selectedIds.size > 0 && (
        <div className="border-t border-border bg-muted/50 px-4 py-3 flex items-center justify-between rounded-b-lg">
          <span className="text-sm text-muted-foreground">
            {selectedIds.size} student{selectedIds.size !== 1 ? "s" : ""} selected
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSelectionChange(new Set())}
            >
              <X className="w-4 h-4 mr-1" /> Clear
            </Button>
            <Button size="sm" onClick={onBulkSend}>
              <Send className="w-4 h-4 mr-1" /> Send Selected
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
