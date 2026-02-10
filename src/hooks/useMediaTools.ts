import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const MAX_MEDIA_ITEMS = 5;
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
const ACCEPTED_AUDIO_TYPES = [
  "audio/mpeg",
  "audio/wav",
  "audio/x-wav",
  "audio/mp4",
  "audio/x-m4a",
  "audio/ogg",
  "audio/webm",
];
const ACCEPTED_VIDEO_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/webm",
];
const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];
const ACCEPTED_EXTENSIONS = [".mp3", ".wav", ".m4a", ".ogg", ".webm", ".mp4", ".mov", ".jpg", ".jpeg", ".png", ".webp", ".gif"];

export interface MediaItem {
  id: string;
  practice_log_id: string;
  user_id: string;
  media_type: "audio" | "video" | "youtube" | "photo";
  file_path: string | null;
  youtube_url: string | null;
  label: string | null;
  sort_order: number;
  created_at: string;
}

function extractYouTubeVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    // youtube.com/watch?v=VIDEO_ID
    if (
      (parsed.hostname === "www.youtube.com" || parsed.hostname === "youtube.com") &&
      parsed.pathname === "/watch"
    ) {
      return parsed.searchParams.get("v");
    }
    // youtube.com/embed/VIDEO_ID
    if (
      (parsed.hostname === "www.youtube.com" || parsed.hostname === "youtube.com") &&
      parsed.pathname.startsWith("/embed/")
    ) {
      return parsed.pathname.split("/embed/")[1]?.split("?")[0] || null;
    }
    // youtu.be/VIDEO_ID
    if (parsed.hostname === "youtu.be") {
      return parsed.pathname.slice(1).split("?")[0] || null;
    }
  } catch {
    // not a valid URL
  }
  return null;
}

export function useMediaTools(
  practiceLogId: string | undefined,
  userId: string,
  logDate: string,
  onPracticeLogCreated?: () => void
) {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [resolvedLogId, setResolvedLogId] = useState<string | undefined>(practiceLogId);

  // Keep resolvedLogId in sync when practiceLogId prop changes
  useEffect(() => {
    setResolvedLogId(practiceLogId);
  }, [practiceLogId]);

  const fetchMedia = useCallback(async () => {
    if (!resolvedLogId) {
      setMediaItems([]);
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("practice_media")
        .select("*")
        .eq("practice_log_id", resolvedLogId)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      setMediaItems((data as MediaItem[]) || []);
    } catch (err) {
      console.error("Error fetching media:", err);
    } finally {
      setIsLoading(false);
    }
  }, [resolvedLogId]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  const getNextSortOrder = () => {
    if (mediaItems.length === 0) return 0;
    return Math.max(...mediaItems.map((m) => m.sort_order)) + 1;
  };

  // Auto-create a minimal practice log if one doesn't exist yet
  const ensurePracticeLog = useCallback(async (): Promise<string | null> => {
    if (resolvedLogId) return resolvedLogId;

    try {
      const { error: upsertError } = await supabase
        .from("practice_logs")
        .upsert(
          { user_id: userId, log_date: logDate },
          { onConflict: "user_id,log_date" }
        );

      if (upsertError) throw upsertError;

      // Query back to get the ID
      const { data, error: selectError } = await supabase
        .from("practice_logs")
        .select("id")
        .eq("user_id", userId)
        .eq("log_date", logDate)
        .single();

      if (selectError || !data) throw selectError || new Error("Failed to retrieve practice log");

      setResolvedLogId(data.id);
      onPracticeLogCreated?.();
      return data.id;
    } catch (err) {
      console.error("Error creating practice log:", err);
      toast.error("Failed to create practice log");
      return null;
    }
  }, [resolvedLogId, userId, logDate, onPracticeLogCreated]);

  const uploadAudio = useCallback(
    async (file: File) => {
      if (mediaItems.length >= MAX_MEDIA_ITEMS) {
        toast.error(`Maximum of ${MAX_MEDIA_ITEMS} media items reached`);
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error("File size must be under 500MB");
        return;
      }

      const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
      const isAccepted = ACCEPTED_EXTENSIONS.includes(ext) || ACCEPTED_AUDIO_TYPES.includes(file.type) || ACCEPTED_VIDEO_TYPES.includes(file.type);
      if (!isAccepted) {
        toast.error("Unsupported format. Use mp3, wav, m4a, ogg, webm, mp4, or mov.");
        return;
      }

      const isVideo = ACCEPTED_VIDEO_TYPES.includes(file.type) || [".mp4", ".mov"].includes(ext);
      const isPhoto = ACCEPTED_IMAGE_TYPES.includes(file.type) || [".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext);
      const mediaType = isPhoto ? "photo" : isVideo ? "video" : "audio";

      setIsUploading(true);
      try {
        const logId = await ensurePracticeLog();
        if (!logId) return;

        const sortOrder = getNextSortOrder();
        const filePath = `${userId}/${logId}/media-${sortOrder}${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("practice-media")
          .upload(filePath, file, { upsert: true });

        if (uploadError) throw uploadError;

        const { error: insertError } = await supabase.from("practice_media").insert({
          practice_log_id: logId,
          user_id: userId,
          media_type: mediaType,
          file_path: filePath,
          label: file.name,
          sort_order: sortOrder,
        });

        if (insertError) throw insertError;

        toast.success("File uploaded");
        await fetchMedia();
      } catch (err) {
        console.error("Upload error:", err);
        toast.error("Failed to upload file");
      } finally {
        setIsUploading(false);
      }
    },
    [userId, mediaItems, fetchMedia, ensurePracticeLog]
  );

  const addYouTubeLink = useCallback(
    async (url: string) => {
      if (mediaItems.length >= MAX_MEDIA_ITEMS) {
        toast.error(`Maximum of ${MAX_MEDIA_ITEMS} media items reached`);
        return false;
      }

      const videoId = extractYouTubeVideoId(url);
      if (!videoId) {
        toast.error("Invalid YouTube URL");
        return false;
      }

      try {
        const logId = await ensurePracticeLog();
        if (!logId) return false;

        const { error } = await supabase.from("practice_media").insert({
          practice_log_id: logId,
          user_id: userId,
          media_type: "youtube",
          youtube_url: url,
          label: `YouTube: ${videoId}`,
          sort_order: getNextSortOrder(),
        });

        if (error) throw error;

        toast.success("YouTube link added");
        await fetchMedia();
        return true;
      } catch (err) {
        console.error("Error adding YouTube link:", err);
        toast.error("Failed to add YouTube link");
        return false;
      }
    },
    [userId, mediaItems, fetchMedia, ensurePracticeLog]
  );

  const deleteMedia = useCallback(
    async (item: MediaItem) => {
      try {
        // Delete storage file if audio
        if ((item.media_type === "audio" || item.media_type === "video" || item.media_type === "photo") && item.file_path) {
          const { error: storageError } = await supabase.storage
            .from("practice-media")
            .remove([item.file_path]);
          if (storageError) console.error("Storage delete error:", storageError);
        }

        const { error } = await supabase
          .from("practice_media")
          .delete()
          .eq("id", item.id);

        if (error) throw error;

        toast.success("Media removed");
        await fetchMedia();
      } catch (err) {
        console.error("Error deleting media:", err);
        toast.error("Failed to remove media");
      }
    },
    [fetchMedia]
  );

  const getAudioUrl = useCallback(
    (filePath: string) => {
      const { data } = supabase.storage
        .from("practice-media")
        .getPublicUrl(filePath);
      // For private buckets we need a signed URL
      return null; // we'll use createSignedUrl instead
    },
    []
  );

  const getSignedAudioUrl = useCallback(async (filePath: string) => {
    const { data, error } = await supabase.storage
      .from("practice-media")
      .createSignedUrl(filePath, 3600); // 1 hour expiry
    if (error) {
      console.error("Signed URL error:", error);
      return null;
    }
    return data.signedUrl;
  }, []);

  return {
    mediaItems,
    isLoading,
    isUploading,
    uploadAudio,
    addYouTubeLink,
    deleteMedia,
    getSignedAudioUrl,
    itemCount: mediaItems.length,
    maxItems: MAX_MEDIA_ITEMS,
  };
}

export { extractYouTubeVideoId };
