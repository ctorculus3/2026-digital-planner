import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const MAX_PDF_ITEMS = 10;
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

export interface LessonPdfItem {
  id: string;
  practice_log_id: string;
  user_id: string;
  file_path: string;
  file_name: string;
  file_size: number;
  sort_order: number;
  created_at: string;
}

export function useLessonPdfs(
  practiceLogId: string | undefined,
  userId: string,
  logDate: string,
  onPracticeLogCreated?: () => void
) {
  const [pdfItems, setPdfItems] = useState<LessonPdfItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [resolvedLogId, setResolvedLogId] = useState<string | undefined>(practiceLogId);

  // Keep resolvedLogId in sync when practiceLogId prop changes
  useEffect(() => {
    setResolvedLogId(practiceLogId);
  }, [practiceLogId]);

  const fetchPdfs = useCallback(async () => {
    if (!resolvedLogId) {
      setPdfItems([]);
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("lesson_pdfs")
        .select("*")
        .eq("practice_log_id", resolvedLogId)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      setPdfItems((data as LessonPdfItem[]) || []);
    } catch (err) {
      console.error("Error fetching lesson PDFs:", err);
    } finally {
      setIsLoading(false);
    }
  }, [resolvedLogId]);

  useEffect(() => {
    fetchPdfs();
  }, [fetchPdfs]);

  const getNextSortOrder = () => {
    if (pdfItems.length === 0) return 0;
    return Math.max(...pdfItems.map((p) => p.sort_order)) + 1;
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

  const uploadPdf = useCallback(
    async (file: File) => {
      if (pdfItems.length >= MAX_PDF_ITEMS) {
        toast.error(`Maximum of ${MAX_PDF_ITEMS} PDFs reached`);
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error("File size must be under 20MB");
        return;
      }

      if (file.type !== "application/pdf") {
        toast.error("Only PDF files are accepted");
        return;
      }

      setIsUploading(true);
      try {
        const logId = await ensurePracticeLog();
        if (!logId) return;

        const sortOrder = getNextSortOrder();
        const filePath = `${userId}/${logId}/${file.name}`;

        const { error: uploadError } = await supabase.storage
          .from("lesson-pdfs")
          .upload(filePath, file, { upsert: true });

        if (uploadError) throw uploadError;

        const { error: insertError } = await supabase.from("lesson_pdfs").insert({
          practice_log_id: logId,
          user_id: userId,
          file_path: filePath,
          file_name: file.name,
          file_size: file.size,
          sort_order: sortOrder,
        });

        if (insertError) throw insertError;

        toast.success("PDF uploaded");
        await fetchPdfs();
      } catch (err) {
        console.error("Upload error:", err);
        toast.error("Failed to upload PDF");
      } finally {
        setIsUploading(false);
      }
    },
    [userId, pdfItems, fetchPdfs, ensurePracticeLog]
  );

  const deletePdf = useCallback(
    async (item: LessonPdfItem) => {
      try {
        // Delete from storage first
        const { error: storageError } = await supabase.storage
          .from("lesson-pdfs")
          .remove([item.file_path]);
        if (storageError) console.error("Storage delete error:", storageError);

        // Delete DB record
        const { error } = await supabase
          .from("lesson_pdfs")
          .delete()
          .eq("id", item.id);

        if (error) throw error;

        toast.success("PDF removed");
        await fetchPdfs();
      } catch (err) {
        console.error("Error deleting PDF:", err);
        toast.error("Failed to remove PDF");
      }
    },
    [fetchPdfs]
  );

  const getSignedPdfUrl = useCallback(async (filePath: string) => {
    const { data, error } = await supabase.storage
      .from("lesson-pdfs")
      .createSignedUrl(filePath, 3600); // 1 hour expiry
    if (error) {
      console.error("Signed URL error:", error);
      return null;
    }
    return data.signedUrl;
  }, []);

  return {
    pdfItems,
    isLoading,
    isUploading,
    uploadPdf,
    deletePdf,
    getSignedPdfUrl,
    itemCount: pdfItems.length,
    maxItems: MAX_PDF_ITEMS,
  };
}
