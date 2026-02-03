import { cn } from "@/lib/utils";

const MONTHS = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"
];

interface MonthTabsProps {
  selectedMonth: number;
  onSelectMonth: (month: number) => void;
}

export function MonthTabs({ selectedMonth, onSelectMonth }: MonthTabsProps) {
  return (
    <div className="flex items-center justify-center gap-2 md:gap-4 py-3 px-4 flex-wrap">
      {MONTHS.map((month, index) => (
        <button
          key={month}
          onClick={() => onSelectMonth(index)}
          className={cn(
            "font-display text-sm md:text-base tracking-wide transition-all duration-200",
            "hover:text-primary hover:underline underline-offset-4",
            selectedMonth === index
              ? "text-primary font-bold underline decoration-2"
              : "text-foreground/70"
          )}
        >
          {month}
        </button>
      ))}
    </div>
  );
}
