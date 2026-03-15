import { useState } from "react";
import { useStudentAssignment } from "@/hooks/useWeeklyAssignment";
import { useStudentStudio } from "@/hooks/useStudentStudio";
import { Button } from "@/components/ui/button";
import { ClipboardList, ChevronDown, ChevronUp, Download } from "lucide-react";

interface Props {
  date: Date;
  onLoadAssignment?: () => void;
}

function AssignmentList({ label, items }: { label: string; items: string[] | null }) {
  const filtered = items?.filter(i => i.trim()) || [];
  if (filtered.length === 0) return null;
  return (
    <div>
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{label}</h4>
      <ul className="space-y-0.5">
        {filtered.map((item, idx) => (
          <li key={idx} className="text-sm text-foreground pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-primary/60">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AssignmentBanner({ date, onLoadAssignment }: Props) {
  const { assignment, isLoading } = useStudentAssignment(date);
  const { studioInfo } = useStudentStudio();
  const [expanded, setExpanded] = useState(false);

  if (isLoading || !assignment) return null;

  const teacherName = studioInfo?.teacher_name || "your teacher";

  const hasDetails =
    (assignment.goals?.trim()) ||
    (assignment.subgoals?.trim()) ||
    (assignment.repertoire?.some(r => r.trim())) ||
    (assignment.warmups?.some(w => w.trim())) ||
    (assignment.scales?.some(s => s.trim())) ||
    (assignment.additional_tasks?.some(t => t.trim())) ||
    (assignment.ear_training?.some(e => e.trim()));

  return (
    <div className="rounded-lg bg-primary/10 border border-primary/20 text-sm text-foreground overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(prev => !prev)}
        className="flex items-center gap-2 px-3 py-2 w-full text-left hover:bg-primary/5 transition-colors"
      >
        <ClipboardList className="w-4 h-4 text-primary flex-shrink-0" />
        <span className="flex-1">
          This week's assignment from <strong>{teacherName}</strong>
          {assignment.notes && <span className="text-muted-foreground ml-1">— {assignment.notes}</span>}
        </span>
        {hasDetails && (
          expanded
            ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        )}
      </button>

      {expanded && hasDetails && (
        <div className="px-3 pb-3 pt-1 border-t border-primary/10 space-y-3">
          {assignment.goals?.trim() && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Goals</h4>
              <p className="text-sm text-foreground">{assignment.goals}</p>
            </div>
          )}
          {assignment.subgoals?.trim() && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Subgoals</h4>
              <p className="text-sm text-foreground">{assignment.subgoals}</p>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AssignmentList label="Repertoire" items={assignment.repertoire} />
            <AssignmentList label="Warm-ups" items={assignment.warmups} />
            <AssignmentList label="Scales" items={assignment.scales} />
            <AssignmentList label="Ear Training" items={assignment.ear_training} />
            <AssignmentList label="Additional Tasks" items={assignment.additional_tasks} />
          </div>
          {onLoadAssignment && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => { onLoadAssignment?.(); setExpanded(false); }}
              className="w-full mt-2"
            >
              <Download className="w-4 h-4 mr-1.5" />
              Load assignment into today's log
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
