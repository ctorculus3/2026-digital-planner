import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Upload, Loader2, FileText } from "lucide-react";

interface Props {
  studentUserId: string;
  practiceLogId: string | null;
  logDate: string;
  existingPdfCount: number;
}

export function TeacherPdfUpload({ studentUserId, practiceLogId, logDate, existingPdfCount }: Props) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !practiceLogId) return;
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      toast({ title: "Only PDF files are allowed", variant: "destructive" });
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast({ title: "File too large (max 20MB)", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      const sortOrder = existingPdfCount;
      const storagePath = `${studentUserId}/${practiceLogId}/pdf-${sortOrder}-${sanitizedName}`;

      const { error: uploadError } = await supabase.storage
        .from("lesson-pdfs")
        .upload(storagePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase
        .from("lesson_pdfs")
        .insert({
          practice_log_id: practiceLogId,
          user_id: studentUserId,
          file_path: storagePath,
          file_name: file.name,
          file_size: file.size,
          sort_order: sortOrder,
        });
      if (dbError) throw dbError;

      queryClient.invalidateQueries({ queryKey: ["student-log-pdfs"] });
      toast({ title: "PDF uploaded" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  if (!practiceLogId) return null;

  return (
    <div className="bg-card rounded-lg p-4 shadow-sm border border-border space-y-3">
      <div className="flex items-center gap-2 text-sm font-display text-muted-foreground">
        <FileText className="h-4 w-4" />
        Upload Lesson PDF
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        onChange={handleUpload}
        className="sr-only"
        id="teacher-pdf-upload"
      />
      <label htmlFor="teacher-pdf-upload">
        <Button variant="outline" size="sm" disabled={uploading} asChild>
          <span>
            {uploading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Upload className="w-4 h-4 mr-1" />}
            {uploading ? "Uploading..." : "Choose PDF"}
          </span>
        </Button>
      </label>
    </div>
  );
}
