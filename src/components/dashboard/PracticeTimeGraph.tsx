import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  eachWeekOfInterval,
  format,
  parseISO,
  isWithinInterval,
} from "date-fns";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

interface PracticeLog {
  log_date: string;
  total_time: string;
}

interface PracticeTimeGraphProps {
  practiceLogs: PracticeLog[];
  loading?: boolean;
}

function parseIntervalToMinutes(interval: unknown): number {
  if (!interval || typeof interval !== "string") return 0;
  const match = interval.match(/^(\d+):(\d+):(\d+)$/);
  if (!match) return 0;
  return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
}

function buildWeeklyData(logs: PracticeLog[]) {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  return days.map((day) => {
    const dateStr = format(day, "yyyy-MM-dd");
    const mins = logs
      .filter((l) => l.log_date === dateStr)
      .reduce((sum, l) => sum + parseIntervalToMinutes(l.total_time), 0);
    return { label: format(day, "EEE"), hours: +(mins / 60).toFixed(2) };
  });
}

function buildMonthlyData(logs: PracticeLog[]) {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const weeks = eachWeekOfInterval(
    { start: monthStart, end: monthEnd },
    { weekStartsOn: 1 }
  );

  return weeks.map((weekStart, i) => {
    const wEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    const mins = logs
      .filter((l) => {
        const d = parseISO(l.log_date);
        return isWithinInterval(d, { start: weekStart, end: wEnd });
      })
      .reduce((sum, l) => sum + parseIntervalToMinutes(l.total_time), 0);
    return { label: `Wk ${i + 1}`, hours: +(mins / 60).toFixed(2) };
  });
}

function buildYearlyData(logs: PracticeLog[]) {
  const year = new Date().getFullYear();
  return Array.from({ length: 12 }, (_, i) => {
    const monthStr = String(i + 1).padStart(2, "0");
    const prefix = `${year}-${monthStr}`;
    const mins = logs
      .filter((l) => l.log_date.startsWith(prefix))
      .reduce((sum, l) => sum + parseIntervalToMinutes(l.total_time), 0);
    return {
      label: format(new Date(year, i, 1), "MMM"),
      hours: +(mins / 60).toFixed(2),
    };
  });
}

export function PracticeTimeGraph({ practiceLogs, loading }: PracticeTimeGraphProps) {
  const [tab, setTab] = useState("weekly");

  const data = useMemo(() => {
    if (!practiceLogs.length) {
      if (tab === "weekly") return buildWeeklyData([]);
      if (tab === "monthly") return buildMonthlyData([]);
      return buildYearlyData([]);
    }
    if (tab === "weekly") return buildWeeklyData(practiceLogs);
    if (tab === "monthly") return buildMonthlyData(practiceLogs);
    return buildYearlyData(practiceLogs);
  }, [practiceLogs, tab]);

  if (loading) {
    return (
      <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
        <Skeleton className="h-6 w-48 mx-auto mb-4" />
        <Skeleton className="h-[200px] w-full" />
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
      <h2 className="text-center text-lg font-display font-bold text-foreground mb-3">
        Practice Over Time
      </h2>

      <Tabs value={tab} onValueChange={setTab} className="mb-4">
        <TabsList className="w-full justify-center">
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="yearly">Yearly</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 12 }}
              className="fill-muted-foreground"
            />
            <YAxis
              tick={{ fontSize: 12 }}
              className="fill-muted-foreground"
              allowDecimals
              unit="h"
            />
            <Tooltip
              formatter={(value: number) => [`${value} hrs`, "Practice"]}
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                borderColor: "hsl(var(--border))",
                borderRadius: "0.5rem",
                fontSize: "0.75rem",
              }}
            />
            <Bar
              dataKey="hours"
              fill="hsl(var(--header-bg))"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
