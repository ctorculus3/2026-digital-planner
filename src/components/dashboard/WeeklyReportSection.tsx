import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Share2, ChevronLeft, ChevronRight } from "lucide-react";
import { WeeklyReportCard } from "./WeeklyReportCard";
import { ShareReportDialog } from "./ShareReportDialog";
import { useWeeklyReport } from "@/hooks/useWeeklyReport";
import { Skeleton } from "@/components/ui/skeleton";

export function WeeklyReportSection() {
  const { report, loading, generating, error, fetchReport, generateReport, updateReport } =
    useWeeklyReport();
  const [shareOpen, setShareOpen] = useState(false);

  // On mount, try to fetch the latest report
  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleGenerate = useCallback(() => {
    generateReport();
  }, [generateReport]);

  const handleSharedToFeed = useCallback(
    (postId: string) => {
      if (report) {
        updateReport(report.id, { community_post_id: postId });
      }
    },
    [report, updateReport]
  );

  // Loading state
  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  // Generating state
  if (generating) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center space-y-4">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <Sparkles className="h-8 w-8 text-primary animate-spin" />
          <h3 className="text-lg font-semibold text-foreground">
            Generating Your Report...
          </h3>
          <p className="text-sm text-muted-foreground">
            Analyzing your practice data and creating AI insights
          </p>
        </div>
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    );
  }

  // No report yet — CTA
  if (!report) {
    return (
      <div className="rounded-xl border border-dashed border-primary/40 bg-primary/5 p-6 text-center space-y-3">
        <Sparkles className="h-8 w-8 text-primary mx-auto" />
        <h3 className="text-lg font-display font-bold text-foreground">
          Weekly Practice Report
        </h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Generate a personalized AI report card with your practice stats, insights, and goals.
          Share it on social media!
        </p>
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
        <Button onClick={handleGenerate} className="gap-2">
          <Sparkles className="h-4 w-4" />
          Generate My Weekly Report
        </Button>
      </div>
    );
  }

  // Report exists — show it
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-display font-bold text-foreground flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Weekly Report
        </h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerate}
            disabled={generating}
            className="gap-1 text-xs"
          >
            <Sparkles className="h-3 w-3" />
            {generating ? "Generating..." : "New Report"}
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => setShareOpen(true)}
            className="gap-1 text-xs"
          >
            <Share2 className="h-3 w-3" />
            Share
          </Button>
        </div>
      </div>

      <WeeklyReportCard report={report} />

      <ShareReportDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        report={report}
        onSharedToFeed={handleSharedToFeed}
      />
    </div>
  );
}
