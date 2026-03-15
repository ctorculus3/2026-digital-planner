import { useState, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Share2, Copy, Download, Image, Send } from "lucide-react";
import { WeeklyReportCard } from "./WeeklyReportCard";
import { exportReportAsImage, downloadBlob, type ExportFormat } from "@/lib/exportReportImage";
import type { WeeklyReport } from "@/hooks/useWeeklyReport";
import { supabase } from "@/integrations/supabase/client";

interface ShareReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: WeeklyReport;
  onSharedToFeed?: (postId: string) => void;
}

const FORMAT_OPTIONS: { label: string; value: ExportFormat; desc: string }[] = [
  { label: "Instagram Story", value: "instagram", desc: "1080×1920" },
  { label: "Twitter/X", value: "twitter", desc: "1200×675" },
  { label: "Square", value: "square", desc: "1080×1080" },
];

export function ShareReportDialog({
  open,
  onOpenChange,
  report,
  onSharedToFeed,
}: ShareReportDialogProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>("instagram");
  const [exporting, setExporting] = useState(false);
  const [sharingToFeed, setSharingToFeed] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  const shareMessage = `Check out my weekly practice report! 🎵 ${report.total_minutes} minutes across ${report.session_count} sessions. ${report.streak_at_generation > 0 ? `${report.streak_at_generation}-day streak 🔥` : ""} #PracticeDaily`;

  const getExportBlob = useCallback(async (): Promise<Blob | null> => {
    if (!exportRef.current) return null;
    setExporting(true);
    try {
      return await exportReportAsImage(exportRef.current, selectedFormat);
    } catch (err) {
      console.error("Export failed:", err);
      toast({ title: "Export failed", description: "Could not generate image", variant: "destructive" });
      return null;
    } finally {
      setExporting(false);
    }
  }, [selectedFormat]);

  const handleDownload = async () => {
    const blob = await getExportBlob();
    if (!blob) return;
    const dateStr = report.week_start.replace(/-/g, "");
    downloadBlob(blob, `practice-report-${dateStr}-${selectedFormat}.png`);
    toast({ title: "Downloaded!", description: "Report image saved" });
  };

  const handleShareToFeed = async () => {
    setSharingToFeed(true);
    try {
      const blob = await getExportBlob();
      if (!blob) return;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      // Upload image to community-images bucket
      const ext = "png";
      const filePath = `${session.user.id}/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("community-images")
        .upload(filePath, blob, { cacheControl: "3600", upsert: false });

      if (uploadError) throw uploadError;

      // Post to community feed via moderate-and-post
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const res = await fetch(`${supabaseUrl}/functions/v1/moderate-and-post`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: `📊 My Weekly Practice Report (${report.week_start} to ${report.week_end}): ${report.total_minutes} minutes across ${report.session_count} sessions!`,
          image_paths: [filePath],
        }),
      });

      const result = await res.json();
      if (result.success) {
        toast({ title: "Shared!", description: "Report posted to the community feed" });
        onSharedToFeed?.(result.post?.id);
      } else {
        // Clean up uploaded image
        await supabase.storage.from("community-images").remove([filePath]);
        toast({
          title: "Could not share",
          description: result.error || "Post was not approved",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Share to feed failed:", err);
      toast({ title: "Share failed", description: "Could not post to community feed", variant: "destructive" });
    } finally {
      setSharingToFeed(false);
    }
  };

  const handleTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}&url=${encodeURIComponent("https://practicedaily.app")}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(shareMessage)}&u=${encodeURIComponent("https://practicedaily.app")}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleInstagram = async () => {
    // Download the image first, then copy text
    await handleDownload();
    await navigator.clipboard.writeText(shareMessage);
    toast({ title: "Image downloaded & text copied!", description: "Upload the image and paste the caption on Instagram" });
    window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareMessage);
    toast({ title: "Copied!", description: "Share text copied to clipboard" });
  };

  const handleNativeShare = async () => {
    if (!navigator.share) return;
    try {
      const blob = await getExportBlob();
      if (blob && navigator.canShare?.({ files: [new File([blob], "report.png", { type: "image/png" })] })) {
        await navigator.share({
          title: "My Practice Report",
          text: shareMessage,
          files: [new File([blob], "practice-report.png", { type: "image/png" })],
        });
      } else {
        await navigator.share({
          title: "My Practice Report",
          text: shareMessage,
          url: "https://practicedaily.app",
        });
      }
    } catch {
      // user cancelled
    }
  };

  const supportsNativeShare = typeof navigator !== "undefined" && !!navigator.share;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">Share Your Report</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Format selector */}
          <div className="flex gap-2">
            {FORMAT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSelectedFormat(opt.value)}
                className={`flex-1 rounded-lg border px-3 py-2 text-center transition-colors ${
                  selectedFormat === opt.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground hover:border-primary/50"
                }`}
              >
                <div className="text-xs font-medium">{opt.label}</div>
                <div className="text-[10px] opacity-70">{opt.desc}</div>
              </button>
            ))}
          </div>

          {/* Preview (scaled down) */}
          <div className="rounded-lg border border-border overflow-hidden bg-white">
            <div className="transform scale-[0.5] origin-top-left" style={{ width: "200%", height: 200 }}>
              <WeeklyReportCard report={report} forExport />
            </div>
          </div>

          {/* Hidden export target */}
          <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
            <WeeklyReportCard ref={exportRef} report={report} forExport />
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="default"
              onClick={handleDownload}
              disabled={exporting}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              {exporting ? "Generating..." : "Download PNG"}
            </Button>

            <Button
              variant="outline"
              onClick={handleShareToFeed}
              disabled={sharingToFeed || exporting}
              className="gap-2"
            >
              <Send className="h-4 w-4" />
              {sharingToFeed ? "Posting..." : "Community Feed"}
            </Button>

            <Button variant="outline" onClick={handleTwitter} className="gap-2">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              Twitter/X
            </Button>

            <Button variant="outline" onClick={handleFacebook} className="gap-2">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              Facebook
            </Button>

            <Button variant="outline" onClick={handleInstagram} className="gap-2">
              <Image className="h-4 w-4" />
              Instagram
            </Button>

            <Button variant="outline" onClick={handleCopy} className="gap-2">
              <Copy className="h-4 w-4" />
              Copy Text
            </Button>

            {supportsNativeShare && (
              <Button variant="outline" onClick={handleNativeShare} className="gap-2 col-span-2">
                <Share2 className="h-4 w-4" />
                Share
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
