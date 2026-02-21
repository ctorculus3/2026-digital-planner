import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useTeacherAssignment } from "@/hooks/useWeeklyAssignment";
import { startOfWeek, format, addWeeks, subWeeks } from "date-fns";
import { Save, Trash2, Loader2, ClipboardList, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Props {
  studioId: string | undefined;
  studentUserId: string;
  currentDate: Date;
}

export function WeeklyAssignmentPanel({ studioId, studentUserId, currentDate }: Props) {
  const { toast } = useToast();
  const [weekOffset, setWeekOffset] = useState(0);
  const monday = startOfWeek(addWeeks(currentDate, weekOffset), { weekStartsOn: 1 });
  const weekStart = format(monday, "yyyy-MM-dd");
  const weekLabel = `Week of ${format(monday, "MMM d, yyyy")}`;

  const { assignment, isLoading, save, isSaving, remove, isDeleting } = useTeacherAssignment(studioId, studentUserId, weekStart);

  const [goals, setGoals] = useState("");
  const [subgoals, setSubgoals] = useState("");
  const [repertoire, setRepertoire] = useState<string[]>(["", "", "", ""]);
  const [warmups, setWarmups] = useState<string[]>(["", "", "", ""]);
  const [scales, setScales] = useState<string[]>(["", "", "", ""]);
  const [additionalTasks, setAdditionalTasks] = useState<string[]>(["", "", "", ""]);
  const [earTraining, setEarTraining] = useState<string[]>(["", "", "", ""]);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (assignment) {
      setGoals(assignment.goals || "");
      setSubgoals(assignment.subgoals || "");
      const pad = (arr: string[] | null, min: number) => {
        const a = [...(arr || [])];
        while (a.length < min) a.push("");
        return a;
      };
      setRepertoire(pad(assignment.repertoire, 4));
      setWarmups(pad(assignment.warmups, 4));
      setScales(pad(assignment.scales, 4));
      setAdditionalTasks(pad(assignment.additional_tasks, 4));
      setEarTraining(pad(assignment.ear_training, 4));
      setNotes(assignment.notes || "");
    } else if (!isLoading) {
      setGoals(""); setSubgoals(""); setNotes("");
      setRepertoire(["", "", "", ""]);
      setWarmups(["", "", "", ""]);
      setScales(["", "", "", ""]);
      setAdditionalTasks(["", "", "", ""]);
      setEarTraining(["", "", "", ""]);
    }
  }, [assignment, isLoading, weekStart]);

  const handleSave = () => {
    save({ goals, subgoals, repertoire, warmups, scales, additional_tasks: additionalTasks, ear_training: earTraining, notes }, {
      onSuccess: () => toast({ title: "Assignment saved" }),
      onError: (err: any) => toast({ title: "Error saving assignment", description: err.message, variant: "destructive" }),
    });
  };

  const handleDelete = () => {
    remove(undefined, {
      onSuccess: () => toast({ title: "Assignment deleted" }),
    });
  };

  const updateArr = (setter: React.Dispatch<React.SetStateAction<string[]>>) => (idx: number, val: string) => {
    setter(prev => { const n = [...prev]; n[idx] = val; return n; });
  };

  const addRow = (setter: React.Dispatch<React.SetStateAction<string[]>>, max = 10) => {
    setter(prev => prev.length < max ? [...prev, ""] : prev);
  };

  const renderList = (label: string, items: string[], setter: React.Dispatch<React.SetStateAction<string[]>>) => (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-muted-foreground">{label}</label>
        {items.length < 10 && (
          <Button type="button" variant="ghost" size="sm" className="h-6 px-1" onClick={() => addRow(setter)}>
            <Plus className="w-3 h-3" />
          </Button>
        )}
      </div>
      {items.map((item, idx) => (
        <Input key={idx} value={item} onChange={(e) => updateArr(setter)(idx, e.target.value)} placeholder={`${label} ${idx + 1}`} className="h-7 text-xs" />
      ))}
    </div>
  );

  if (isLoading) return null;

  return (
    <div className="bg-card rounded-lg p-4 shadow-sm border border-border space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-display text-muted-foreground">
          <ClipboardList className="h-4 w-4" />
          Weekly Assignment
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setWeekOffset(o => o - 1)}>
            <ChevronLeft className="w-3.5 h-3.5" />
          </Button>
          <span className="text-xs font-medium text-foreground min-w-[140px] text-center">{weekLabel}</span>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setWeekOffset(o => o + 1)}>
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground">Goals</label>
          <Textarea value={goals} onChange={(e) => setGoals(e.target.value)} placeholder="Main goals for this week..." className="min-h-[60px] text-xs" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Subgoals</label>
          <Textarea value={subgoals} onChange={(e) => setSubgoals(e.target.value)} placeholder="Subgoals..." className="min-h-[40px] text-xs" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {renderList("Repertoire", repertoire, setRepertoire)}
          {renderList("Warm-ups", warmups, setWarmups)}
          {renderList("Scales", scales, setScales)}
          {renderList("Ear Training", earTraining, setEarTraining)}
          {renderList("Additional Tasks", additionalTasks, setAdditionalTasks)}
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground">Notes</label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes for the student..." className="min-h-[40px] text-xs" />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button size="sm" onClick={handleSave} disabled={isSaving}>
          {isSaving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
          Save Assignment
        </Button>
        {assignment && (
          <Button size="sm" variant="ghost" onClick={handleDelete} disabled={isDeleting} className="text-destructive hover:text-destructive">
            {isDeleting ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Trash2 className="w-4 h-4 mr-1" />}
            Delete
          </Button>
        )}
      </div>
    </div>
  );
}
