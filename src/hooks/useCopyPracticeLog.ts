import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const MAX_MEDIA_ITEMS = 5;
const MAX_PDF_ITEMS = 10;

interface CopyProgress {
  stage: string;
  current: number;
  total: number;
}

async function copyStorageFile(
  bucket: string,
  sourcePath: string,
  destPath: string
): Promise<boolean> {
  try {
    const { data: blob, error: dlError } = await supabase.storage
      .from(bucket)
      .download(sourcePath);
    if (dlError || !blob) return false;

    const { error: upError } = await supabase.storage
      .from(bucket)
      .upload(destPath, blob, { upsert: true });
    return !upError;
  } catch {
    return false;
  }
}

export function useCopyPracticeLog(targetDate: Date, userId: string) {
  const [isCopying, setIsCopying] = useState(false);
  const [progress, setProgress] = useState<CopyProgress | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const copyFrom = async (sourceDate: Date) => {
    const sourceDateStr = format(sourceDate, "yyyy-MM-dd");
    const targetDateStr = format(targetDate, "yyyy-MM-dd");

    if (sourceDateStr === targetDateStr) {
      toast({ title: "Cannot copy", description: "Source and target dates are the same.", variant: "destructive" });
      return false;
    }

    setIsCopying(true);
    setProgress({ stage: "Fetching source log", current: 0, total: 1 });

    try {
      // 1. Fetch source log
      const { data: sourceLog, error: srcError } = await supabase
        .from("practice_logs")
        .select("*")
        .eq("user_id", userId)
        .eq("log_date", sourceDateStr)
        .maybeSingle();

      if (srcError) throw srcError;
      if (!sourceLog) {
        toast({ title: "No log found", description: "The selected date has no practice log.", variant: "destructive" });
        return false;
      }

      // 2. Upsert target log with text fields
      setProgress({ stage: "Copying text fields", current: 0, total: 1 });
      const textPayload = {
        user_id: userId,
        log_date: targetDateStr,
        goals: sourceLog.goals,
        subgoals: sourceLog.subgoals,
        warmups: sourceLog.warmups,
        scales: sourceLog.scales,
        repertoire: sourceLog.repertoire,
        repertoire_completed: sourceLog.repertoire_completed,
        repertoire_recordings: sourceLog.repertoire_recordings || [],
        technique: sourceLog.technique,
        musicianship: sourceLog.musicianship,
        notes: sourceLog.notes,
        metronome_used: sourceLog.metronome_used,
        additional_tasks: sourceLog.additional_tasks,
        additional_tasks_completed: sourceLog.additional_tasks_completed,
        ear_training: sourceLog.ear_training,
        ear_training_completed: sourceLog.ear_training_completed,
        music_listening: sourceLog.music_listening,
        music_listening_completed: sourceLog.music_listening_completed,
      };

      const { error: upsertError } = await supabase
        .from("practice_logs")
        .upsert(textPayload, { onConflict: "user_id,log_date" });
      if (upsertError) throw upsertError;

      // Get the target log ID
      const { data: targetLog, error: targetError } = await supabase
        .from("practice_logs")
        .select("id")
        .eq("user_id", userId)
        .eq("log_date", targetDateStr)
        .single();
      if (targetError || !targetLog) throw targetError || new Error("Failed to get target log");

      const targetLogId = targetLog.id;
      const warnings: string[] = [];

      // 3. Copy media files
      const { data: sourceMedia } = await supabase
        .from("practice_media")
        .select("*")
        .eq("practice_log_id", sourceLog.id)
        .order("sort_order", { ascending: true });

      if (sourceMedia && sourceMedia.length > 0) {
        const { data: existingMedia } = await supabase
          .from("practice_media")
          .select("id")
          .eq("practice_log_id", targetLogId);

        const existingCount = existingMedia?.length || 0;
        const available = MAX_MEDIA_ITEMS - existingCount;
        const mediaToCopy = sourceMedia.slice(0, available);

        if (sourceMedia.length > available) {
          warnings.push(`Skipped ${sourceMedia.length - available} media items (limit reached)`);
        }

        setProgress({ stage: "Copying media", current: 0, total: mediaToCopy.length });

        for (let i = 0; i < mediaToCopy.length; i++) {
          const item = mediaToCopy[i];
          setProgress({ stage: "Copying media", current: i + 1, total: mediaToCopy.length });

          if (item.media_type === "youtube") {
            await supabase.from("practice_media").insert({
              practice_log_id: targetLogId,
              user_id: userId,
              media_type: "youtube",
              youtube_url: item.youtube_url,
              label: item.label,
              sort_order: existingCount + i,
            });
          } else if (item.file_path) {
            const ext = item.file_path.substring(item.file_path.lastIndexOf("."));
            const newPath = `${userId}/${targetLogId}/media-${existingCount + i}${ext}`;
            const copied = await copyStorageFile("practice-media", item.file_path, newPath);
            if (copied) {
              await supabase.from("practice_media").insert({
                practice_log_id: targetLogId,
                user_id: userId,
                media_type: item.media_type,
                file_path: newPath,
                label: item.label,
                sort_order: existingCount + i,
              });
            }
          }
        }
      }

      // 4. Copy lesson PDFs
      const { data: sourcePdfs } = await supabase
        .from("lesson_pdfs")
        .select("*")
        .eq("practice_log_id", sourceLog.id)
        .order("sort_order", { ascending: true });

      if (sourcePdfs && sourcePdfs.length > 0) {
        const { data: existingPdfs } = await supabase
          .from("lesson_pdfs")
          .select("id")
          .eq("practice_log_id", targetLogId);

        const existingPdfCount = existingPdfs?.length || 0;
        const pdfAvailable = MAX_PDF_ITEMS - existingPdfCount;
        const pdfsToCopy = sourcePdfs.slice(0, pdfAvailable);

        if (sourcePdfs.length > pdfAvailable) {
          warnings.push(`Skipped ${sourcePdfs.length - pdfAvailable} PDFs (limit reached)`);
        }

        setProgress({ stage: "Copying PDFs", current: 0, total: pdfsToCopy.length });

        for (let i = 0; i < pdfsToCopy.length; i++) {
          const pdf = pdfsToCopy[i];
          setProgress({ stage: "Copying PDFs", current: i + 1, total: pdfsToCopy.length });

          const ext = pdf.file_path.substring(pdf.file_path.lastIndexOf("."));
          const newSortOrder = existingPdfCount + i;
          const safeName = pdf.file_name
            .toLowerCase()
            .replace(/\.[^.]+$/, "")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");
          const newPath = `${userId}/${targetLogId}/pdf-${newSortOrder}-${safeName}${ext}`;

          const copied = await copyStorageFile("lesson-pdfs", pdf.file_path, newPath);
          if (copied) {
            await supabase.from("lesson_pdfs").insert({
              practice_log_id: targetLogId,
              user_id: userId,
              file_path: newPath,
              file_name: pdf.file_name,
              file_size: pdf.file_size,
              sort_order: newSortOrder,
            });
          }
        }
      }

      // 5. Copy repertoire recordings
      const sourceRecordings = (sourceLog.repertoire_recordings as string[]) || [];
      const hasRecordings = sourceRecordings.some((r: string) => r && r.trim());

      if (hasRecordings) {
        setProgress({ stage: "Copying recordings", current: 0, total: sourceRecordings.length });
        const newRecordings = [...sourceRecordings];

        for (let i = 0; i < sourceRecordings.length; i++) {
          const recording = sourceRecordings[i];
          if (!recording || !recording.trim()) continue;
          setProgress({ stage: "Copying recordings", current: i + 1, total: sourceRecordings.length });

          const ext = recording.substring(recording.lastIndexOf("."));
          const newPath = `${userId}/${targetLogId}/recording-${i}${ext}`;
          const copied = await copyStorageFile("practice-recordings", recording, newPath);
          newRecordings[i] = copied ? newPath : "";
        }

        await supabase
          .from("practice_logs")
          .update({ repertoire_recordings: newRecordings })
          .eq("id", targetLogId);
      }

      // 6. Refresh
      queryClient.invalidateQueries({ queryKey: ["practice-log", targetDateStr] });

      const description = warnings.length > 0
        ? `Copied from ${format(sourceDate, "MMM d")}. ${warnings.join(". ")}`
        : `Successfully copied from ${format(sourceDate, "MMM d")}.`;

      toast({ title: "Log copied!", description });
      return true;
    } catch (err) {
      console.error("Copy error:", err);
      toast({ title: "Copy failed", description: "An error occurred while copying.", variant: "destructive" });
      return false;
    } finally {
      setIsCopying(false);
      setProgress(null);
    }
  };

  return { copyFrom, isCopying, progress };
}
