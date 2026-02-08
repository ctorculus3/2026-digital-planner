import { cn } from "@/lib/utils";
import { ChevronUp, ChevronDown } from "lucide-react";

const DAYS = [
  { short: "SUN", full: "SUNDAY", color: "bg-tab-sunday" },
  { short: "MON", full: "MONDAY", color: "bg-tab-monday" },
  { short: "TUES", full: "TUESDAY", color: "bg-tab-tuesday" },
  { short: "WED", full: "WEDNESDAY", color: "bg-tab-wednesday" },
  { short: "THUR", full: "THURSDAY", color: "bg-tab-thursday" },
  { short: "FRI", full: "FRIDAY", color: "bg-tab-friday" },
  { short: "SAT", full: "SATURDAY", color: "bg-tab-saturday" },
];

interface DayTabsProps {
  selectedDayOfWeek: number;
  onSelectDayOfWeek: (day: number) => void;
  showStaffPaper?: boolean;
  onStaffPaperClick?: () => void;
  onPrevWeek?: () => void;
  onNextWeek?: () => void;
}

export function DayTabs({ 
  selectedDayOfWeek, 
  onSelectDayOfWeek,
  showStaffPaper = true,
  onStaffPaperClick,
  onPrevWeek,
  onNextWeek
}: DayTabsProps) {
  return (
    <div className="flex flex-col gap-1">
      {/* Staff Paper Tab */}
      {showStaffPaper && (
        <button
          onClick={onStaffPaperClick}
          className={cn(
            "bg-tab-staff text-primary-foreground font-display text-xs",
            "py-3 px-2 rounded-r-lg shadow-md",
            "hover:brightness-110 transition-all duration-200",
            "writing-mode-vertical"
          )}
          style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
        >
          STAFF PAPER
        </button>
      )}

      {/* Previous Week Tab */}
      {onPrevWeek && (
        <button
          onClick={onPrevWeek}
          className={cn(
            "bg-tab-nav text-primary-foreground font-display",
            "py-2 px-2 rounded-r-lg shadow-md",
            "hover:brightness-110 transition-all duration-200",
            "flex items-center justify-center"
          )}
          title="Previous week"
        >
          <ChevronUp size={16} />
        </button>
      )}
      
      {/* Day Tabs */}
      {DAYS.map((day, index) => (
        <button
          key={day.short}
          onClick={() => onSelectDayOfWeek(index)}
          className={cn(
            day.color,
            "text-primary-foreground font-display text-xs",
            "py-3 px-2 rounded-r-lg shadow-md",
            "hover:brightness-110 transition-all duration-200",
            selectedDayOfWeek === index && "ring-2 ring-foreground/30 ring-offset-1"
          )}
          style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
        >
          {day.short}
        </button>
      ))}

      {/* Next Week Tab */}
      {onNextWeek && (
        <button
          onClick={onNextWeek}
          className={cn(
            "bg-tab-nav text-primary-foreground font-display",
            "py-2 px-2 rounded-r-lg shadow-md",
            "hover:brightness-110 transition-all duration-200",
            "flex items-center justify-center"
          )}
          title="Next week"
        >
          <ChevronDown size={16} />
        </button>
      )}
    </div>
  );
}
