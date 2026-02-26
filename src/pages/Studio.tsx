import { useState } from "react";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { UserMenu } from "@/components/practice-log/UserMenu";
import { useStudioData } from "@/hooks/useStudioData";
import { CreateStudioDialog } from "@/components/studio/CreateStudioDialog";
import { InviteCodeCard } from "@/components/studio/InviteCodeCard";
import { StudentList } from "@/components/studio/StudentList";
import { TeacherUpgradeCard } from "@/components/studio/TeacherUpgradeCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, GraduationCap, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { isTeacherTier } from "@/lib/subscriptionTiers";
import { useAssignmentStatuses } from "@/hooks/useAssignmentStatuses";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function Studio() {
  const { studio, students, loading, createStudio, removeStudent, refetch } = useStudioData();
  const { statuses: assignmentStatuses, weekStart } = useAssignmentStatuses(studio?.id);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);
  const [isBulkSending, setIsBulkSending] = useState(false);
  const { toast } = useToast();
  const { subscription } = useAuth();
  const hasTeacherSub = isTeacherTier(subscription.productId);
  const queryClient = useQueryClient();

  const handleCreate = async (name: string) => {
    try {
      await createStudio(name);
      toast({ title: "Studio created!" });
    } catch (err: any) {
      toast({ title: err.message || "Could not create studio", variant: "destructive" });
      throw err;
    }
  };

  const handleRemove = async (studentId: string) => {
    try {
      await removeStudent(studentId);
      toast({ title: "Student removed" });
      // Clean up selection if removed student was selected
      setSelectedStudentIds((prev) => {
        const next = new Set(prev);
        next.delete(studentId);
        return next;
      });
    } catch {
      toast({ title: "Could not remove student", variant: "destructive" });
    }
  };

  // Categorize selected students by their assignment status
  const draftIds = [...selectedStudentIds].filter((id) => assignmentStatuses[id] === "draft");
  const alreadySentIds = [...selectedStudentIds].filter((id) => assignmentStatuses[id] === "sent");
  const noAssignmentIds = [...selectedStudentIds].filter((id) => !assignmentStatuses[id]);

  const handleBulkSend = async () => {
    if (!studio?.id || draftIds.length === 0) return;
    setIsBulkSending(true);
    try {
      const { error } = await supabase
        .from("weekly_assignments")
        .update({ status: "sent" } as any)
        .eq("studio_id", studio.id)
        .eq("week_start", weekStart)
        .in("student_user_id", draftIds)
        .eq("status", "draft");

      if (error) throw error;

      toast({ title: `Assignments sent to ${draftIds.length} student${draftIds.length !== 1 ? "s" : ""}!` });
      setSelectedStudentIds(new Set());
      queryClient.invalidateQueries({ queryKey: ["assignment-statuses", studio.id] });
      // Invalidate individual assignment queries so student views refresh
      for (const id of draftIds) {
        queryClient.invalidateQueries({ queryKey: ["weekly-assignment", studio.id, id, weekStart] });
      }
    } catch {
      toast({ title: "Failed to send assignments", variant: "destructive" });
    } finally {
      setIsBulkSending(false);
      setShowBulkConfirm(false);
    }
  };

  const studentName = (id: string) => students.find((s) => s.student_user_id === id)?.display_name || "Unnamed";

  return (
    <div className="min-h-screen bg-background">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-primary" />
          <span className="font-bold text-foreground">Studio</span>
        </div>
        <UserMenu />
      </div>
      <DashboardNav />

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !hasTeacherSub && !studio ? (
          <TeacherUpgradeCard />
        ) : !studio ? (
          <div className="text-center py-20 space-y-4">
            <GraduationCap className="h-16 w-16 mx-auto text-primary/40" />
            <h2 className="text-xl font-bold text-foreground">Create Your Teaching Studio</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Set up a studio to invite your students, monitor their practice, and leave assignments.
            </p>
            <Button onClick={() => setShowCreate(true)} size="lg">
              Get Started
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-foreground">Your Studio</h1>
              <Button variant="ghost" size="icon" onClick={refetch} title="Refresh">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>

            <InviteCodeCard
              studioName={studio.studio_name}
              inviteCode={studio.invite_code}
              studentCount={students.length}
              maxStudents={studio.max_students}
            />

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Students</CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <StudentList
                  students={students}
                  onRemove={handleRemove}
                  assignmentStatuses={assignmentStatuses}
                  selectedIds={selectedStudentIds}
                  onSelectionChange={setSelectedStudentIds}
                  onBulkSend={() => setShowBulkConfirm(true)}
                />
              </CardContent>
            </Card>
          </>
        )}
      </main>

      <CreateStudioDialog open={showCreate} onOpenChange={setShowCreate} onCreateStudio={handleCreate} />

      {/* Bulk Send Confirmation Dialog */}
      <AlertDialog open={showBulkConfirm} onOpenChange={setShowBulkConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send Assignments</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                {draftIds.length > 0 && (
                  <div>
                    <p className="font-medium text-foreground">
                      Will send to {draftIds.length} student{draftIds.length !== 1 ? "s" : ""}:
                    </p>
                    <ul className="mt-1 space-y-0.5">
                      {draftIds.map((id) => (
                        <li key={id} className="text-sm">{studentName(id)}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {alreadySentIds.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {alreadySentIds.length} student{alreadySentIds.length !== 1 ? "s" : ""} already sent (skipped): {alreadySentIds.map(studentName).join(", ")}
                  </p>
                )}
                {noAssignmentIds.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {noAssignmentIds.length} student{noAssignmentIds.length !== 1 ? "s" : ""} with no assignment (skipped): {noAssignmentIds.map(studentName).join(", ")}
                  </p>
                )}
                {draftIds.length === 0 && (
                  <p className="text-sm text-destructive">
                    None of the selected students have draft assignments to send.
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBulkSending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkSend}
              disabled={draftIds.length === 0 || isBulkSending}
            >
              {isBulkSending ? (
                <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Sending...</>
              ) : (
                `Send to ${draftIds.length} student${draftIds.length !== 1 ? "s" : ""}`
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
