import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format, addDays, subDays } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useStudioData } from "@/hooks/useStudioData";
import { useStudentLogView } from "@/hooks/useStudentLogView";
import { useTeacherComment } from "@/hooks/useTeacherComment";
import { DateNavigator } from "@/components/practice-log/DateNavigator";
import { TeacherCommentPanel } from "@/components/studio/TeacherCommentPanel";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, Loader2, Music, Youtube, Video, ImageIcon, FileText } from "lucide-react";
import { extractYouTubeVideoId } from "@/hooks/useMediaTools";
import { WeeklyAssignmentPanel } from "@/components/studio/WeeklyAssignmentPanel";
import { TeacherPdfUpload } from "@/components/studio/TeacherPdfUpload";

export default function StudentLogView() {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { studio, students } = useStudioData();
  const [currentDate, setCurrentDate] = useState(new Date());
  const dateString = format(currentDate, "yyyy-MM-dd");

  const student = students.find((s) => s.student_user_id === studentId);
  const { practiceLog, mediaItems, pdfItems, isLoading } = useStudentLogView(studentId || "", dateString);

  // Signed URLs state
  const [mediaUrls, setMediaUrls] = useState<Record<string, string>>({});
  const [recordingUrls, setRecordingUrls] = useState<Record<number, string>>({});
  const [pdfViewerUrl, setPdfViewerUrl] = useState<string | null>(null);
  const [pdfViewerName, setPdfViewerName] = useState("");

  // Generate signed URLs for media
  useEffect(() => {
    async function fetchUrls() {
      const fileItems = mediaItems.filter((m) => (m.media_type === "audio" || m.media_type === "video" || m.media_type === "photo") && m.file_path);
      if (fileItems.length > 0) {
        const urlMap: Record<string, string> = {};
        await Promise.all(
          fileItems.map(async (item) => {
            const { data } = await supabase.storage.from("practice-media").createSignedUrl(item.file_path!, 3600);
            if (data?.signedUrl) urlMap[item.id] = data.signedUrl;
          })
        );
        setMediaUrls(urlMap);
      } else {
        setMediaUrls({});
      }
    }
    fetchUrls();
  }, [mediaItems]);

  // Generate signed URLs for repertoire recordings
  useEffect(() => {
    async function fetchRecordingUrls() {
      const recordings = practiceLog?.repertoire_recordings || [];
      if (recordings.length === 0) { setRecordingUrls({}); return; }
      const urlMap: Record<number, string> = {};
      await Promise.all(
        recordings.map(async (path: string, idx: number) => {
          if (!path?.trim()) return;
          const { data } = await supabase.storage.from("practice-recordings").createSignedUrl(path, 3600);
          if (data?.signedUrl) urlMap[idx] = data.signedUrl;
        })
      );
      setRecordingUrls(urlMap);
    }
    fetchRecordingUrls();
  }, [practiceLog?.repertoire_recordings]);

  const handleOpenPdf = useCallback(async (item: { file_path: string; file_name: string }) => {
    const { data } = await supabase.storage.from("lesson-pdfs").createSignedUrl(item.file_path, 3600);
    if (data?.signedUrl) {
      setPdfViewerUrl(data.signedUrl);
      setPdfViewerName(item.file_name);
    }
  }, []);

  const formatTime = (time: string | null) => {
    if (!time) return "—";
    const [h, m] = time.split(":").map(Number);
    const period = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 || 12;
    return `${hour12}:${m.toString().padStart(2, "0")} ${period}`;
  };

  const calculateTotalTime = (start: string | null, stop: string | null) => {
    if (!start || !stop) return null;
    const [startHour, startMin] = start.split(":").map(Number);
    const [stopHour, stopMin] = stop.split(":").map(Number);
    let totalMinutes = (stopHour * 60 + stopMin) - (startHour * 60 + startMin);
    if (totalMinutes < 0) totalMinutes += 24 * 60;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}:${minutes.toString().padStart(2, "0")}`;
  };

  const dayName = currentDate.toLocaleDateString("en-US", { weekday: "long" }).toUpperCase();
  const formattedDate = currentDate.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }).toUpperCase().replace(",", "");

  // Verify access
  if (!user || !studentId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Access denied</p>
      </div>
    );
  }

  const totalTime = practiceLog ? calculateTotalTime(practiceLog.start_time, practiceLog.stop_time) : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate("/studio")}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Studio
          </Button>
          <DateNavigator
            currentDate={currentDate}
            onPrevDay={() => setCurrentDate((d) => subDays(d, 1))}
            onNextDay={() => setCurrentDate((d) => addDays(d, 1))}
            onToday={() => setCurrentDate(new Date())}
          />
        </div>

        <div className="text-center space-y-1">
          <h1 className="text-xl font-display text-foreground">
            {student?.display_name || "Student"}'s Practice Log
          </h1>
          <p className="text-lg font-display text-foreground">
            {dayName} – {formattedDate}
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !practiceLog ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No practice log for this date.</p>
          </div>
        ) : (
          <>
            {/* Goals */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-card rounded-lg p-4 shadow-sm border border-border">
                <h3 className="font-display text-sm text-muted-foreground mb-2">Main Goals</h3>
                <p className="text-foreground whitespace-pre-wrap">
                  {practiceLog.goals || <span className="text-muted-foreground italic">No goals set</span>}
                </p>
              </div>
              <div className="bg-card rounded-lg p-4 shadow-sm border border-border">
                <h3 className="font-display text-sm text-muted-foreground mb-2">Subgoals</h3>
                <p className="text-foreground whitespace-pre-wrap">
                  {practiceLog.subgoals || <span className="text-muted-foreground italic">No subgoals set</span>}
                </p>
              </div>
            </div>

            {/* Time Tracking */}
            <div className="bg-card rounded-lg p-4 shadow-sm border border-border">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <h3 className="font-display text-sm text-muted-foreground mb-1">Start Time</h3>
                  <p className="text-foreground">{formatTime(practiceLog.start_time)}</p>
                </div>
                <div>
                  <h3 className="font-display text-sm text-muted-foreground mb-1">Stop Time</h3>
                  <p className="text-foreground">{formatTime(practiceLog.stop_time)}</p>
                </div>
                <div>
                  <h3 className="font-display text-sm text-muted-foreground mb-1">Total Time</h3>
                  <p className="text-foreground font-medium">{totalTime || "0:00"}</p>
                </div>
              </div>
            </div>

            {/* Warmups and Scales */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-card rounded-lg p-4 shadow-sm border border-border">
                <h3 className="font-display text-sm text-muted-foreground mb-3">Warm-ups</h3>
                <ul className="space-y-1">
                  {practiceLog.warmups?.filter((w) => w).map((warmup, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-foreground">
                      <span className="text-muted-foreground text-sm w-4">{idx + 1}</span>
                      {warmup}
                    </li>
                  ))}
                  {(!practiceLog.warmups || practiceLog.warmups.filter((w) => w).length === 0) && (
                    <li className="text-muted-foreground italic">No warm-ups recorded</li>
                  )}
                </ul>
              </div>
              <div className="bg-card rounded-lg p-4 shadow-sm border border-border">
                <h3 className="font-display text-sm text-muted-foreground mb-3">Scales</h3>
                <ul className="space-y-1">
                  {practiceLog.scales?.filter((s) => s).map((scale, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-foreground">
                      <span className="text-muted-foreground text-sm w-4">{idx + 1}</span>
                      {scale}
                    </li>
                  ))}
                  {(!practiceLog.scales || practiceLog.scales.filter((s) => s).length === 0) && (
                    <li className="text-muted-foreground italic">No scales recorded</li>
                  )}
                </ul>
              </div>
            </div>

            {/* Repertoire and Notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-card rounded-lg p-4 shadow-sm border border-border">
                <h3 className="font-display text-sm text-muted-foreground mb-3">Repertoire & Exercises</h3>
                <ul className="space-y-1">
                  {practiceLog.repertoire?.filter((r) => r).map((item, idx) => (
                    <li key={idx} className="space-y-1">
                      <div className="flex items-center gap-2 text-foreground">
                        <div className={`w-3 h-3 rounded-full border ${practiceLog.repertoire_completed?.[idx] ? "bg-primary border-primary" : "border-muted-foreground/30"}`} />
                        {item}
                      </div>
                      {recordingUrls[idx] && (
                        <audio controls className="w-full h-8 ml-5" src={recordingUrls[idx]} />
                      )}
                    </li>
                  ))}
                  {(!practiceLog.repertoire || practiceLog.repertoire.filter((r) => r).length === 0) && (
                    <li className="text-muted-foreground italic">No repertoire recorded</li>
                  )}
                </ul>
              </div>
              <div className="space-y-4">
                <div className="bg-card rounded-lg p-4 shadow-sm border border-border">
                  <h3 className="font-display text-sm text-muted-foreground mb-2">Notes & Focus</h3>
                  <p className="text-foreground whitespace-pre-wrap">
                    {practiceLog.notes || <span className="text-muted-foreground italic">No notes recorded</span>}
                  </p>
                </div>
                <div className="bg-card rounded-lg p-4 shadow-sm border border-border">
                  <p className="text-sm text-foreground">
                    {practiceLog.metronome_used ? "✓" : "○"} Used Metronome Today
                  </p>
                </div>
                {/* Ear Training */}
                <div className="bg-card rounded-lg p-4 shadow-sm border border-border">
                  <h3 className="font-display text-sm text-muted-foreground mb-3">Ear Training</h3>
                  {practiceLog.ear_training && practiceLog.ear_training.filter((e) => e).length > 0 ? (
                    <ul className="space-y-1">
                      {practiceLog.ear_training.filter((e) => e).map((item, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-foreground">
                          <div className={`w-3 h-3 rounded-full border ${practiceLog.ear_training_completed?.[idx] ? "bg-primary border-primary" : "border-muted-foreground/30"}`} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground italic text-sm">No ear training recorded</p>
                  )}
                </div>
                {/* Music Listening */}
                <div className="bg-card rounded-lg p-4 shadow-sm border border-border">
                  <h3 className="font-display text-sm text-muted-foreground mb-3">Music Listening</h3>
                  {practiceLog.music_listening && practiceLog.music_listening.filter((m) => m).length > 0 ? (
                    <ul className="space-y-1">
                      {practiceLog.music_listening.filter((m) => m).map((item, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-foreground">
                          <div className={`w-3 h-3 rounded-full border ${practiceLog.music_listening_completed?.[idx] ? "bg-primary border-primary" : "border-muted-foreground/30"}`} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground italic text-sm">No music listening recorded</p>
                  )}
                </div>
                {/* Additional Tasks */}
                <div className="bg-card rounded-lg p-4 shadow-sm border border-border">
                  <h3 className="font-display text-sm text-muted-foreground mb-3">Additional Tasks</h3>
                  {practiceLog.additional_tasks && practiceLog.additional_tasks.filter((t) => t).length > 0 ? (
                    <ul className="space-y-1">
                      {practiceLog.additional_tasks.filter((t) => t).map((task, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-foreground">
                          <div className={`w-3 h-3 rounded-full border ${practiceLog.additional_tasks_completed?.[idx] ? "bg-primary border-primary" : "border-muted-foreground/30"}`} />
                          {task}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground italic text-sm">No additional tasks recorded</p>
                  )}
                </div>
              </div>
            </div>

            {/* Lesson PDFs */}
            {pdfItems.length > 0 && (
              <div className="bg-card rounded-lg p-4 shadow-sm border border-border">
                <h3 className="font-display text-sm text-muted-foreground mb-3">Lesson PDF's</h3>
                <div className="space-y-1">
                  {pdfItems.map((item) => (
                    <div key={item.id} className="flex items-center border border-border rounded-md px-2 py-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenPdf(item)}
                        className="flex items-center gap-1.5 text-xs text-foreground hover:text-primary truncate flex-1 min-w-0 text-left"
                      >
                        <FileText className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground" />
                        <span className="truncate">{item.file_name}</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Media */}
            {mediaItems.length > 0 && (
              <div className="bg-card rounded-lg p-4 shadow-sm border border-border">
                <h3 className="font-display text-sm text-muted-foreground mb-3">Media Tools</h3>
                <div className="space-y-3">
                  {mediaItems.map((item) => (
                    <div key={item.id} className="border border-border rounded-md p-2 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        {item.media_type === "audio" ? <Music className="w-3.5 h-3.5" /> :
                         item.media_type === "video" ? <Video className="w-3.5 h-3.5" /> :
                         item.media_type === "photo" ? <ImageIcon className="w-3.5 h-3.5" /> :
                         <Youtube className="w-3.5 h-3.5" />}
                        <span className="truncate">{item.label || item.media_type}</span>
                      </div>
                      {item.media_type === "youtube" && item.youtube_url && (() => {
                        const videoId = extractYouTubeVideoId(item.youtube_url);
                        return videoId ? (
                          <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                            <iframe
                              className="absolute inset-0 w-full h-full rounded"
                              src={`https://www.youtube-nocookie.com/embed/${videoId}`}
                              title="YouTube video"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          </div>
                        ) : null;
                      })()}
                      {item.media_type === "audio" && item.file_path && (
                        mediaUrls[item.id] ? <audio controls className="w-full h-8" src={mediaUrls[item.id]} /> : <p className="text-xs text-muted-foreground italic">Loading...</p>
                      )}
                      {item.media_type === "video" && item.file_path && (
                        mediaUrls[item.id] ? <video controls className="w-full rounded" src={mediaUrls[item.id]} /> : <p className="text-xs text-muted-foreground italic">Loading...</p>
                      )}
                      {item.media_type === "photo" && item.file_path && (
                        mediaUrls[item.id] ? <img src={mediaUrls[item.id]} alt={item.label || "Photo"} className="w-full rounded object-contain max-h-80" /> : <p className="text-xs text-muted-foreground italic">Loading...</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Teacher PDF Upload */}
        <TeacherPdfUpload
          studentUserId={studentId || ""}
          practiceLogId={practiceLog?.id || null}
          logDate={dateString}
          existingPdfCount={pdfItems.length}
        />

        {/* Teacher Comment Panel - always show */}
        <TeacherCommentPanel studioId={studio?.id} studentUserId={studentId || ""} logDate={dateString} />

        {/* Weekly Assignment Panel */}
        <WeeklyAssignmentPanel studioId={studio?.id} studentUserId={studentId || ""} currentDate={currentDate} />

        {/* PDF Viewer Dialog */}
        <Dialog open={!!pdfViewerUrl} onOpenChange={(open) => { if (!open) { setPdfViewerUrl(null); setPdfViewerName(""); } }}>
          <DialogContent className="max-w-[95vw] max-h-[95vh] w-[95vw] h-[90vh] flex flex-col p-0">
            <DialogHeader className="px-4 py-3 border-b border-border shrink-0">
              <DialogTitle className="text-sm font-medium truncate pr-8">{pdfViewerName}</DialogTitle>
            </DialogHeader>
            <div className="flex-1 min-h-0">
              {pdfViewerUrl && (
                <iframe
                  src={`https://docs.google.com/gview?url=${encodeURIComponent(pdfViewerUrl)}&embedded=true`}
                  className="w-full h-full border-0"
                  title={pdfViewerName}
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
