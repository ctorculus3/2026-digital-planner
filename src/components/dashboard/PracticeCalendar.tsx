import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isToday,
  isSameDay,
} from "date-fns";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface PracticeCalendarProps {
  year: number;
  month: number; // 1-indexed
  practicedDates: string[];
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

export function PracticeCalendar({
  year,
  month,
  practicedDates,
  onPrevMonth,
  onNextMonth,
}: PracticeCalendarProps) {
  const currentMonth = new Date(year, month - 1, 1);

  const practicedSet = useMemo(() => {
    return new Set(practicedDates.map((d) => format(new Date(d), "yyyy-MM-dd")));
  }, [practicedDates]);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart);
    const calEnd = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentMonth]);

  return (
    <div className="bg-card rounded-lg border border-border p-4 md:p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="icon" onClick={onPrevMonth} className="h-8 w-8">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-display font-bold text-foreground">
          {format(currentMonth, "MMMM yyyy")}
        </h2>
        <Button variant="ghost" size="icon" onClick={onNextMonth} className="h-8 w-8">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-muted-foreground py-1"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const inMonth = isSameMonth(day, currentMonth);
          const today = isToday(day);
          const practiced = practicedSet.has(dateStr);

          return (
            <div
              key={dateStr}
              className={cn(
                "relative flex items-center justify-center h-9 w-full rounded-md text-sm transition-colors",
                !inMonth && "opacity-30",
                today && !practiced && "ring-1 ring-header-bg"
              )}
            >
              {practiced && (
                <div className="absolute inset-1 rounded-full bg-header-bg opacity-20" />
              )}
              <span
                className={cn(
                  "relative z-10 flex items-center justify-center h-7 w-7 rounded-full text-sm",
                  practiced && inMonth && "bg-header-bg text-primary-foreground font-medium",
                  !practiced && inMonth && "text-foreground",
                  today && "font-bold"
                )}
              >
                {format(day, "d")}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
