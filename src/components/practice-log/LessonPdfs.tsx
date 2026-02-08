import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useLessonPdfs, type LessonPdfItem } from "@/hooks/useLessonPdfs";
import { Upload, X, Loader2, FileText, Plus, Download } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface LessonPdfsProps {
  practiceLogId: string | undefined;
  userId: string;
  logDate: string;
  onPracticeLogCreated?: () => void;
}

export function LessonPdfs({
  practiceLogId,
  userId,
  logDate,
  onPracticeLogCreated,
}: LessonPdfsProps) {
  const {
    pdfItems,
    isLoading,
    isUploading,
    uploadPdf,
    deletePdf,
    getSignedPdfUrl,
    itemCount,
    maxItems,
  } = useLessonPdfs(practiceLogId, userId, logDate, onPracticeLogCreated);

  const [isDragOver, setIsDragOver] = useState(false);
  const [visibleCount, setVisibleCount] = useState(4);
  const [pdfViewerUrl, setPdfViewerUrl] = useState<string | null>(null);
  const [pdfViewerName, setPdfViewerName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isFull = itemCount >= maxItems;

  const handleFileDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const files = Array.from(e.dataTransfer.files);
      const pdfFile = files.find((f) => f.type === "application/pdf");
      if (pdfFile) {
        uploadPdf(pdfFile);
      } else {
        toast.error("Only PDF files are accepted");
      }
    },
    [uploadPdf]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        uploadPdf(files[0]);
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [uploadPdf]
  );

  const handleOpenPdf = useCallback(
    async (item: LessonPdfItem) => {
      const url = await getSignedPdfUrl(item.file_path);
      if (url) {
        setPdfViewerUrl(url);
        setPdfViewerName(item.file_name);
      } else {
        toast.error("Failed to open PDF");
      }
    },
    [getSignedPdfUrl]
  );

  const handleShowMore = () => {
    setVisibleCount((prev) => Math.min(prev + 4, maxItems));
  };

  // Show at least visibleCount slots, but always show all uploaded items
  const displayCount = Math.max(visibleCount, itemCount);

  return (
    <div className="rounded-lg p-3 shadow-sm border border-border bg-card">
      <div className="flex items-center justify-between mb-2">
        <label className="font-display text-sm text-muted-foreground">
          Lesson PDF's
        </label>
        <span className="text-xs text-muted-foreground">
          {itemCount}/{maxItems}
        </span>
      </div>

      {/* Drop zone */}
      {!isFull && (
        <div
          className={`border-2 border-dashed rounded-md p-3 text-center cursor-pointer transition-colors mb-2 ${
            isDragOver
              ? "border-primary bg-primary/5"
              : "border-border hover:border-muted-foreground/50"
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleFileDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          {isUploading ? (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Uploading...
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Upload className="w-4 h-4" />
              Drop PDF or click to browse
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>
      )}

      {/* PDF items list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-2">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-1">
          {pdfItems.slice(0, displayCount).map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between border border-border rounded-md px-2 py-1.5"
            >
              <button
                type="button"
                onClick={() => handleOpenPdf(item)}
                className="flex items-center gap-1.5 text-xs text-foreground hover:text-primary truncate flex-1 min-w-0 text-left"
              >
                <FileText className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground" />
                <span className="truncate">{item.file_name}</span>
              </button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => deletePdf(item)}
                className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive flex-shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Show more button */}
      {visibleCount < maxItems && itemCount < maxItems && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleShowMore}
          className="mt-2 text-muted-foreground hover:text-foreground"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add
        </Button>
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
          <DialogHeader className="flex flex-row items-center justify-between px-4 py-3 border-b border-border shrink-0">
            <DialogTitle className="text-sm font-medium truncate pr-2">
              {pdfViewerName}
            </DialogTitle>
            {pdfViewerUrl && (
              <a
                href={pdfViewerUrl}
                download={pdfViewerName}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-primary hover:underline shrink-0 mr-8"
              >
                <Download className="w-3.5 h-3.5" />
                Download
              </a>
            )}
          </DialogHeader>
          <div className="flex-1 min-h-0">
            {pdfViewerUrl && (
              <iframe
                src={pdfViewerUrl}
                className="w-full h-full border-0"
                title={pdfViewerName}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
