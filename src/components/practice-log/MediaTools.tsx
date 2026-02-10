import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMediaTools, extractYouTubeVideoId, type MediaItem } from "@/hooks/useMediaTools";
import { Upload, Link, X, Loader2, Music, Youtube, Video, ImageIcon } from "lucide-react";
interface MediaToolsProps {
  practiceLogId: string | undefined;
  userId: string;
  logDate: string;
  onPracticeLogCreated?: () => void;
}
function MediaPlayer({
  filePath,
  type,
  getSignedUrl
}: {
  filePath: string;
  type: "audio" | "video";
  getSignedUrl: (path: string) => Promise<string | null>;
}) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    getSignedUrl(filePath).then(u => {
      if (!cancelled) setUrl(u);
    });
    return () => {
      cancelled = true;
    };
  }, [filePath, getSignedUrl]);
  if (!url) return <div className="h-8 flex items-center text-xs text-muted-foreground">Loading...</div>;
  if (type === "video") {
    return <video controls className="w-full rounded" preload="metadata">
        <source src={url} />
      </video>;
  }
  return <audio controls className="w-full h-8" preload="metadata">
      <source src={url} />
    </audio>;
}
function PhotoPreview({
  filePath,
  getSignedUrl
}: {
  filePath: string;
  getSignedUrl: (path: string) => Promise<string | null>;
}) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    getSignedUrl(filePath).then(u => {
      if (!cancelled) setUrl(u);
    });
    return () => {
      cancelled = true;
    };
  }, [filePath, getSignedUrl]);
  if (!url) return <div className="h-8 flex items-center text-xs text-muted-foreground">Loading...</div>;
  return <img src={url} alt="Practice photo" className="w-full rounded object-contain max-h-64" />;
}
function YouTubeEmbed({
  url
}: {
  url: string;
}) {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) return <p className="text-sm text-destructive">Invalid YouTube URL</p>;
  return <div className="relative w-full" style={{
    paddingBottom: "56.25%"
  }}>
      <iframe className="absolute inset-0 w-full h-full rounded" src={`https://www.youtube-nocookie.com/embed/${videoId}`} title="YouTube video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
    </div>;
}
export function MediaTools({
  practiceLogId,
  userId,
  logDate,
  onPracticeLogCreated
}: MediaToolsProps) {
  const {
    mediaItems,
    isLoading,
    isUploading,
    uploadAudio,
    addYouTubeLink,
    deleteMedia,
    getSignedAudioUrl,
    itemCount,
    maxItems
  } = useMediaTools(practiceLogId, userId, logDate, onPracticeLogCreated);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      uploadAudio(files[0]);
    }
  }, [uploadAudio]);
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      uploadAudio(files[0]);
    }
    // Reset so same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [uploadAudio]);
  const handleAddYouTube = useCallback(async () => {
    if (!youtubeUrl.trim()) return;
    const success = await addYouTubeLink(youtubeUrl.trim());
    if (success) setYoutubeUrl("");
  }, [youtubeUrl, addYouTubeLink]);
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddYouTube();
    }
  }, [handleAddYouTube]);
  const isFull = itemCount >= maxItems;
  return <div className="rounded-lg p-3 shadow-sm border border-border bg-[#c8ddc0]">
      <div className="flex items-center justify-between mb-2">
        <label className="font-display text-sm text-muted-foreground">Media Tools</label>
        <span className="text-xs text-muted-foreground">{itemCount}/{maxItems}</span>
      </div>

      {/* Drop zone */}
      {!isFull && <div className={`border-2 border-dashed rounded-md p-3 text-center cursor-pointer transition-colors mb-2 ${isDragOver ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/50"}`} onDragOver={e => {
      e.preventDefault();
      setIsDragOver(true);
    }} onDragLeave={() => setIsDragOver(false)} onDrop={handleFileDrop} onClick={() => fileInputRef.current?.click()}>
          {isUploading ? <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Uploading...
            </div> : <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Upload className="w-4 h-4" />
              Drop audio/video/photo or click to browse
            </div>}
          <input ref={fileInputRef} type="file" accept=".mp3,.wav,.m4a,.ogg,.webm,.mp4,.mov,.jpg,.jpeg,.png,.webp,.gif,audio/*,video/*,image/*" className="hidden" onChange={handleFileSelect} />
        </div>}

      {/* YouTube URL input */}
      {!isFull && <div className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <Link className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)} onKeyDown={handleKeyDown} placeholder="Paste YouTube URL" className="pl-7 h-8 text-sm" />
          </div>
          <Button type="button" size="sm" variant="outline" onClick={handleAddYouTube} disabled={!youtubeUrl.trim()} className="h-8">
            Add
          </Button>
        </div>}

      {/* Media items list */}
      {isLoading ? <div className="flex items-center justify-center py-2">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        </div> : <div className="space-y-2">
          {mediaItems.map(item => <MediaItemCard key={item.id} item={item} onDelete={deleteMedia} getSignedUrl={getSignedAudioUrl} />)}
        </div>}
    </div>;
}
function MediaItemCard({
  item,
  onDelete,
  getSignedUrl
}: {
  item: MediaItem;
  onDelete: (item: MediaItem) => void;
  getSignedUrl: (path: string) => Promise<string | null>;
}) {
  return <div className="border border-border rounded-md p-2 space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground truncate flex-1 min-w-0">
          {item.media_type === "audio" ? <Music className="w-3.5 h-3.5 flex-shrink-0" /> : item.media_type === "video" ? <Video className="w-3.5 h-3.5 flex-shrink-0" /> : item.media_type === "photo" ? <ImageIcon className="w-3.5 h-3.5 flex-shrink-0" /> : <Youtube className="w-3.5 h-3.5 flex-shrink-0" />}
          <span className="truncate">{item.label || (item.media_type === "youtube" ? "YouTube" : item.media_type === "video" ? "Video" : item.media_type === "photo" ? "Photo" : "Audio")}</span>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={() => onDelete(item)} className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive flex-shrink-0">
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>

      {(item.media_type === "audio" || item.media_type === "video") && item.file_path && <MediaPlayer filePath={item.file_path} type={item.media_type} getSignedUrl={getSignedUrl} />}

      {item.media_type === "photo" && item.file_path && <PhotoPreview filePath={item.file_path} getSignedUrl={getSignedUrl} />}

      {item.media_type === "youtube" && item.youtube_url && <YouTubeEmbed url={item.youtube_url} />}
    </div>;
}