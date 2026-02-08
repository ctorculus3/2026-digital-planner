import { useState, useCallback } from "react";
import { ScallopHeader } from "@/components/practice-log/ScallopHeader";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { PracticeCalendar } from "@/components/dashboard/PracticeCalendar";
import { StreakCounter } from "@/components/dashboard/StreakCounter";
import { BadgeShelf } from "@/components/dashboard/BadgeShelf";
import { UserMenu } from "@/components/practice-log/UserMenu";
import { ManageSubscription } from "@/components/subscription/ManageSubscription";
import { useDashboardData } from "@/hooks/useDashboardData";

export default function Dashboard() {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1); // 1-indexed

  const { practicedDates, streak, badges, loading } = useDashboardData(viewYear, viewMonth);

  const handlePrevMonth = useCallback(() => {
    setViewMonth((prev) => {
      if (prev === 1) {
        setViewYear((y) => y - 1);
        return 12;
      }
      return prev - 1;
    });
  }, []);

  const handleNextMonth = useCallback(() => {
    setViewMonth((prev) => {
      if (prev === 12) {
        setViewYear((y) => y + 1);
        return 1;
      }
      return prev + 1;
    });
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ScallopHeader />

      {/* Top bar with nav + user controls */}
      <div className="bg-[hsl(var(--time-section-bg))] border-b border-border">
        <div className="flex items-center justify-between px-4">
          <DashboardNav />
          <div className="flex items-center gap-2">
            <ManageSubscription />
            <UserMenu />
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <main className="flex-1 p-4 md:p-8 max-w-3xl mx-auto w-full space-y-6">
        <h1 className="text-2xl font-display font-bold text-foreground">
          Practice Dashboard
        </h1>

        {/* Streak Counter */}
        <StreakCounter streak={streak} loading={loading} />

        {/* Practice Calendar */}
        <PracticeCalendar
          year={viewYear}
          month={viewMonth}
          practicedDates={practicedDates}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
        />

        {/* Badge Shelf */}
        <BadgeShelf badges={badges} loading={loading} />
      </main>
    </div>
  );
}
