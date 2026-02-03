import { useState, useCallback } from "react";
import { MonthTabs } from "./MonthTabs";
import { DayTabs } from "./DayTabs";
import { NotebookRings } from "./NotebookRings";
import { ScallopHeader } from "./ScallopHeader";
import { PracticeLogForm } from "./PracticeLogForm";
import { DateNavigator } from "./DateNavigator";
import {
  getDaysInMonth,
  setMonth,
  setYear,
  startOfMonth,
  addDays,
  getDay,
  addMonths,
  subDays,
} from "date-fns";

export function PracticeLogCalendar() {
  // Start on Jan 1, 2026
  const [currentDate, setCurrentDate] = useState(new Date(2026, 0, 1));

  const selectedMonth = currentDate.getMonth();
  const selectedDayOfWeek = getDay(currentDate);

  const handleSelectMonth = useCallback((month: number) => {
    // Jump to the 1st of the selected month in 2026
    setCurrentDate(new Date(2026, month, 1));
  }, []);

  const handleSelectDayOfWeek = useCallback((targetDayOfWeek: number) => {
    // Find the next occurrence of that weekday within the current month
    const currentDayOfWeek = getDay(currentDate);
    let daysToAdd = targetDayOfWeek - currentDayOfWeek;
    
    if (daysToAdd <= 0) {
      daysToAdd += 7;
    }
    
    const newDate = addDays(currentDate, daysToAdd);
    
    // Stay within 2026
    if (newDate.getFullYear() === 2026) {
      setCurrentDate(newDate);
    }
  }, [currentDate]);

  const handlePrevDay = useCallback(() => {
    const newDate = subDays(currentDate, 1);
    // Don't go before Jan 1, 2026
    if (newDate >= new Date(2026, 0, 1)) {
      setCurrentDate(newDate);
    }
  }, [currentDate]);

  const handleNextDay = useCallback(() => {
    const newDate = addDays(currentDate, 1);
    // Don't go after Dec 31, 2026
    if (newDate <= new Date(2026, 11, 31)) {
      setCurrentDate(newDate);
    }
  }, [currentDate]);

  const handleToday = useCallback(() => {
    const today = new Date();
    // If we're in 2026, go to current date equivalent, otherwise start of 2026
    if (today.getFullYear() === 2026) {
      setCurrentDate(today);
    } else {
      setCurrentDate(new Date(2026, 0, 1));
    }
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Scalloped Header */}
      <ScallopHeader />
      
      {/* Month Tabs */}
      <div className="bg-muted border-b border-border">
        <MonthTabs selectedMonth={selectedMonth} onSelectMonth={handleSelectMonth} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Notebook Rings */}
        <div className="hidden md:flex items-center justify-center px-3 bg-muted/50 border-r border-border">
          <NotebookRings />
        </div>

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
              2026 Practice Journal
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
