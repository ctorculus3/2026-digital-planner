import { useStudentStudio } from "@/hooks/useStudentStudio";
import { GraduationCap } from "lucide-react";

export function StudioMemberBanner() {
  const { studioInfo, loading } = useStudentStudio();

  if (loading || !studioInfo) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/10 text-sm text-muted-foreground">
      <GraduationCap className="w-4 h-4 text-primary shrink-0" />
      <span>
        <span className="font-medium text-foreground">{studioInfo.studio_name}</span>
        {studioInfo.teacher_name && (
          <span> &middot; {studioInfo.teacher_name}</span>
        )}
      </span>
    </div>
  );
}
