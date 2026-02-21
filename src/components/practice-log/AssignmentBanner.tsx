import { useStudentAssignment } from "@/hooks/useWeeklyAssignment";
import { useStudentStudio } from "@/hooks/useStudentStudio";
import { ClipboardList } from "lucide-react";

interface Props {
  date: Date;
}

export function AssignmentBanner({ date }: Props) {
  const { assignment, isLoading } = useStudentAssignment(date);
  const { studioInfo } = useStudentStudio();

  if (isLoading || !assignment) return null;

  const teacherName = studioInfo?.teacher_name || "your teacher";

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20 text-sm text-foreground">
      <ClipboardList className="w-4 h-4 text-primary flex-shrink-0" />
      <span>
        This week's assignment from <strong>{teacherName}</strong>
        {assignment.notes && <span className="text-muted-foreground ml-1">— {assignment.notes}</span>}
      </span>
    </div>
  );
}
