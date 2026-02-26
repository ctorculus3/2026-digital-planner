import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { usePracticeLog } from "@/hooks/usePracticeLog";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Save, Loader2, Plus } from "lucide-react";
import { AudioRecorder } from "./AudioRecorder";
import { ShareButton } from "./ShareButton";
import { CopyFromButton } from "./CopyFromButton";
import { MediaTools } from "./MediaTools";
import { AssignmentMediaDisplay } from "./AssignmentMediaDisplay";
import { LessonPdfs } from "./LessonPdfs";
import { Metronome } from "./Metronome";
import { Tuner } from "./Tuner";
import { DronePlayer } from "./DronePlayer";
import { Timer } from "./Timer";
import { PracticeSessionTimer } from "./PracticeSessionTimer";
import { MusicAI } from "./MusicAI";
import { useDebouncedCallback } from "@/hooks/useDebounce";
import { TeacherCommentCard } from "./TeacherCommentCard";
import { AssignmentBanner } from "./AssignmentBanner";
import { useStudentAssignment } from "@/hooks/useWeeklyAssignment";
interface PracticeLogFormProps {
  date: Date;
}

// Parse time string in various formats (12:30 PM, 2:30pm, 14:30, etc.)
const parseTimeString = (timeStr: string): {
  hours: number;
  minutes: number;
} | null => {
  if (!timeStr || !timeStr.trim()) return null;
  const cleaned = timeStr.trim().toLowerCase().replace(/\s+/g, '');

  // Check for AM/PM
  const isPM = cleaned.includes('pm') || cleaned.includes('p.m');
  const isAM = cleaned.includes('am') || cleaned.includes('a.m');

  // Remove AM/PM markers
  const timeOnly = cleaned.replace(/[ap]\.?m\.?/g, '').trim();

  // Parse hours and minutes
  const parts = timeOnly.split(':');
  if (parts.length < 2) return null;
  let hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  if (isNaN(hours) || isNaN(minutes)) return null;

  // Convert to 24-hour format
  if (isPM && hours < 12) hours += 12;
  if (isAM && hours === 12) hours = 0;
  return {
    hours,
    minutes
  };
};

// Normalize time from database (HH:MM:SS 24-hour to 12-hour AM/PM)
const normalizeTime = (time: string | null): string => {
  if (!time) return "";
  const parts = time.split(":");
  if (parts.length >= 2) {
    let hours = parseInt(parts[0], 10);
    const minutes = parts[1];
    if (isNaN(hours)) return time;
    const period = hours >= 12 ? "PM" : "AM";
    if (hours === 0) hours = 12;else
    if (hours > 12) hours -= 12;
    return `${hours}:${minutes} ${period}`;
  }
  return time;
};

// Convert user input (e.g., "12:30 PM") to database format "HH:MM"
const formatTimeForDb = (timeStr: string): string | null => {
  const parsed = parseTimeString(timeStr);
  if (!parsed) return null;
  const hours = parsed.hours.toString().padStart(2, '0');
  const minutes = parsed.minutes.toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};
export function PracticeLogForm({
  date
}: PracticeLogFormProps) {
  const {
    user
  } = useAuth();
  const queryClient = useQueryClient();
  const dateString = format(date, "yyyy-MM-dd");
  const {
    practiceLog,
    isLoading,
    save,
    isSaving
  } = usePracticeLog(date);
  const { assignment, isLoading: assignmentLoading } = useStudentAssignment(date);
  const [mainGoals, setMainGoals] = useState("");
  const [subgoals, setSubgoals] = useState("");
  const [startTime, setStartTime] = useState("");
  const [stopTime, setStopTime] = useState("");
  const [warmups, setWarmups] = useState<string[]>(Array(10).fill(""));
  const [scales, setScales] = useState<string[]>(Array(10).fill(""));
  const [repertoire, setRepertoire] = useState<string[]>(Array(15).fill(""));
  const [repertoireCompleted, setRepertoireCompleted] = useState<boolean[]>(Array(15).fill(false));
  const [repertoireRecordings, setRepertoireRecordings] = useState<string[]>(Array(15).fill(""));
  const [notes, setNotes] = useState("");
  const [metronomeUsed, setMetronomeUsed] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Additional Tasks state
  const [additionalTasks, setAdditionalTasks] = useState<string[]>(Array(10).fill(""));
  const [additionalTasksCompleted, setAdditionalTasksCompleted] = useState<boolean[]>(Array(10).fill(false));
  const [additionalTaskCount, setAdditionalTaskCount] = useState(4);

  // Ear Training state
  const [earTraining, setEarTraining] = useState<string[]>(Array(10).fill(""));
  const [earTrainingCompleted, setEarTrainingCompleted] = useState<boolean[]>(Array(10).fill(false));
  const [earTrainingCount, setEarTrainingCount] = useState(4);

  // Music Listening state
  const [musicListening, setMusicListening] = useState<string[]>(Array(10).fill(""));
  const [musicListeningCompleted, setMusicListeningCompleted] = useState<boolean[]>(Array(10).fill(false));
  const [musicListeningCount, setMusicListeningCount] = useState(4);

  // Track visible row counts
  const [warmupCount, setWarmupCount] = useState(4);
  const [scaleCount, setScaleCount] = useState(4);
  const [repertoireCount, setRepertoireCount] = useState(10);

  // Refs for auto-expanding textareas
  const mainGoalsRef = useRef<HTMLTextAreaElement>(null);
  const subgoalsRef = useRef<HTMLTextAreaElement>(null);
  const notesRef = useRef<HTMLTextAreaElement>(null);

  // Refs for initialization tracking to prevent race condition
  const isInitializedRef = useRef(false);
  const currentDateRef = useRef(date.toISOString());
  const lastUpdatedAtRef = useRef<string | null>(null);
  const adjustTextareaHeight = (textarea: HTMLTextAreaElement | null) => {
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.max(80, textarea.scrollHeight)}px`;
  };

  const [totalTimeOverride, setTotalTimeOverride] = useState<string | null>(null);

  // Load data when practice log is fetched - only initialize once per date
  useEffect(() => {
    // Reset initialization when date changes
    if (currentDateRef.current !== date.toISOString()) {
      isInitializedRef.current = false;
      lastUpdatedAtRef.current = null;
      currentDateRef.current = date.toISOString();
      setTotalTimeOverride(null);
    }

    // Detect external updates (e.g. copy operation) by tracking updated_at
    if (practiceLog && lastUpdatedAtRef.current &&
        practiceLog.updated_at !== lastUpdatedAtRef.current) {
      isInitializedRef.current = false;
    }
    if (practiceLog) {
      lastUpdatedAtRef.current = practiceLog.updated_at;
    }

    // Only initialize once per date to prevent overwriting user edits
    if (isInitializedRef.current) return;
    if (practiceLog) {
      setMainGoals(practiceLog.goals || "");
      setSubgoals(practiceLog.subgoals || "");
      setStartTime(normalizeTime(practiceLog.start_time));
      setStopTime(normalizeTime(practiceLog.stop_time));
      // Load DB total_time as override so accumulation works correctly
      if (practiceLog.total_time) {
        setTotalTimeOverride(String(practiceLog.total_time));
      } else {
        setTotalTimeOverride(null);
      }
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
      const loadedCompleted = [...(practiceLog.repertoire_completed || [])];
      while (loadedCompleted.length < 15) loadedCompleted.push(false);
      setRepertoireCompleted(loadedCompleted.slice(0, 15));
      const loadedRecordings = [...(practiceLog.repertoire_recordings || [])];
      while (loadedRecordings.length < 15) loadedRecordings.push("");
      setRepertoireRecordings(loadedRecordings.slice(0, 15));
      setNotes(practiceLog.notes || "");
      setMetronomeUsed(practiceLog.metronome_used || false);

      // Load Additional Tasks
      const loadedAdditionalTasks = [...(practiceLog.additional_tasks || [])];
      while (loadedAdditionalTasks.length < 10) loadedAdditionalTasks.push("");
      setAdditionalTasks(loadedAdditionalTasks.slice(0, 10));
      setAdditionalTaskCount(Math.max(4, practiceLog.additional_tasks?.length || 0));
      const loadedAdditionalTasksCompleted = [...(practiceLog.additional_tasks_completed || [])];
      while (loadedAdditionalTasksCompleted.length < 10) loadedAdditionalTasksCompleted.push(false);
      setAdditionalTasksCompleted(loadedAdditionalTasksCompleted.slice(0, 10));

      // Load Ear Training
      const loadedEarTraining = [...((practiceLog as any).ear_training || [])];
      while (loadedEarTraining.length < 10) loadedEarTraining.push("");
      setEarTraining(loadedEarTraining.slice(0, 10));
      setEarTrainingCount(Math.max(4, (practiceLog as any).ear_training?.length || 0));
      const loadedEarTrainingCompleted = [...((practiceLog as any).ear_training_completed || [])];
      while (loadedEarTrainingCompleted.length < 10) loadedEarTrainingCompleted.push(false);
      setEarTrainingCompleted(loadedEarTrainingCompleted.slice(0, 10));

      // Load Music Listening
      const loadedMusicListening = [...(practiceLog.music_listening || [])];
      while (loadedMusicListening.length < 10) loadedMusicListening.push("");
      setMusicListening(loadedMusicListening.slice(0, 10));
      setMusicListeningCount(Math.max(4, practiceLog.music_listening?.length || 0));
      const loadedMusicListeningCompleted = [...(practiceLog.music_listening_completed || [])];
      while (loadedMusicListeningCompleted.length < 10) loadedMusicListeningCompleted.push(false);
      setMusicListeningCompleted(loadedMusicListeningCompleted.slice(0, 10));
      setHasUnsavedChanges(false);
      isInitializedRef.current = true;

      // Adjust textarea heights after data loads
      setTimeout(() => {
        adjustTextareaHeight(mainGoalsRef.current);
        adjustTextareaHeight(subgoalsRef.current);
        adjustTextareaHeight(notesRef.current);
      }, 0);
    } else if (!isLoading && !assignmentLoading) {
      // Reset form for new day — pre-fill from weekly assignment if available
      const pad = (arr: string[] | null | undefined, size: number) => {
        const a = [...(arr || [])];
        while (a.length < size) a.push("");
        return a;
      };
      setMainGoals(assignment?.goals || "");
      setSubgoals(assignment?.subgoals || "");
      setStartTime("");
      setStopTime("");

      const assignWarmups = pad(assignment?.warmups, 10);
      setWarmups(assignWarmups);
      setWarmupCount(Math.max(4, assignment?.warmups?.length || 0));

      const assignScales = pad(assignment?.scales, 10);
      setScales(assignScales);
      setScaleCount(Math.max(4, assignment?.scales?.length || 0));

      const assignRepertoire = pad(assignment?.repertoire, 15);
      setRepertoire(assignRepertoire);
      setRepertoireCompleted(Array(15).fill(false));
      setRepertoireRecordings(Array(15).fill(""));
      setRepertoireCount(Math.max(10, assignment?.repertoire?.length || 0));

      setNotes("");
      setMetronomeUsed(false);

      const assignAdditional = pad(assignment?.additional_tasks, 10);
      setAdditionalTasks(assignAdditional);
      setAdditionalTasksCompleted(Array(10).fill(false));
      setAdditionalTaskCount(Math.max(4, assignment?.additional_tasks?.length || 0));

      const assignEar = pad(assignment?.ear_training, 10);
      setEarTraining(assignEar);
      setEarTrainingCompleted(Array(10).fill(false));
      setEarTrainingCount(Math.max(4, assignment?.ear_training?.length || 0));

      setMusicListening(Array(10).fill(""));
      setMusicListeningCompleted(Array(10).fill(false));
      setMusicListeningCount(4);
      setHasUnsavedChanges(false);
      isInitializedRef.current = true;
    }
  }, [practiceLog, isLoading, date, assignment, assignmentLoading]);
  
  const computedTotalTime = useMemo(() => {
    const start = parseTimeString(startTime);
    const stop = parseTimeString(stopTime);
    if (!start || !stop) return "";
    let totalMinutes = stop.hours * 60 + stop.minutes - (start.hours * 60 + start.minutes);
    if (totalMinutes < 0) {
      totalMinutes += 24 * 60; // Handle overnight sessions
    }
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}:${minutes.toString().padStart(2, "0")}`;
  }, [startTime, stopTime]);
  const totalTime = totalTimeOverride || computedTotalTime;
  const handleSave = useCallback(() => {
    save({
      goals: mainGoals,
      subgoals,
      start_time: formatTimeForDb(startTime),
      stop_time: formatTimeForDb(stopTime),
      total_time: totalTime || null,
      warmups,
      scales,
      repertoire,
      repertoire_completed: repertoireCompleted,
      repertoire_recordings: repertoireRecordings,
      technique: "",
      musicianship: "",
      notes,
      metronome_used: metronomeUsed,
      additional_tasks: additionalTasks,
      additional_tasks_completed: additionalTasksCompleted,
      ear_training: earTraining,
      ear_training_completed: earTrainingCompleted,
      music_listening: musicListening,
      music_listening_completed: musicListeningCompleted
    });
    setHasUnsavedChanges(false);
  }, [mainGoals, subgoals, startTime, stopTime, totalTime, warmups, scales, repertoire, repertoireCompleted, repertoireRecordings, notes, metronomeUsed, additionalTasks, additionalTasksCompleted, earTraining, earTrainingCompleted, musicListening, musicListeningCompleted, save]);

  // Auto-save with debounce
  const debouncedSave = useDebouncedCallback(handleSave, 2000);
  const markChanged = useCallback(() => {
    if (user) {
      setHasUnsavedChanges(true);
      debouncedSave();
    }
  }, [user, debouncedSave]);
  const dayName = date.toLocaleDateString("en-US", {
    weekday: "long"
  }).toUpperCase();
  const formattedDate = date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric"
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
  const updateRepertoireCompleted = (index: number, checked: boolean) => {
    const newCompleted = [...repertoireCompleted];
    newCompleted[index] = checked;
    setRepertoireCompleted(newCompleted);
    markChanged();
  };
  const handleRecordingComplete = (index: number, path: string) => {
    const newRecordings = [...repertoireRecordings];
    newRecordings[index] = path;
    setRepertoireRecordings(newRecordings);
    markChanged();
  };
  const handleRecordingDeleted = (index: number) => {
    const newRecordings = [...repertoireRecordings];
    newRecordings[index] = "";
    setRepertoireRecordings(newRecordings);
    markChanged();
  };
  const addWarmup = () => {
    if (warmupCount < 10) {
      setWarmupCount((prev) => prev + 1);
    }
  };
  const addScale = () => {
    if (scaleCount < 10) {
      setScaleCount((prev) => prev + 1);
    }
  };
  const addRepertoire = () => {
    if (repertoireCount < 15) {
      setRepertoireCount((prev) => prev + 1);
    }
  };

  // Additional Tasks handlers
  const updateAdditionalTask = (index: number, value: string) => {
    const newTasks = [...additionalTasks];
    newTasks[index] = value;
    setAdditionalTasks(newTasks);
    markChanged();
  };
  const updateAdditionalTaskCompleted = (index: number, checked: boolean) => {
    const newCompleted = [...additionalTasksCompleted];
    newCompleted[index] = checked;
    setAdditionalTasksCompleted(newCompleted);
    markChanged();
  };
  const addAdditionalTask = () => {
    if (additionalTaskCount < 10) {
      setAdditionalTaskCount((prev) => prev + 1);
    }
  };

  // Ear Training handlers
  const updateEarTraining = (index: number, value: string) => {
    const newEarTraining = [...earTraining];
    newEarTraining[index] = value;
    setEarTraining(newEarTraining);
    markChanged();
  };
  const updateEarTrainingCompleted = (index: number, checked: boolean) => {
    const newCompleted = [...earTrainingCompleted];
    newCompleted[index] = checked;
    setEarTrainingCompleted(newCompleted);
    markChanged();
  };
  const addEarTraining = () => {
    if (earTrainingCount < 10) {
      setEarTrainingCount((prev) => prev + 1);
    }
  };

  // Music Listening handlers
  const updateMusicListening = (index: number, value: string) => {
    const newListening = [...musicListening];
    newListening[index] = value;
    setMusicListening(newListening);
    markChanged();
  };
  const updateMusicListeningCompleted = (index: number, checked: boolean) => {
    const newCompleted = [...musicListeningCompleted];
    newCompleted[index] = checked;
    setMusicListeningCompleted(newCompleted);
    markChanged();
  };
  const addMusicListening = () => {
    if (musicListeningCount < 10) {
      setMusicListeningCount((prev) => prev + 1);
    }
  };
  const loadAssignmentIntoForm = useCallback(() => {
    if (!assignment) return;
    const pad = (arr: string[] | null | undefined, size: number) => {
      const a = [...(arr || [])];
      while (a.length < size) a.push("");
      return a;
    };
    if (assignment.goals) setMainGoals(assignment.goals);
    if (assignment.subgoals) setSubgoals(assignment.subgoals);

    const aw = assignment.warmups?.filter(w => w.trim()) || [];
    if (aw.length > 0) {
      setWarmups(pad(assignment.warmups, 10));
      setWarmupCount(Math.max(4, aw.length));
    }
    const asc = assignment.scales?.filter(s => s.trim()) || [];
    if (asc.length > 0) {
      setScales(pad(assignment.scales, 10));
      setScaleCount(Math.max(4, asc.length));
    }
    const ar = assignment.repertoire?.filter(r => r.trim()) || [];
    if (ar.length > 0) {
      setRepertoire(pad(assignment.repertoire, 15));
      setRepertoireCount(Math.max(10, ar.length));
    }
    const at = assignment.additional_tasks?.filter(t => t.trim()) || [];
    if (at.length > 0) {
      setAdditionalTasks(pad(assignment.additional_tasks, 10));
      setAdditionalTaskCount(Math.max(4, at.length));
    }
    const ae = assignment.ear_training?.filter(e => e.trim()) || [];
    if (ae.length > 0) {
      setEarTraining(pad(assignment.ear_training, 10));
      setEarTrainingCount(Math.max(4, ae.length));
    }
    markChanged();
  }, [assignment, markChanged]);

  if (!user) {
    return <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">Please sign in to view your practice log.</p>
      </div>;
  }
  if (isLoading) {
    return <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>;
  }
  return <div className="flex-1 space-y-4 overflow-auto">
      {/* Assignment Banner (if student has a weekly assignment) */}
      <AssignmentBanner date={date} onLoadAssignment={loadAssignmentIntoForm} />

      {/* Teacher Comment (if exists) */}
      <TeacherCommentCard logDate={dateString} />

      {/* Date Header with Share and Save Buttons */}
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl md:text-2xl text-foreground">
          {dayName} – {formattedDate}
        </h2>
        <div className="flex items-center gap-2">
          <CopyFromButton
            targetDate={date}
            userId={user.id}
            hasExistingContent={!!practiceLog}
          />
          <ShareButton practiceLogId={practiceLog?.id} disabled={!practiceLog} />
          <Button onClick={handleSave} disabled={isSaving || !hasUnsavedChanges} size="sm" variant={hasUnsavedChanges ? "default" : "outline"}>
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {isSaving ? "Saving..." : hasUnsavedChanges ? "Save" : "Saved"}
          </Button>
        </div>
      </div>

      {/* Goals Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card rounded-lg p-3 shadow-sm border border-border">
          <label className="font-display text-sm text-muted-foreground mb-2 block">Main Goals</label>
          <Textarea ref={mainGoalsRef} value={mainGoals} onChange={(e) => {
          setMainGoals(e.target.value);
          markChanged();
          adjustTextareaHeight(e.target);
        }} className="min-h-[80px] bg-transparent border-none resize-none focus-visible:ring-0 p-0" placeholder="What do you want to accomplish today?" />
        </div>
        <div className="bg-card rounded-lg p-3 shadow-sm border border-border">
          <label className="font-display text-sm text-muted-foreground mb-2 block">Subgoals</label>
          <Textarea ref={subgoalsRef} value={subgoals} onChange={(e) => {
          setSubgoals(e.target.value);
          markChanged();
          adjustTextareaHeight(e.target);
        }} className="min-h-[80px] bg-transparent border-none resize-none focus-visible:ring-0 p-0" placeholder="Break down your goals..." />
        </div>
      </div>

      {/* Practice Session Timer */}
      <PracticeSessionTimer
        existingStartTime={startTime}
        existingStopTime={stopTime}
        existingTotalTime={totalTime}
        onSessionComplete={(start, stop, duration) => {
          setStartTime(start);
          setStopTime(stop);
          setTotalTimeOverride(duration);
          markChanged();
        }}
      />

      {/* Warmups and Scales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card rounded-lg p-3 shadow-sm border border-border">
          <label className="font-display text-sm text-muted-foreground mb-2 block">Warm-ups</label>
          <div className="space-y-2">
            {warmups.slice(0, warmupCount).map((warmup, index) => <div key={index} className="flex items-center gap-2">
                <span className="text-muted-foreground text-sm w-4">{index + 1}</span>
                <Input value={warmup} onChange={(e) => updateWarmup(index, e.target.value)} className="bg-transparent border-b border-border rounded-none px-1 flex-1" />
              </div>)}
          </div>
          {warmupCount < 10 && <Button type="button" variant="ghost" size="sm" onClick={addWarmup} className="mt-2 text-muted-foreground hover:text-foreground">
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>}
        </div>
        <div className="bg-card rounded-lg p-3 shadow-sm border border-border">
          <label className="font-display text-sm text-muted-foreground mb-2 block">Scales</label>
          <div className="space-y-2">
            {scales.slice(0, scaleCount).map((scale, index) => <div key={index} className="flex items-center gap-2">
                <span className="text-muted-foreground text-sm w-4">{index + 1}</span>
                <Input value={scale} onChange={(e) => updateScale(index, e.target.value)} className="bg-transparent border-b border-border rounded-none px-1 flex-1" />
              </div>)}
          </div>
          {scaleCount < 10 && <Button type="button" variant="ghost" size="sm" onClick={addScale} className="mt-2 text-muted-foreground hover:text-foreground">
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>}
        </div>
      </div>

      {/* Repertoire and Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card rounded-lg p-3 shadow-sm border border-border">
          <label className="font-display text-sm text-muted-foreground mb-2 block">Repertoire & Exercises</label>
          <div className="space-y-1">
            {repertoire.slice(0, repertoireCount).map((item, index) => <div key={index} className="flex items-center gap-2">
                <Checkbox checked={repertoireCompleted[index] || false} onCheckedChange={(checked) => updateRepertoireCompleted(index, !!checked)} className="rounded-full w-4 h-4 border-muted-foreground/30" />
                <Input value={item} onChange={(e) => updateRepertoire(index, e.target.value)} className="bg-transparent border-b border-border rounded-none px-1 flex-1 h-7" />
                <AudioRecorder practiceLogId={practiceLog?.id} userId={user.id} index={index} existingRecordingPath={repertoireRecordings[index] || null} onRecordingComplete={(path) => handleRecordingComplete(index, path)} onRecordingDeleted={() => handleRecordingDeleted(index)} />
              </div>)}
          </div>
           {repertoireCount < 15 && <Button type="button" variant="ghost" size="sm" onClick={addRepertoire} className="mt-2 text-muted-foreground hover:text-foreground bg-[hsl(var(--time-section-bg))]">
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>}

          {/* Media Tools - always show when user is logged in */}
          {user && <MediaTools practiceLogId={practiceLog?.id} userId={user.id} logDate={dateString} onPracticeLogCreated={() => queryClient.invalidateQueries({ queryKey: ["practice-log", dateString] })} />}

          {/* Assignment Media from Teacher (read-only) */}
          <AssignmentMediaDisplay date={date} />
        </div>

        <div className="space-y-4">
          <div className="bg-card rounded-lg p-3 shadow-sm border border-border">
            <label className="font-display text-sm text-muted-foreground mb-2 block">Notes & Focus</label>
            <Textarea ref={notesRef} value={notes} onChange={(e) => {
            setNotes(e.target.value);
            markChanged();
            adjustTextareaHeight(e.target);
          }} className="min-h-[80px] bg-transparent border-none resize-none focus-visible:ring-0 p-0" placeholder="Observations, breakthroughs, challenges..." />
          </div>

          {/* Music AI Assistant */}
          <MusicAI journalContext={{
          goals: mainGoals,
          repertoire: repertoire.filter((r) => r.trim()),
          notes
        }} />

          {/* Lesson PDFs */}
          {user && <LessonPdfs practiceLogId={practiceLog?.id} userId={user.id} logDate={dateString} onPracticeLogCreated={() => queryClient.invalidateQueries({ queryKey: ["practice-log", dateString] })} />}

          <div className="bg-card rounded-lg p-3 shadow-sm border border-border">
            <div className="flex items-center gap-3">
              <Checkbox id="metronome" checked={metronomeUsed} onCheckedChange={(checked) => {
              setMetronomeUsed(!!checked);
              markChanged();
            }} />
              <label htmlFor="metronome" className="font-display text-sm text-foreground cursor-pointer">
                Used Metronome Today
              </label>
            </div>
            <Metronome onStart={() => {
            if (!metronomeUsed) {
              setMetronomeUsed(true);
              markChanged();
            }
          }} />
           </div>

           {/* Tuner */}
           <div className="bg-card rounded-lg p-3 shadow-sm border border-border">
             <label className="font-display text-sm text-muted-foreground mb-1 block">Tuner</label>
             <Tuner />
           </div>

           {/* Drone */}
           <div className="bg-[hsl(var(--time-section-bg))] rounded-lg p-3 shadow-sm border border-border">
              <label className="font-display text-sm text-muted-foreground mb-1 block">Drone Player</label>
             <DronePlayer />
           </div>

          {/* Timer */}
          <div className="bg-card rounded-lg p-3 shadow-sm border border-border">
            <label className="font-display text-sm text-muted-foreground mb-1 block">Timer</label>
            <Timer />
          </div>

          <div className="bg-card rounded-lg p-3 shadow-sm border border-border">
            <label className="font-display text-sm text-muted-foreground mb-2 block">Ear Training</label>
            <div className="space-y-1">
              {earTraining.slice(0, earTrainingCount).map((item, index) => <div key={index} className="flex items-center gap-2">
                  <Checkbox checked={earTrainingCompleted[index] || false} onCheckedChange={(checked) => updateEarTrainingCompleted(index, !!checked)} className="rounded-full w-4 h-4 border-muted-foreground/30" />
                  <Input value={item} onChange={(e) => updateEarTraining(index, e.target.value)} className="bg-transparent border-b border-border rounded-none px-1 flex-1 h-7" />
                </div>)}
            </div>
            {earTrainingCount < 10 && <Button type="button" variant="ghost" size="sm" onClick={addEarTraining} className="mt-2 text-muted-foreground hover:text-foreground">
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>}
          </div>

          {/* Additional Tasks */}
          <div className="bg-card rounded-lg p-3 shadow-sm border border-border">
            <label className="font-display text-sm text-muted-foreground mb-2 block">Additional Task</label>
            <div className="space-y-1">
              {additionalTasks.slice(0, additionalTaskCount).map((task, index) => <div key={index} className="flex items-center gap-2">
                  <Checkbox checked={additionalTasksCompleted[index] || false} onCheckedChange={(checked) => updateAdditionalTaskCompleted(index, !!checked)} className="rounded-full w-4 h-4 border-muted-foreground/30" />
                  <Input value={task} onChange={(e) => updateAdditionalTask(index, e.target.value)} className="bg-transparent border-b border-border rounded-none px-1 flex-1 h-7" />
                </div>)}
            </div>
            {additionalTaskCount < 10 && <Button type="button" variant="ghost" size="sm" onClick={addAdditionalTask} className="mt-2 text-muted-foreground hover:text-foreground">
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>}
          </div>

          {/* Music Listening */}
          <div className="bg-card rounded-lg p-3 shadow-sm border border-border">
            <label className="font-display text-sm text-muted-foreground mb-2 block">Music Listening</label>
            <div className="space-y-1">
              {musicListening.slice(0, musicListeningCount).map((item, index) => <div key={index} className="flex items-center gap-2">
                  <Checkbox checked={musicListeningCompleted[index] || false} onCheckedChange={(checked) => updateMusicListeningCompleted(index, !!checked)} className="rounded-full w-4 h-4 border-muted-foreground/30" />
                  <Input value={item} onChange={(e) => updateMusicListening(index, e.target.value)} className="bg-transparent border-b border-border rounded-none px-1 flex-1 h-7" />
                </div>)}
            </div>
            {musicListeningCount < 10 && <Button type="button" variant="ghost" size="sm" onClick={addMusicListening} className="mt-2 text-muted-foreground hover:text-foreground">
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>}
          </div>
        </div>
      </div>
    </div>;
}