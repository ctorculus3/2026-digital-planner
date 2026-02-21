import { GraduationCap } from "lucide-react";
import { useStudentTeacherComment } from "@/hooks/useTeacherComment";

interface Props {
  logDate: string;
}

export function TeacherCommentCard({ logDate }: Props) {
  const { teacherComment, isLoading } = useStudentTeacherComment(logDate);

  if (isLoading || !teacherComment) return null;

  return (
    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-1">
      <div className="flex items-center gap-2 text-sm font-display text-primary">
        <GraduationCap className="h-4 w-4" />
        <span>{teacherComment.teacherName}</span>
      </div>
      <p className="text-sm text-foreground whitespace-pre-wrap">{teacherComment.comment}</p>
    </div>
  );
}
