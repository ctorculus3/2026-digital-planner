import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Music, Youtube, FileText, Video, ImageIcon } from "lucide-react";
import { extractYouTubeVideoId } from "@/hooks/useMediaTools";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PracticeLogData {
  id: string;
  log_date: string;
  goals: string | null;
  subgoals: string | null;
  start_time: string | null;
  stop_time: string | null;
  warmups: string[] | null;
  scales: string[] | null;
  repertoire: string[] | null;
  repertoire_recordings: string[] | null;
  repertoire_completed: boolean[] | null;
  notes: string | null;
  metronome_used: boolean | null;
  ear_training: string[] | null;
  ear_training_completed: boolean[] | null;
  additional_tasks: string[] | null;
  additional_tasks_completed: boolean[] | null;
  music_listening: string[] | null;
  music_listening_completed: boolean[] | null;
  sharer_name: string | null;
}

interface SharedMediaItem {
  id: string;
  media_type: "audio" | "youtube" | "video" | "photo";
  file_path: string | null;
  youtube_url: string | null;
  label: string | null;
  sort_order: number;
}

interface SharedPdfItem {
  id: string;
  file_path: string;
  file_name: string;
  sort_order: number;
}

export default function SharedPracticeLog() {
  const { token } = useParams<{ token: string }>();
  const [practiceLog, setPracticeLog] = useState<PracticeLogData | null>(null);
  const [mediaItems, setMediaItems] = useState<SharedMediaItem[]>([]);
  const [pdfItems, setPdfItems] = useState<SharedPdfItem[]>([]);
  const [pdfViewerUrl, setPdfViewerUrl] = useState<string | null>(null);
  const [pdfViewerName, setPdfViewerName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mediaAudioUrls, setMediaAudioUrls] = useState<Record<string, string>>({});
  const [recordingUrls, setRecordingUrls] = useState<Record<number, string>>({});

  useEffect(() => {
    async function fetchSharedLog() {
      if (!token) {
        setError("Invalid share link");
        setIsLoading(false);
        return;
      }

      try {
        // Look up the shared practice log using the secure RPC
        // This avoids exposing the creator's user ID to the client
        const { data: lookupData, error: lookupError } = await supabase
          .rpc("lookup_shared_practice_log", { p_share_token: token });

        if (lookupError) throw lookupError;

        if (!lookupData || lookupData.length === 0) {
          setError("This share link is invalid or has expired.");
          setIsLoading(false);
          return;
        }

        const { practice_log_id, sharer_display_name } = lookupData[0];

        // Fetch the practice log
        const { data: logData, error: logError } = await supabase
          .from("practice_logs")
          .select("id, log_date, goals, subgoals, start_time, stop_time, warmups, scales, repertoire, repertoire_recordings, repertoire_completed, notes, metronome_used, ear_training, ear_training_completed, additional_tasks, additional_tasks_completed, music_listening, music_listening_completed")
          .eq("id", practice_log_id)
          .single();

        if (logError) throw logError;

        setPracticeLog({
          ...logData,
          sharer_name: sharer_display_name || null,
        });

        // Fetch media items for this shared log
        const { data: mediaData } = await supabase
          .from("practice_media")
          .select("id, media_type, file_path, youtube_url, label, sort_order")
          .eq("practice_log_id", practice_log_id)
          .order("sort_order", { ascending: true });

        const fetchedMediaItems = (mediaData as SharedMediaItem[]) || [];
        setMediaItems(fetchedMediaItems);

        // Generate signed URLs for media audio files
        const fileItems = fetchedMediaItems.filter(m => (m.media_type === "audio" || m.media_type === "video" || m.media_type === "photo") && m.file_path);
        if (fileItems.length > 0) {
          const audioUrlMap: Record<string, string> = {};
          await Promise.all(fileItems.map(async (item) => {
            const { data } = await supabase.storage
              .from("practice-media")
              .createSignedUrl(item.file_path!, 3600);
            if (data?.signedUrl) {
              audioUrlMap[item.id] = data.signedUrl;
            }
          }));
          setMediaAudioUrls(audioUrlMap);
        }

        // Generate signed URLs for repertoire recordings
        const recordings = logData.repertoire_recordings || [];
        if (recordings.length > 0) {
          const recUrlMap: Record<number, string> = {};
          await Promise.all(recordings.map(async (path: string, idx: number) => {
            if (!path || !path.trim()) return;
            const { data } = await supabase.storage
              .from("practice-recordings")
              .createSignedUrl(path, 3600);
            if (data?.signedUrl) {
              recUrlMap[idx] = data.signedUrl;
            }
          }));
          setRecordingUrls(recUrlMap);
        }

        // Fetch lesson PDFs for this shared log
        const { data: pdfData } = await supabase
          .from("lesson_pdfs")
          .select("id, file_path, file_name, sort_order")
          .eq("practice_log_id", practice_log_id)
          .order("sort_order", { ascending: true });

        setPdfItems((pdfData as SharedPdfItem[]) || []);
      } catch (err) {
        console.error("Error fetching shared log:", err);
        setError("Failed to load practice log.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchSharedLog();
  }, [token]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    const dayName = date.toLocaleDateString("en-US", { weekday: "long" }).toUpperCase();
    const formattedDate = date.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    }).toUpperCase().replace(",", "");
    return `${dayName} – ${formattedDate}`;
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

  const handleOpenPdf = useCallback(async (item: SharedPdfItem) => {
    const { data, error } = await supabase.storage
      .from("lesson-pdfs")
      .createSignedUrl(item.file_path, 3600);
    if (error || !data?.signedUrl) {
      console.error("Signed URL error:", error);
      return;
    }
    setPdfViewerUrl(data.signedUrl);
    setPdfViewerName(item.file_name);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-display text-foreground">Share Link Error</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!practiceLog) return null;

  const totalTime = calculateTotalTime(practiceLog.start_time, practiceLog.stop_time);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-xl md:text-2xl font-display text-foreground">
            Music Practice Daily Record Journal
          </h1>
          {practiceLog.sharer_name && (
            <p className="text-sm text-muted-foreground">
              Shared by {practiceLog.sharer_name}
            </p>
          )}
          <p className="text-lg md:text-xl font-display text-foreground mt-4">
            {formatDate(practiceLog.log_date)}
          </p>
        </div>

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
              <p className="text-foreground">{practiceLog.start_time || "—"}</p>
            </div>
            <div>
              <h3 className="font-display text-sm text-muted-foreground mb-1">Stop Time</h3>
              <p className="text-foreground">{practiceLog.stop_time || "—"}</p>
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
              {practiceLog.warmups?.filter(w => w).map((warmup, idx) => (
                <li key={idx} className="flex items-center gap-2 text-foreground">
                  <span className="text-muted-foreground text-sm w-4">{idx + 1}</span>
                  {warmup}
                </li>
              ))}
              {(!practiceLog.warmups || practiceLog.warmups.filter(w => w).length === 0) && (
                <li className="text-muted-foreground italic">No warm-ups recorded</li>
              )}
            </ul>
          </div>
          <div className="bg-card rounded-lg p-4 shadow-sm border border-border">
            <h3 className="font-display text-sm text-muted-foreground mb-3">Scales</h3>
            <ul className="space-y-1">
              {practiceLog.scales?.filter(s => s).map((scale, idx) => (
                <li key={idx} className="flex items-center gap-2 text-foreground">
                  <span className="text-muted-foreground text-sm w-4">{idx + 1}</span>
                  {scale}
                </li>
              ))}
              {(!practiceLog.scales || practiceLog.scales.filter(s => s).length === 0) && (
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
              {practiceLog.repertoire?.filter(r => r).map((item, idx) => (
                <li key={idx} className="space-y-1">
                  <div className="flex items-center gap-2 text-foreground">
                    <div className={`w-3 h-3 rounded-full border ${practiceLog.repertoire_completed?.[idx] ? 'bg-primary border-primary' : 'border-muted-foreground/30'}`} />
                    {item}
                  </div>
                  {recordingUrls[idx] && (
                    <audio controls className="w-full h-8 ml-5" src={recordingUrls[idx]} />
                  )}
                </li>
              ))}
              {(!practiceLog.repertoire || practiceLog.repertoire.filter(r => r).length === 0) && (
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
                {practiceLog.metronome_used ? '✓' : '○'} Used Metronome Today
              </p>
            </div>
            {/* Ear Training */}
            <div className="bg-card rounded-lg p-4 shadow-sm border border-border">
              <h3 className="font-display text-sm text-muted-foreground mb-3">Ear Training</h3>
              {practiceLog.ear_training && practiceLog.ear_training.filter(e => e).length > 0 ? (
                <ul className="space-y-1">
                  {practiceLog.ear_training.filter(e => e).map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-foreground">
                      <div className={`w-3 h-3 rounded-full border ${practiceLog.ear_training_completed?.[idx] ? 'bg-primary border-primary' : 'border-muted-foreground/30'}`} />
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
              {practiceLog.music_listening && practiceLog.music_listening.filter(m => m).length > 0 ? (
                <ul className="space-y-1">
                  {practiceLog.music_listening.filter(m => m).map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-foreground">
                      <div className={`w-3 h-3 rounded-full border ${practiceLog.music_listening_completed?.[idx] ? 'bg-primary border-primary' : 'border-muted-foreground/30'}`} />
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
              {practiceLog.additional_tasks && practiceLog.additional_tasks.filter(t => t).length > 0 ? (
                <ul className="space-y-1">
                  {practiceLog.additional_tasks.filter(t => t).map((task, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-foreground">
                      <div className={`w-3 h-3 rounded-full border ${practiceLog.additional_tasks_completed?.[idx] ? 'bg-primary border-primary' : 'border-muted-foreground/30'}`} />
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

        {/* Media Tools */}
        {mediaItems.length > 0 && (
          <div className="bg-card rounded-lg p-4 shadow-sm border border-border">
            <h3 className="font-display text-sm text-muted-foreground mb-3">Media Tools</h3>
            <div className="space-y-3">
              {mediaItems.map((item) => (
                <div key={item.id} className="border border-border rounded-md p-2 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    {item.media_type === "audio" ? (
                      <Music className="w-3.5 h-3.5" />
                    ) : item.media_type === "video" ? (
                      <Video className="w-3.5 h-3.5" />
                    ) : item.media_type === "photo" ? (
                      <ImageIcon className="w-3.5 h-3.5" />
                    ) : (
                      <Youtube className="w-3.5 h-3.5" />
                    )}
                    <span className="truncate">{item.label || (item.media_type === "audio" ? "Audio" : item.media_type === "video" ? "Video" : item.media_type === "photo" ? "Photo" : "YouTube")}</span>
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
                    mediaAudioUrls[item.id] ? (
                      <audio controls className="w-full h-8" src={mediaAudioUrls[item.id]} />
                    ) : (
                      <p className="text-xs text-muted-foreground italic">Loading audio...</p>
                    )
                  )}
                  {item.media_type === "video" && item.file_path && (
                    mediaAudioUrls[item.id] ? (
                      <video controls className="w-full rounded" src={mediaAudioUrls[item.id]} />
                    ) : (
                      <p className="text-xs text-muted-foreground italic">Loading video...</p>
                    )
                  )}
                  {item.media_type === "photo" && item.file_path && (
                    mediaAudioUrls[item.id] ? (
                      <img src={mediaAudioUrls[item.id]} alt={item.label || "Photo"} className="w-full rounded object-contain max-h-80" />
                    ) : (
                      <p className="text-xs text-muted-foreground italic">Loading photo...</p>
                    )
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lesson PDFs */}
        {pdfItems.length > 0 && (
          <div className="bg-card rounded-lg p-4 shadow-sm border border-border">
            <h3 className="font-display text-sm text-muted-foreground mb-3">Lesson PDF's</h3>
            <div className="space-y-1">
              {pdfItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center border border-border rounded-md px-2 py-1.5"
                >
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

        {/* PDF Viewer Dialog */}
        <Dialog
          open={!!pdfViewerUrl}
          onOpenChange={(open) => {
            if (!open) {
              setPdfViewerUrl(null);
              setPdfViewerName("");
            }
          }}
        >
          <DialogContent className="max-w-[95vw] max-h-[95vh] w-[95vw] h-[90vh] flex flex-col p-0">
            <DialogHeader className="px-4 py-3 border-b border-border shrink-0">
              <DialogTitle className="text-sm font-medium truncate pr-8">
                {pdfViewerName}
              </DialogTitle>
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

        {/* Footer */}
        <div className="text-center pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Music Practice Daily Record Journal
          </p>
        </div>
      </div>
    </div>
  );
}
