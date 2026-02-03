import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DateNavigatorProps {
  currentDate: Date;
  onPrevDay: () => void;
  onNextDay: () => void;
  onToday: () => void;
}

export function DateNavigator({ currentDate, onPrevDay, onNextDay, onToday }: DateNavigatorProps) {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={onPrevDay}
        className="h-8 w-8 hover:bg-accent"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onToday}
        className="text-xs font-display"
      >
        Today
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={onNextDay}
        className="h-8 w-8 hover:bg-accent"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
