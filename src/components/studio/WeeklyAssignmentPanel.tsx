import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useTeacherAssignment } from "@/hooks/useWeeklyAssignment";
import { useAssignmentMedia, type AssignmentMediaItem } from "@/hooks/useAssignmentMedia";
import { useAuth } from "@/contexts/AuthContext";
import { startOfWeek, format, addWeeks } from "date-fns";
import { Save, Trash2, Loader2, ClipboardList, ChevronLeft, ChevronRight, Plus, Youtube, Upload, X, Music, Video, ImageIcon, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { extractYouTubeVideoId } from "@/hooks/useMediaTools";

interface Props {
  studioId: string | undefined;
  studentUserId: string;
  currentDate: Date;
}

function AssignmentMediaPlayer({
  filePath,
  type,
  getSignedUrl,
}: {
  filePath: string;
  type: "audio" | "video";
  getSignedUrl: (path: string) => Promise<string | null>;
}) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    getSignedUrl(filePath).then((u) => {
      if (!cancelled) setUrl(u);
    });
    return () => { cancelled = true; };
  }, [filePath, getSignedUrl]);

  if (!url) return <div className="h-7 flex items-center text-[10px] text-muted-foreground">Loading...</div>;
  if (type === "video") {
    return <video controls className="w-full rounded max-h-40" preload="metadata"><source src={url} /></video>;
  }
  return <audio controls className="w-full h-7" preload="metadata"><source src={url} /></audio>;
}

function AssignmentPhotoPreview({
  filePath,
  getSignedUrl,
}: {
  filePath: string;
  getSignedUrl: (path: string) => Promise<string | null>;
}) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    getSignedUrl(filePath).then((u) => {
      if (!cancelled) setUrl(u);
    });
    return () => { cancelled = true; };
  }, [filePath, getSignedUrl]);

  if (!url) return <div className="h-7 flex items-center text-[10px] text-muted-foreground">Loading...</div>;
  return <img src={url} alt="Assignment photo" className="w-full rounded object-contain max-h-40" />;
}

export function WeeklyAssignmentPanel({ studioId, studentUserId, currentDate }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [weekOffset, setWeekOffset] = useState(0);
  const monday = startOfWeek(addWeeks(currentDate, weekOffset), { weekStartsOn: 1 });
  const weekStart = format(monday, "yyyy-MM-dd");
  const weekLabel = `Week of ${format(monday, "MMM d, yyyy")}`;

  const { assignment, isLoading, save, isSaving, send, isSending, remove, isDeleting, ensureAssignment } =
    useTeacherAssignment(studioId, studentUserId, weekStart);

  // Assignment media (file uploads)
  const {
    mediaItems: assignmentMediaItems,
    isLoading: mediaLoading,
    isUploading,
    uploadFile,
    deleteMedia,
    getSignedUrl,
    itemCount: mediaCount,
    maxItems: mediaMax,
  } = useAssignmentMedia(assignment?.id, studioId, user?.id || "", ensureAssignment);

  const [goals, setGoals] = useState("");
  const [subgoals, setSubgoals] = useState("");
  const [repertoire, setRepertoire] = useState<string[]>(["", "", "", ""]);
  const [warmups, setWarmups] = useState<string[]>(["", "", "", ""]);
  const [scales, setScales] = useState<string[]>(["", "", "", ""]);
  const [additionalTasks, setAdditionalTasks] = useState<string[]>(["", "", "", ""]);
  const [earTraining, setEarTraining] = useState<string[]>(["", "", "", ""]);
  const [youtubeLinks, setYoutubeLinks] = useState<string[]>([""]);
  const [notes, setNotes] = useState("");

  // File upload state
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setYoutubeLinks(pad((assignment as any).youtube_links, 1));
      setNotes(assignment.notes || "");
    } else if (!isLoading) {
      setGoals(""); setSubgoals(""); setNotes("");
      setRepertoire(["", "", "", ""]);
      setWarmups(["", "", "", ""]);
      setScales(["", "", "", ""]);
      setAdditionalTasks(["", "", "", ""]);
      setEarTraining(["", "", "", ""]);
      setYoutubeLinks([""]);
    }
  }, [assignment, isLoading, weekStart]);

  const getPayload = () => ({
    goals, subgoals, repertoire, warmups, scales,
    additional_tasks: additionalTasks, ear_training: earTraining,
    youtube_links: youtubeLinks, notes,
  });

  const handleSave = () => {
    save(getPayload(), {
      onSuccess: () => toast({ title: "Draft saved" }),
      onError: (err: any) => toast({ title: "Error saving assignment", description: err.message, variant: "destructive" }),
    });
  };

  const handleSend = () => {
    send(getPayload(), {
      onSuccess: () => toast({ title: "Assignment sent!" }),
      onError: (err: any) => toast({ title: "Error sending assignment", description: err.message, variant: "destructive" }),
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

  // File upload handlers
  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) uploadFile(files[0]);
  }, [uploadFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) uploadFile(files[0]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [uploadFile]);

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

  const mediaTypeIcon = (type: string) => {
    if (type === "audio") return <Music className="w-3 h-3 flex-shrink-0" />;
    if (type === "video") return <Video className="w-3 h-3 flex-shrink-0" />;
    return <ImageIcon className="w-3 h-3 flex-shrink-0" />;
  };

  if (isLoading) return null;

  return (
    <div className="bg-card rounded-lg p-4 shadow-sm border border-border space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-display text-muted-foreground">
          <ClipboardList className="h-4 w-4" />
          Weekly Assignment
          {assignment && (
            <span className={`ml-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
              (assignment as any).status === "sent"
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                : "bg-muted text-muted-foreground"
            }`}>
              {(assignment as any).status === "sent" ? "Sent ✓" : "Draft"}
            </span>
          )}
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

        <div className="bg-[hsl(var(--time-section-bg))] rounded-lg p-4 shadow-sm border border-border">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              {renderList("Repertoire", repertoire, setRepertoire)}
              {renderList("Scales", scales, setScales)}
              {renderList("Additional Tasks", additionalTasks, setAdditionalTasks)}
            </div>
            <div className="space-y-3">
              {renderList("Warm-ups", warmups, setWarmups)}
              {renderList("Ear Training", earTraining, setEarTraining)}
            </div>
          </div>
        </div>

        {/* YouTube Links */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Youtube className="w-3 h-3" /> YouTube Links
            </label>
            {youtubeLinks.length < 5 && (
              <Button type="button" variant="ghost" size="sm" className="h-6 px-1" onClick={() => addRow(setYoutubeLinks, 5)}>
                <Plus className="w-3 h-3" />
              </Button>
            )}
          </div>
          {youtubeLinks.map((link, idx) => {
            const videoId = link.trim() ? extractYouTubeVideoId(link.trim()) : null;
            return (
              <div key={idx} className="flex items-center gap-2">
                <Input
                  value={link}
                  onChange={(e) => updateArr(setYoutubeLinks)(idx, e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  className="h-7 text-xs flex-1"
                />
                {link.trim() && (
                  <span className={`text-[10px] shrink-0 ${videoId ? "text-primary" : "text-destructive"}`}>
                    {videoId ? `ID: ${videoId}` : "Invalid URL"}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Media Uploads (Audio, Video, Photo) */}
        <div className="space-y-2 bg-[hsl(var(--time-section-bg))] rounded-lg p-3">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <Upload className="w-3 h-3" /> Media Files
            <span className="text-[10px] text-muted-foreground ml-1">({mediaCount}/{mediaMax})</span>
          </label>

          {/* Drop zone */}
          {mediaCount < mediaMax && (
            <div
              className={`border-2 border-dashed rounded-md p-2.5 text-center cursor-pointer transition-colors ${
                isDragOver ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/50"
              }`}
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploading ? (
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Uploading...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Upload className="w-3.5 h-3.5" />
                  Drop audio, video, or photo — or click to browse
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".mp3,.wav,.m4a,.ogg,.webm,.mp4,.mov,.jpg,.jpeg,.png,.webp,.gif,audio/*,video/*,image/*"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
          )}

          {/* Uploaded media items */}
          {assignmentMediaItems.length > 0 && (
            <div className="space-y-1.5">
              {assignmentMediaItems.map((item) => (
                <div key={item.id} className="border border-border rounded-md p-2 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground truncate flex-1 min-w-0">
                      {mediaTypeIcon(item.media_type)}
                      <span className="truncate">{item.label || item.media_type}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMedia(item)}
                      className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive flex-shrink-0"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                  {(item.media_type === "audio" || item.media_type === "video") && item.file_path && (
                    <AssignmentMediaPlayer filePath={item.file_path} type={item.media_type} getSignedUrl={getSignedUrl} />
                  )}
                  {item.media_type === "photo" && item.file_path && (
                    <AssignmentPhotoPreview filePath={item.file_path} getSignedUrl={getSignedUrl} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground">Notes</label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes for the student..." className="min-h-[40px] text-xs" />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" onClick={handleSave} disabled={isSaving}>
          {isSaving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
          Save Draft
        </Button>
        <Button size="sm" onClick={handleSend} disabled={isSending}>
          {isSending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Send className="w-4 h-4 mr-1" />}
          Send
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
