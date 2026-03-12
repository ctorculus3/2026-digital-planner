import { forwardRef } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Sparkles, Target, Trophy, Music } from "lucide-react";
import type { WeeklyReport } from "@/hooks/useWeeklyReport";

interface WeeklyReportCardProps {
  report: WeeklyReport;
  forExport?: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  warmups: "#f97316",       // orange
  scales: "#3b82f6",        // blue
  repertoire: "#8b5cf6",    // purple
  ear_training: "#10b981",  // green
  music_listening: "#f59e0b", // amber
  additional_tasks: "#6b7280", // gray
};

const CATEGORY_LABELS: Record<string, string> = {
  warmups: "Warmups",
  scales: "Scales",
  repertoire: "Repertoire",
  ear_training: "Ear Training",
  music_listening: "Listening",
  additional_tasks: "Other",
};

function formatMinutes(mins: number): string {
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  const remaining = mins % 60;
  return remaining > 0 ? `${hours}h ${remaining}m` : `${hours}h`;
}

function formatDateRange(start: string, end: string): string {
  const s = new Date(start + "T00:00:00");
  const e = new Date(end + "T00:00:00");
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  const yearOpts: Intl.DateTimeFormatOptions = { ...opts, year: "numeric" };
  return `${s.toLocaleDateString("en-US", opts)} – ${e.toLocaleDateString("en-US", yearOpts)}`;
}

export const WeeklyReportCard = forwardRef<HTMLDivElement, WeeklyReportCardProps>(
  ({ report, forExport = false }, ref) => {
    // Build chart data from category breakdown
    const chartData = Object.entries(report.category_breakdown)
      .filter(([, value]) => value > 0)
      .map(([key, value]) => ({
        name: CATEGORY_LABELS[key] || key,
        value,
        color: CATEGORY_COLORS[key] || "#6b7280",
      }))
      .sort((a, b) => b.value - a.value);

    const totalActivities = chartData.reduce((sum, d) => sum + d.value, 0);

    const containerClass = forExport
      ? "bg-white text-gray-900 p-8 space-y-6"
      : "bg-card text-card-foreground rounded-xl border border-border p-6 space-y-5";

    return (
      <div ref={ref} className={containerClass}>
        {/* Header */}
        <div className="text-center space-y-1">
          <div className="flex items-center justify-center gap-2">
            <Music className="h-5 w-5 text-primary" />
            <h2 className={`font-display font-bold ${forExport ? "text-2xl text-gray-900" : "text-xl text-foreground"}`}>
              Weekly Practice Report
            </h2>
          </div>
          <p className={`text-sm ${forExport ? "text-gray-500" : "text-muted-foreground"}`}>
            {formatDateRange(report.week_start, report.week_end)}
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Total Time", value: formatMinutes(report.total_minutes) },
            { label: "Sessions", value: String(report.session_count) },
            { label: "Streak", value: `${report.streak_at_generation}🔥` },
            { label: "Pieces", value: String(report.pieces_practiced.length) },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`text-center rounded-lg p-3 ${
                forExport
                  ? "bg-gray-50 border border-gray-200"
                  : "bg-muted/50 border border-border"
              }`}
            >
              <div className={`text-lg font-bold ${forExport ? "text-gray-900" : "text-foreground"}`}>
                {stat.value}
              </div>
              <div className={`text-xs ${forExport ? "text-gray-500" : "text-muted-foreground"}`}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Practice Breakdown */}
        {chartData.length > 0 && (
          <div className="space-y-2">
            <h3 className={`text-sm font-semibold ${forExport ? "text-gray-700" : "text-foreground"}`}>
              Practice Breakdown
            </h3>
            <div style={{ width: "100%", height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ left: 80, right: 20, top: 5, bottom: 5 }}>
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={75}
                    tick={{ fontSize: 12, fill: forExport ? "#6b7280" : "hsl(var(--muted-foreground))" }}
                  />
                  <Tooltip
                    formatter={(value: number) => [
                      `${value} ${value === 1 ? "item" : "items"} (${totalActivities > 0 ? Math.round((value / totalActivities) * 100) : 0}%)`,
                    ]}
                    contentStyle={{
                      backgroundColor: forExport ? "#ffffff" : "hsl(var(--card))",
                      border: `1px solid ${forExport ? "#e5e7eb" : "hsl(var(--border))"}`,
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={16}>
                    {chartData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* AI Insight */}
        {report.ai_insight && (
          <div
            className={`rounded-lg p-4 space-y-2 ${
              forExport
                ? "bg-purple-50 border border-purple-200"
                : "bg-primary/5 border border-primary/20"
            }`}
          >
            <div className="flex items-center gap-2">
              <Sparkles className={`h-4 w-4 ${forExport ? "text-purple-600" : "text-primary"}`} />
              <h3 className={`text-sm font-semibold ${forExport ? "text-purple-800" : "text-primary"}`}>
                AI Insight
              </h3>
            </div>
            <p className={`text-sm leading-relaxed ${forExport ? "text-gray-700" : "text-foreground"}`}>
              {report.ai_insight}
            </p>
          </div>
        )}

        {/* Next Week Focus */}
        {report.ai_next_week_focus && (
          <div
            className={`rounded-lg p-4 space-y-2 ${
              forExport
                ? "bg-blue-50 border border-blue-200"
                : "bg-blue-500/5 border border-blue-500/20"
            }`}
          >
            <div className="flex items-center gap-2">
              <Target className={`h-4 w-4 ${forExport ? "text-blue-600" : "text-blue-500"}`} />
              <h3 className={`text-sm font-semibold ${forExport ? "text-blue-800" : "text-blue-500"}`}>
                Next Week Focus
              </h3>
            </div>
            <div className={`text-sm leading-relaxed ${forExport ? "text-gray-700" : "text-foreground"}`}>
              {report.ai_next_week_focus.split("\n").map((line, i) => (
                <p key={i} className="mb-1">
                  {line}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Badges Earned */}
        {report.badges_earned.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Trophy className={`h-4 w-4 ${forExport ? "text-yellow-600" : "text-yellow-500"}`} />
              <h3 className={`text-sm font-semibold ${forExport ? "text-gray-700" : "text-foreground"}`}>
                Milestones Achieved
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {report.badges_earned.map((badge) => (
                <span
                  key={badge}
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                    forExport
                      ? "bg-yellow-100 text-yellow-800 border border-yellow-300"
                      : "bg-yellow-500/10 text-yellow-600 border border-yellow-500/30"
                  }`}
                >
                  🏆 {badge.replace(/_/g, " ").replace(/streak /i, "") + " Day Streak"}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Pieces Practiced */}
        {report.pieces_practiced.length > 0 && (
          <div className="space-y-2">
            <h3 className={`text-sm font-semibold ${forExport ? "text-gray-700" : "text-foreground"}`}>
              Pieces Practiced
            </h3>
            <div className="flex flex-wrap gap-2">
              {report.pieces_practiced.map((piece, i) => (
                <span
                  key={i}
                  className={`inline-block rounded-full px-3 py-1 text-xs ${
                    forExport
                      ? "bg-gray-100 text-gray-700 border border-gray-200"
                      : "bg-muted text-muted-foreground border border-border"
                  }`}
                >
                  {piece}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Footer / Branding */}
        <div className={`text-center pt-2 border-t ${forExport ? "border-gray-200" : "border-border"}`}>
          <p className={`text-xs font-display font-bold ${forExport ? "text-gray-400" : "text-muted-foreground"}`}>
            practicedaily.app
          </p>
        </div>
      </div>
    );
  }
);

WeeklyReportCard.displayName = "WeeklyReportCard";
