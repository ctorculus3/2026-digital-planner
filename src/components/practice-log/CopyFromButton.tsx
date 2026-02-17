import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Calendar } from "@/components/ui/calendar";
import { Progress } from "@/components/ui/progress";
import { Copy, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCopyPracticeLog } from "@/hooks/useCopyPracticeLog";
import { cn } from "@/lib/utils";

interface CopyFromButtonProps {
  targetDate: Date;
  userId: string;
  hasExistingContent: boolean;
}

export function CopyFromButton({ targetDate, userId, hasExistingContent }: CopyFromButtonProps) {
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [showConfirm, setShowConfirm] = useState(false);
  const [practicedDates, setPracticedDates] = useState<Date[]>([]);
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const { copyFrom, isCopying, progress } = useCopyPracticeLog(targetDate, userId);

  // Fetch practiced dates for the visible month
  useEffect(() => {
    if (!open) return;
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth() + 1;

    supabase
      .rpc("get_practiced_dates", { p_user_id: userId, p_year: year, p_month: month })
      .then(({ data }) => {
        if (data) {
          setPracticedDates(data.map((d: string) => new Date(d + "T00:00:00")));
        }
      });
  }, [open, calendarMonth, userId]);

  const handleSelect = (date: Date | undefined) => {
    if (!date) return;
    setSelectedDate(date);
    if (hasExistingContent) {
      setShowConfirm(true);
    } else {
      executeCopy(date);
    }
  };

  const executeCopy = async (date: Date) => {
    const success = await copyFrom(date);
    if (success) {
      setOpen(false);
      setSelectedDate(undefined);
    }
  };

  const progressPercent = progress
    ? progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0
    : 0;

  // Modifiers for highlighting practiced dates
  const practicedModifier = { practiced: practicedDates };

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { if (!isCopying) setOpen(v); }}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Copy className="w-4 h-4 mr-2" />
            Copy
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Copy From Previous Day</DialogTitle>
            <DialogDescription>
              Select a date to copy its practice log into today. Days with logs are highlighted.
            </DialogDescription>
          </DialogHeader>

          {isCopying ? (
            <div className="py-8 space-y-4">
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">{progress?.stage || "Copying..."}</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
              {progress && progress.total > 0 && (
                <p className="text-xs text-center text-muted-foreground">
                  {progress.current} / {progress.total}
                </p>
              )}
            </div>
          ) : (
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleSelect}
              month={calendarMonth}
              onMonthChange={setCalendarMonth}
              disabled={(date) => date > new Date()}
              className={cn("p-3 pointer-events-auto")}
              modifiers={practicedModifier}
              modifiersClassNames={{
                practiced: "bg-primary/20 font-semibold",
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Overwrite current log?</AlertDialogTitle>
            <AlertDialogDescription>
              Today's text fields (goals, repertoire, notes, etc.) will be replaced with the copied data. 
              Media and PDFs will be added alongside any existing items.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => selectedDate && executeCopy(selectedDate)}>
              Copy & Overwrite
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
