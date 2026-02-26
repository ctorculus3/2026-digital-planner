import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const MAX_ASSIGNMENT_MEDIA = 10;
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

const ACCEPTED_AUDIO_TYPES = ["audio/mpeg", "audio/wav", "audio/x-wav", "audio/mp4", "audio/x-m4a", "audio/ogg", "audio/webm"];
const ACCEPTED_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"];
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ACCEPTED_EXTENSIONS = [".mp3", ".wav", ".m4a", ".ogg", ".webm", ".mp4", ".mov", ".jpg", ".jpeg", ".png", ".webp", ".gif"];

export interface AssignmentMediaItem {
  id: string;
  weekly_assignment_id: string;
  studio_id: string;
  teacher_user_id: string;
  media_type: "audio" | "video" | "photo";
  file_path: string;
  label: string | null;
  sort_order: number;
  created_at: string;
}

/**
 * Hook for teacher to manage media files attached to a weekly assignment.
 * Handles upload to Supabase Storage + metadata in assignment_media table.
 */
export function useAssignmentMedia(
  assignmentId: string | undefined,
  studioId: string | undefined,
  teacherUserId: string,
  ensureAssignment: () => Promise<string>
) {
  const [mediaItems, setMediaItems] = useState<AssignmentMediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const fetchMedia = useCallback(async () => {
    if (!assignmentId) {
      setMediaItems([]);
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("assignment_media")
        .select("*")
        .eq("weekly_assignment_id", assignmentId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      setMediaItems((data as AssignmentMediaItem[]) || []);
    } catch (err) {
      console.error("Error fetching assignment media:", err);
    } finally {
      setIsLoading(false);
    }
  }, [assignmentId]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  const getNextSortOrder = () => {
    if (mediaItems.length === 0) return 0;
    return Math.max(...mediaItems.map((m) => m.sort_order)) + 1;
  };

  const uploadFile = useCallback(
    async (file: File) => {
      if (mediaItems.length >= MAX_ASSIGNMENT_MEDIA) {
        toast.error(`Maximum of ${MAX_ASSIGNMENT_MEDIA} media items reached`);
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error("File size must be under 500MB");
        return;
      }

      const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
      const isAccepted =
        ACCEPTED_EXTENSIONS.includes(ext) ||
        ACCEPTED_AUDIO_TYPES.includes(file.type) ||
        ACCEPTED_VIDEO_TYPES.includes(file.type) ||
        ACCEPTED_IMAGE_TYPES.includes(file.type);
      if (!isAccepted) {
        toast.error("Unsupported format. Use mp3, wav, m4a, ogg, webm, mp4, mov, jpg, png, webp, or gif.");
        return;
      }

      const isVideo = ACCEPTED_VIDEO_TYPES.includes(file.type) || [".mp4", ".mov"].includes(ext);
      const isPhoto = ACCEPTED_IMAGE_TYPES.includes(file.type) || [".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext);
      const mediaType: "audio" | "video" | "photo" = isPhoto ? "photo" : isVideo ? "video" : "audio";

      setIsUploading(true);
      try {
        // Ensure the assignment row exists first
        const resolvedAssignmentId = await ensureAssignment();
        if (!studioId) throw new Error("No studio");

        const sortOrder = getNextSortOrder();
        const timestamp = Date.now();
        const filePath = `${teacherUserId}/assignments/${resolvedAssignmentId}/${timestamp}-${sortOrder}${ext}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from("assignment-media")
          .upload(filePath, file, { upsert: true });
        if (uploadError) throw uploadError;

        // Insert metadata row
        const { error: insertError } = await supabase.from("assignment_media").insert({
          weekly_assignment_id: resolvedAssignmentId,
          studio_id: studioId,
          teacher_user_id: teacherUserId,
          media_type: mediaType,
          file_path: filePath,
          label: file.name,
          sort_order: sortOrder,
        });
        if (insertError) throw insertError;

        toast.success("File uploaded");
        await fetchMedia();
      } catch (err) {
        console.error("Assignment media upload error:", err);
        toast.error("Failed to upload file");
      } finally {
        setIsUploading(false);
      }
    },
    [teacherUserId, studioId, mediaItems, fetchMedia, ensureAssignment]
  );

  const deleteMedia = useCallback(
    async (item: AssignmentMediaItem) => {
      try {
        // Delete from storage
        if (item.file_path) {
          const { error: storageError } = await supabase.storage
            .from("assignment-media")
            .remove([item.file_path]);
          if (storageError) console.error("Storage delete error:", storageError);
        }

        // Delete metadata row
        const { error } = await supabase
          .from("assignment_media")
          .delete()
          .eq("id", item.id);
        if (error) throw error;

        toast.success("Media removed");
        await fetchMedia();
      } catch (err) {
        console.error("Error deleting assignment media:", err);
        toast.error("Failed to remove media");
      }
    },
    [fetchMedia]
  );

  const getSignedUrl = useCallback(async (filePath: string) => {
    const { data, error } = await supabase.storage
      .from("assignment-media")
      .createSignedUrl(filePath, 3600);
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
    uploadFile,
    deleteMedia,
    getSignedUrl,
    itemCount: mediaItems.length,
    maxItems: MAX_ASSIGNMENT_MEDIA,
  };
}

/**
 * Student-side hook: fetch assignment media for the current week (read-only).
 * Returns both YouTube links (from weekly_assignments) and file media (from assignment_media).
 */
export function useStudentAssignmentMedia(assignmentId: string | undefined) {
  const [mediaItems, setMediaItems] = useState<AssignmentMediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!assignmentId) {
      setMediaItems([]);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    supabase
      .from("assignment_media")
      .select("*")
      .eq("weekly_assignment_id", assignmentId)
      .order("sort_order", { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error("Error fetching student assignment media:", error);
          setMediaItems([]);
        } else {
          setMediaItems((data as AssignmentMediaItem[]) || []);
        }
        setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [assignmentId]);

  const getSignedUrl = useCallback(async (filePath: string) => {
    const { data, error } = await supabase.storage
      .from("assignment-media")
      .createSignedUrl(filePath, 3600);
    if (error) {
      console.error("Signed URL error:", error);
      return null;
    }
    return data.signedUrl;
  }, []);

  return { mediaItems, isLoading, getSignedUrl };
}
