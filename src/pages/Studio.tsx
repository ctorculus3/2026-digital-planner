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
import { Loader2, GraduationCap, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { isTeacherTier } from "@/lib/subscriptionTiers";

export default function Studio() {
  const { studio, students, loading, createStudio, updateStudioName, removeStudent, refetch } = useStudioData();
  const [showCreate, setShowCreate] = useState(false);
  const { toast } = useToast();
  const { subscription } = useAuth();
  const hasTeacherSub = isTeacherTier(subscription.productId);

  const handleCreate = async (name: string) => {
    try {
      await createStudio(name);
      toast({ title: "Studio created!" });
    } catch (err: any) {
      toast({ title: err.message || "Could not create studio", variant: "destructive" });
      throw err;
    }
  };

  const handleRename = async (newName: string) => {
    try {
      await updateStudioName(newName);
      toast({ title: "Studio renamed" });
    } catch {
      toast({ title: "Could not rename studio", variant: "destructive" });
    }
  };

  const handleRemove = async (studentId: string) => {
    try {
      await removeStudent(studentId);
      toast({ title: "Student removed" });
    } catch {
      toast({ title: "Could not remove student", variant: "destructive" });
    }
  };

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
              onRename={handleRename}
            />

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Students</CardTitle>
              </CardHeader>
              <CardContent>
                <StudentList students={students} onRemove={handleRemove} />
              </CardContent>
            </Card>
          </>
        )}
      </main>

      <CreateStudioDialog open={showCreate} onOpenChange={setShowCreate} onCreateStudio={handleCreate} />
    </div>
  );
}
