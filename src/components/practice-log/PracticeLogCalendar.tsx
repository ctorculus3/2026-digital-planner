import { useState, useCallback } from "react";
import { MonthTabs } from "./MonthTabs";
import { DayTabs } from "./DayTabs";
import { ScallopHeader } from "./ScallopHeader";
import { PracticeLogForm } from "./PracticeLogForm";
import { DateNavigator } from "./DateNavigator";
import { UserMenu } from "./UserMenu";
import { ManageSubscription } from "@/components/subscription/ManageSubscription";
import {
  addDays,
  getDay,
  subDays,
} from "date-fns";

export function PracticeLogCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const selectedMonth = currentDate.getMonth();
  const selectedDayOfWeek = getDay(currentDate);

  const handleSelectMonth = useCallback((month: number) => {
    const year = currentDate.getFullYear();
    setCurrentDate(new Date(year, month, 1));
  }, [currentDate]);

  const handleSelectDayOfWeek = useCallback((targetDayOfWeek: number) => {
    const currentDayOfWeek = getDay(currentDate);
    let daysToAdd = targetDayOfWeek - currentDayOfWeek;
    
    if (daysToAdd <= 0) {
      daysToAdd += 7;
    }
    
    const newDate = addDays(currentDate, daysToAdd);
    setCurrentDate(newDate);
  }, [currentDate]);

  const handlePrevDay = useCallback(() => {
    setCurrentDate(subDays(currentDate, 1));
  }, [currentDate]);

  const handleNextDay = useCallback(() => {
    setCurrentDate(addDays(currentDate, 1));
  }, [currentDate]);

  const handleToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Scalloped Header */}
      <ScallopHeader />
      
      {/* Month Tabs */}
      <div className="bg-muted border-b border-border">
        <div className="flex items-center justify-between px-4">
          <MonthTabs selectedMonth={selectedMonth} onSelectMonth={handleSelectMonth} />
          <div className="flex items-center gap-2">
            <ManageSubscription />
            <UserMenu />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Practice Log Content */}
        <div className="flex-1 p-4 md:p-6 overflow-auto">
          {/* Date Navigator */}
          <div className="flex justify-between items-center mb-4">
            <DateNavigator
              currentDate={currentDate}
              onPrevDay={handlePrevDay}
              onNextDay={handleNextDay}
              onToday={handleToday}
            />
            <span className="text-sm text-muted-foreground font-display">
              Music Practice Daily Record Journal
            </span>
          </div>

          {/* Form */}
          <PracticeLogForm date={currentDate} />
        </div>

        {/* Day Tabs (Right Side) */}
        <div className="flex items-start pt-4 pr-1">
          <DayTabs
            selectedDayOfWeek={selectedDayOfWeek}
            onSelectDayOfWeek={handleSelectDayOfWeek}
          />
        </div>
      </div>
    </div>
  );
}
