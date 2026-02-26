import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { useStudioData } from "@/hooks/useStudioData";
import { useStudentBadges } from "@/hooks/useStudentBadges";
import { StudentStatusCard } from "@/components/studio/StudentStatusCard";
import { TeacherCommentPanel } from "@/components/studio/TeacherCommentPanel";
import { WeeklyAssignmentPanel } from "@/components/studio/WeeklyAssignmentPanel";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function StudentLogView() {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { studio, students, loading: studioLoading } = useStudioData();

  const student = students.find((s) => s.student_user_id === studentId);
  const { badges, isLoading: badgesLoading } = useStudentBadges(studentId || "");

  const today = new Date();
  const todayString = format(today, "yyyy-MM-dd");

  // Verify access
  if (!user || !studentId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Access denied</p>
      </div>
    );
  }

  if (studioLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-muted-foreground">Student not found</p>
          <Button variant="ghost" size="sm" onClick={() => navigate("/studio")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Studio
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center">
          <Button variant="ghost" size="sm" onClick={() => navigate("/studio")}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Studio
          </Button>
        </div>

        {/* Student Status Card */}
        <StudentStatusCard
          student={student}
          badges={badges}
          badgesLoading={badgesLoading}
        />

        {/* Teacher Comment Panel */}
        <TeacherCommentPanel
          studioId={studio?.id}
          studentUserId={studentId}
          logDate={todayString}
        />

        {/* Weekly Assignment Panel */}
        <WeeklyAssignmentPanel
          studioId={studio?.id}
          studentUserId={studentId}
          currentDate={today}
        />
      </div>
    </div>
  );
}
