import { cn } from "@/lib/utils";

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
}

export function DayTabs({ 
  selectedDayOfWeek, 
  onSelectDayOfWeek,
  showStaffPaper = true,
  onStaffPaperClick 
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
    </div>
  );
}
