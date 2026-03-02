import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useTeacherComment } from "@/hooks/useTeacherComment";
import { Save, Trash2, Loader2, MessageSquare } from "lucide-react";

interface Props {
  studioId: string | undefined;
  studentUserId: string;
  logDate: string;
}

export function TeacherCommentPanel({ studioId, studentUserId, logDate }: Props) {
  const { comment, isLoading, save, isSaving, remove, isDeleting } = useTeacherComment(studioId, studentUserId, logDate);
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    setDraft(comment || "");
    setEditing(false);
  }, [comment, logDate]);

  const handleSave = () => {
    if (!draft.trim()) return;
    save(draft.trim());
    setEditing(false);
  };

  const handleDelete = () => {
    remove();
    setDraft("");
    setEditing(false);
  };

  if (isLoading) return null;

  return (
    <div className="bg-[hsl(var(--time-section-bg))] rounded-lg p-4 shadow-sm border border-border space-y-3">
      <div className="flex items-center gap-2 text-sm font-display text-muted-foreground">
        <MessageSquare className="h-4 w-4" />
        Teacher Comment
      </div>

      {!comment && !editing ? (
        <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
          Leave a comment
        </Button>
      ) : (
        <>
          <Textarea
            value={draft}
            onChange={(e) => { setDraft(e.target.value); setEditing(true); }}
            placeholder="Write feedback for this student's practice session..."
            className="min-h-[80px]"
          />
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleSave} disabled={isSaving || !draft.trim()}>
              {isSaving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
              Save
            </Button>
            {comment && (
              <Button size="sm" variant="ghost" onClick={handleDelete} disabled={isDeleting} className="text-destructive hover:text-destructive">
                {isDeleting ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Trash2 className="w-4 h-4 mr-1" />}
                Delete
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
