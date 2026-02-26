import { useState, useEffect } from "react";
import { useStudentAssignment } from "@/hooks/useWeeklyAssignment";
import { useStudentAssignmentMedia } from "@/hooks/useAssignmentMedia";
import { extractYouTubeVideoId } from "@/hooks/useMediaTools";
import { Music, Video, ImageIcon, Youtube, GraduationCap } from "lucide-react";

interface Props {
  date: Date;
}

function MediaPlayer({
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

  if (!url) return <div className="h-8 flex items-center text-xs text-muted-foreground">Loading...</div>;
  if (type === "video") {
    return <video controls className="w-full rounded" preload="metadata"><source src={url} /></video>;
  }
  return <audio controls className="w-full h-8" preload="metadata"><source src={url} /></audio>;
}

function PhotoPreview({
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

  if (!url) return <div className="h-8 flex items-center text-xs text-muted-foreground">Loading...</div>;
  return <img src={url} alt="Assignment photo" className="w-full rounded object-contain max-h-64" />;
}

function YouTubeEmbed({ url }: { url: string }) {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) return null;
  return (
    <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
      <iframe
        className="absolute inset-0 w-full h-full rounded"
        src={`https://www.youtube-nocookie.com/embed/${videoId}`}
        title="YouTube video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}

/**
 * Displays assignment media (YouTube links + uploaded files) to the student.
 * These are read-only items from the teacher's weekly assignment.
 */
export function AssignmentMediaDisplay({ date }: Props) {
  const { assignment, isLoading: assignmentLoading } = useStudentAssignment(date);
  const { mediaItems: fileMedia, isLoading: mediaLoading, getSignedUrl } = useStudentAssignmentMedia(assignment?.id);

  // Get YouTube links from the assignment
  const youtubeLinks: string[] = ((assignment as any)?.youtube_links || []).filter((l: string) => l?.trim());

  const hasContent = youtubeLinks.length > 0 || fileMedia.length > 0;

  if (assignmentLoading || mediaLoading) return null;
  if (!hasContent) return null;

  return (
    <div className="rounded-lg p-3 shadow-sm border border-primary/20 bg-primary/5 space-y-2">
      <div className="flex items-center gap-1.5">
        <GraduationCap className="w-3.5 h-3.5 text-primary" />
        <label className="font-display text-sm text-primary">From Teacher</label>
      </div>

      <div className="space-y-2">
        {/* YouTube links from assignment */}
        {youtubeLinks.map((link: string, idx: number) => (
          <div key={`yt-${idx}`} className="border border-border rounded-md p-2 space-y-1 bg-card">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Youtube className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">YouTube</span>
            </div>
            <YouTubeEmbed url={link} />
          </div>
        ))}

        {/* File media from assignment_media */}
        {fileMedia.map((item) => (
          <div key={item.id} className="border border-border rounded-md p-2 space-y-1 bg-card">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground truncate">
              {item.media_type === "audio" ? <Music className="w-3.5 h-3.5 flex-shrink-0" /> :
               item.media_type === "video" ? <Video className="w-3.5 h-3.5 flex-shrink-0" /> :
               <ImageIcon className="w-3.5 h-3.5 flex-shrink-0" />}
              <span className="truncate">{item.label || item.media_type}</span>
            </div>
            {(item.media_type === "audio" || item.media_type === "video") && item.file_path && (
              <MediaPlayer filePath={item.file_path} type={item.media_type} getSignedUrl={getSignedUrl} />
            )}
            {item.media_type === "photo" && item.file_path && (
              <PhotoPreview filePath={item.file_path} getSignedUrl={getSignedUrl} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
