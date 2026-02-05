import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { usePracticeLog } from "@/hooks/usePracticeLog";
import { useAuth } from "@/contexts/AuthContext";
import { Save, Loader2, Plus } from "lucide-react";
import { useDebouncedCallback } from "@/hooks/useDebounce";

interface PracticeLogFormProps {
  date: Date;
}

export function PracticeLogForm({ date }: PracticeLogFormProps) {
  const { user } = useAuth();
  const { practiceLog, isLoading, save, isSaving } = usePracticeLog(date);

  const [mainGoals, setMainGoals] = useState("");
  const [subgoals, setSubgoals] = useState("");
  const [startTime, setStartTime] = useState("");
  const [stopTime, setStopTime] = useState("");
  const [warmups, setWarmups] = useState<string[]>(Array(10).fill(""));
  const [scales, setScales] = useState<string[]>(Array(10).fill(""));
  const [repertoire, setRepertoire] = useState<string[]>(Array(15).fill(""));
  const [notes, setNotes] = useState("");
  const [metronomeUsed, setMetronomeUsed] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Track visible row counts
  const [warmupCount, setWarmupCount] = useState(4);
  const [scaleCount, setScaleCount] = useState(4);
  const [repertoireCount, setRepertoireCount] = useState(10);

  // Refs for auto-expanding textareas
  const mainGoalsRef = useRef<HTMLTextAreaElement>(null);
  const subgoalsRef = useRef<HTMLTextAreaElement>(null);
  const notesRef = useRef<HTMLTextAreaElement>(null);

  const adjustTextareaHeight = (textarea: HTMLTextAreaElement | null) => {
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.max(80, textarea.scrollHeight)}px`;
  };

  // Load data when practice log is fetched
  useEffect(() => {
    if (practiceLog) {
      setMainGoals(practiceLog.goals || "");
      setSubgoals(practiceLog.subgoals || "");
      setStartTime(practiceLog.start_time || "");
      setStopTime(practiceLog.stop_time || "");
      
      const loadedWarmups = [...(practiceLog.warmups || [])];
      while (loadedWarmups.length < 10) loadedWarmups.push("");
      setWarmups(loadedWarmups.slice(0, 10));
      setWarmupCount(Math.max(4, practiceLog.warmups?.length || 0));
      
      const loadedScales = [...(practiceLog.scales || [])];
      while (loadedScales.length < 10) loadedScales.push("");
      setScales(loadedScales.slice(0, 10));
      setScaleCount(Math.max(4, practiceLog.scales?.length || 0));
      
      const loadedRepertoire = [...(practiceLog.repertoire || [])];
      while (loadedRepertoire.length < 15) loadedRepertoire.push("");
      setRepertoire(loadedRepertoire.slice(0, 15));
      setRepertoireCount(Math.max(10, practiceLog.repertoire?.length || 0));
      
      setNotes(practiceLog.notes || "");
      setMetronomeUsed(practiceLog.metronome_used || false);
      setHasUnsavedChanges(false);
      
      // Adjust textarea heights after data loads
      setTimeout(() => {
        adjustTextareaHeight(mainGoalsRef.current);
        adjustTextareaHeight(subgoalsRef.current);
        adjustTextareaHeight(notesRef.current);
      }, 0);
    } else if (!isLoading) {
      // Reset form for new day
      setMainGoals("");
      setSubgoals("");
      setStartTime("");
      setStopTime("");
      setWarmups(Array(10).fill(""));
      setScales(Array(10).fill(""));
      setRepertoire(Array(15).fill(""));
      setWarmupCount(4);
      setScaleCount(4);
      setRepertoireCount(10);
      setNotes("");
      setMetronomeUsed(false);
      setHasUnsavedChanges(false);
    }
  }, [practiceLog, isLoading]);

  const totalTime = useMemo(() => {
    if (!startTime || !stopTime) return "";
    
    const [startHour, startMin] = startTime.split(":").map(Number);
    const [stopHour, stopMin] = stopTime.split(":").map(Number);
    
    let totalMinutes = (stopHour * 60 + stopMin) - (startHour * 60 + startMin);
    
    if (totalMinutes < 0) {
      totalMinutes += 24 * 60;
    }
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    return `${hours}:${minutes.toString().padStart(2, "0")}`;
  }, [startTime, stopTime]);

  const handleSave = useCallback(() => {
    save({
      goals: mainGoals,
      subgoals,
      start_time: startTime || null,
      stop_time: stopTime || null,
      warmups,
      scales,
      repertoire,
      technique: "",
      musicianship: "",
      notes,
      metronome_used: metronomeUsed,
    });
    setHasUnsavedChanges(false);
  }, [mainGoals, subgoals, startTime, stopTime, warmups, scales, repertoire, notes, metronomeUsed, save]);

  // Auto-save with debounce
  const debouncedSave = useDebouncedCallback(handleSave, 2000);

  const markChanged = useCallback(() => {
    if (user) {
      setHasUnsavedChanges(true);
      debouncedSave();
    }
  }, [user, debouncedSave]);

  const dayName = date.toLocaleDateString("en-US", { weekday: "long" }).toUpperCase();
  const formattedDate = date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).toUpperCase().replace(",", "");

  const updateWarmup = (index: number, value: string) => {
    const newWarmups = [...warmups];
    newWarmups[index] = value;
    setWarmups(newWarmups);
    markChanged();
  };

  const updateScale = (index: number, value: string) => {
    const newScales = [...scales];
    newScales[index] = value;
    setScales(newScales);
    markChanged();
  };

  const updateRepertoire = (index: number, value: string) => {
    const newRepertoire = [...repertoire];
    newRepertoire[index] = value;
    setRepertoire(newRepertoire);
    markChanged();
  };

  const addWarmup = () => {
    if (warmupCount < 10) {
      setWarmupCount(prev => prev + 1);
    }
  };

  const addScale = () => {
    if (scaleCount < 10) {
      setScaleCount(prev => prev + 1);
    }
  };

  const addRepertoire = () => {
    if (repertoireCount < 15) {
      setRepertoireCount(prev => prev + 1);
    }
  };

  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">Please sign in to view your practice log.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 overflow-auto">
      {/* Date Header with Save Button */}
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl md:text-2xl text-foreground">
          {dayName} – {formattedDate}
        </h2>
        <Button
          onClick={handleSave}
          disabled={isSaving || !hasUnsavedChanges}
          size="sm"
          variant={hasUnsavedChanges ? "default" : "outline"}
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          {isSaving ? "Saving..." : hasUnsavedChanges ? "Save" : "Saved"}
        </Button>
      </div>

      {/* Goals Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card rounded-lg p-3 shadow-sm border border-border">
          <label className="font-display text-sm text-muted-foreground mb-2 block">Main Goals</label>
          <Textarea
            ref={mainGoalsRef}
            value={mainGoals}
            onChange={(e) => { setMainGoals(e.target.value); markChanged(); adjustTextareaHeight(e.target); }}
            className="min-h-[80px] bg-transparent border-none resize-none focus-visible:ring-0 p-0"
            placeholder="What do you want to accomplish today?"
          />
        </div>
        <div className="bg-card rounded-lg p-3 shadow-sm border border-border">
          <label className="font-display text-sm text-muted-foreground mb-2 block">Subgoals</label>
          <Textarea
            ref={subgoalsRef}
            value={subgoals}
            onChange={(e) => { setSubgoals(e.target.value); markChanged(); adjustTextareaHeight(e.target); }}
            className="min-h-[80px] bg-transparent border-none resize-none focus-visible:ring-0 p-0"
            placeholder="Break down your goals..."
          />
        </div>
      </div>

      {/* Time Tracking */}
      <div className="bg-card rounded-lg p-3 shadow-sm border border-border">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="font-display text-sm text-muted-foreground block mb-1">Start Time:</label>
            <Input
              type="time"
              value={startTime}
              onChange={(e) => { setStartTime(e.target.value); markChanged(); }}
              className="bg-transparent border-b border-border rounded-none px-0"
            />
          </div>
          <div>
            <label className="font-display text-sm text-muted-foreground block mb-1">Stop:</label>
            <Input
              type="time"
              value={stopTime}
              onChange={(e) => { setStopTime(e.target.value); markChanged(); }}
              className="bg-transparent border-b border-border rounded-none px-0"
            />
          </div>
          <div>
            <label className="font-display text-sm text-muted-foreground block mb-1">Total Time:</label>
            <div className="h-10 flex items-center border-b border-border text-foreground font-medium">
              {totalTime || "0:00"}
            </div>
          </div>
        </div>
      </div>

      {/* Warmups and Scales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card rounded-lg p-3 shadow-sm border border-border">
          <label className="font-display text-sm text-muted-foreground mb-2 block">Warm-ups</label>
          <div className="space-y-2">
            {warmups.slice(0, warmupCount).map((warmup, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-muted-foreground text-sm w-4">{index + 1}</span>
                <Input
                  value={warmup}
                  onChange={(e) => updateWarmup(index, e.target.value)}
                  className="bg-transparent border-b border-border rounded-none px-1 flex-1"
                />
              </div>
            ))}
          </div>
          {warmupCount < 10 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={addWarmup}
              className="mt-2 text-muted-foreground hover:text-foreground"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          )}
        </div>
        <div className="bg-card rounded-lg p-3 shadow-sm border border-border">
          <label className="font-display text-sm text-muted-foreground mb-2 block">Scales</label>
          <div className="space-y-2">
            {scales.slice(0, scaleCount).map((scale, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-muted-foreground text-sm w-4">{index + 1}</span>
                <Input
                  value={scale}
                  onChange={(e) => updateScale(index, e.target.value)}
                  className="bg-transparent border-b border-border rounded-none px-1 flex-1"
                />
              </div>
            ))}
          </div>
          {scaleCount < 10 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={addScale}
              className="mt-2 text-muted-foreground hover:text-foreground"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          )}
        </div>
      </div>

      {/* Repertoire and Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card rounded-lg p-3 shadow-sm border border-border">
          <label className="font-display text-sm text-muted-foreground mb-2 block">Repertoire & Exercises</label>
          <div className="space-y-1">
            {repertoire.slice(0, repertoireCount).map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full border border-muted-foreground/30" />
                <Input
                  value={item}
                  onChange={(e) => updateRepertoire(index, e.target.value)}
                  className="bg-transparent border-b border-border rounded-none px-1 flex-1 h-7"
                />
              </div>
            ))}
          </div>
          {repertoireCount < 15 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={addRepertoire}
              className="mt-2 text-muted-foreground hover:text-foreground"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-card rounded-lg p-3 shadow-sm border border-border">
            <label className="font-display text-sm text-muted-foreground mb-2 block">Notes & Focus</label>
            <Textarea
              ref={notesRef}
              value={notes}
              onChange={(e) => { setNotes(e.target.value); markChanged(); adjustTextareaHeight(e.target); }}
              className="min-h-[80px] bg-transparent border-none resize-none focus-visible:ring-0 p-0"
              placeholder="Observations, breakthroughs, challenges..."
            />
          </div>

          <div className="bg-card rounded-lg p-3 shadow-sm border border-border">
            <div className="flex items-center gap-3">
              <Checkbox
                id="metronome"
                checked={metronomeUsed}
                onCheckedChange={(checked) => { setMetronomeUsed(!!checked); markChanged(); }}
              />
              <label htmlFor="metronome" className="font-display text-sm text-foreground cursor-pointer">
                Used Metronome Today
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
