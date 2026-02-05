import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface PracticeLogData {
  id: string;
  log_date: string;
  goals: string | null;
  subgoals: string | null;
  start_time: string | null;
  stop_time: string | null;
  warmups: string[] | null;
  scales: string[] | null;
  repertoire: string[] | null;
  notes: string | null;
  metronome_used: boolean | null;
}

export default function SharedPracticeLog() {
  const { token } = useParams<{ token: string }>();
  const [practiceLog, setPracticeLog] = useState<PracticeLogData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSharedLog() {
      if (!token) {
        setError("Invalid share link");
        setIsLoading(false);
        return;
      }

      try {
        // First get the share token to find the practice log id
        const { data: shareData, error: shareError } = await supabase
          .from("shared_practice_logs")
          .select("practice_log_id, expires_at")
          .eq("share_token", token)
          .maybeSingle();

        if (shareError) throw shareError;

        if (!shareData) {
          setError("This share link is invalid or has expired.");
          setIsLoading(false);
          return;
        }

        // Check if expired
        if (shareData.expires_at && new Date(shareData.expires_at) < new Date()) {
          setError("This share link has expired.");
          setIsLoading(false);
          return;
        }

        // Fetch the practice log
        const { data: logData, error: logError } = await supabase
          .from("practice_logs")
          .select("id, log_date, goals, subgoals, start_time, stop_time, warmups, scales, repertoire, notes, metronome_used")
          .eq("id", shareData.practice_log_id)
          .single();

        if (logError) throw logError;

        setPracticeLog(logData);
      } catch (err) {
        console.error("Error fetching shared log:", err);
        setError("Failed to load practice log.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchSharedLog();
  }, [token]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    const dayName = date.toLocaleDateString("en-US", { weekday: "long" }).toUpperCase();
    const formattedDate = date.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    }).toUpperCase().replace(",", "");
    return `${dayName} – ${formattedDate}`;
  };

  const calculateTotalTime = (start: string | null, stop: string | null) => {
    if (!start || !stop) return null;
    const [startHour, startMin] = start.split(":").map(Number);
    const [stopHour, stopMin] = stop.split(":").map(Number);
    let totalMinutes = (stopHour * 60 + stopMin) - (startHour * 60 + startMin);
    if (totalMinutes < 0) totalMinutes += 24 * 60;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}:${minutes.toString().padStart(2, "0")}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-display text-foreground">Share Link Error</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!practiceLog) return null;

  const totalTime = calculateTotalTime(practiceLog.start_time, practiceLog.stop_time);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground uppercase tracking-wide">
            Shared Practice Log
          </p>
          <h1 className="text-2xl md:text-3xl font-display text-foreground">
            {formatDate(practiceLog.log_date)}
          </h1>
        </div>

        {/* Goals */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-card rounded-lg p-4 shadow-sm border border-border">
            <h3 className="font-display text-sm text-muted-foreground mb-2">Main Goals</h3>
            <p className="text-foreground whitespace-pre-wrap">
              {practiceLog.goals || <span className="text-muted-foreground italic">No goals set</span>}
            </p>
          </div>
          <div className="bg-card rounded-lg p-4 shadow-sm border border-border">
            <h3 className="font-display text-sm text-muted-foreground mb-2">Subgoals</h3>
            <p className="text-foreground whitespace-pre-wrap">
              {practiceLog.subgoals || <span className="text-muted-foreground italic">No subgoals set</span>}
            </p>
          </div>
        </div>

        {/* Time Tracking */}
        <div className="bg-card rounded-lg p-4 shadow-sm border border-border">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <h3 className="font-display text-sm text-muted-foreground mb-1">Start Time</h3>
              <p className="text-foreground">{practiceLog.start_time || "—"}</p>
            </div>
            <div>
              <h3 className="font-display text-sm text-muted-foreground mb-1">Stop Time</h3>
              <p className="text-foreground">{practiceLog.stop_time || "—"}</p>
            </div>
            <div>
              <h3 className="font-display text-sm text-muted-foreground mb-1">Total Time</h3>
              <p className="text-foreground font-medium">{totalTime || "0:00"}</p>
            </div>
          </div>
        </div>

        {/* Warmups and Scales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-card rounded-lg p-4 shadow-sm border border-border">
            <h3 className="font-display text-sm text-muted-foreground mb-3">Warm-ups</h3>
            <ul className="space-y-1">
              {practiceLog.warmups?.filter(w => w).map((warmup, idx) => (
                <li key={idx} className="flex items-center gap-2 text-foreground">
                  <span className="text-muted-foreground text-sm w-4">{idx + 1}</span>
                  {warmup}
                </li>
              ))}
              {(!practiceLog.warmups || practiceLog.warmups.filter(w => w).length === 0) && (
                <li className="text-muted-foreground italic">No warm-ups recorded</li>
              )}
            </ul>
          </div>
          <div className="bg-card rounded-lg p-4 shadow-sm border border-border">
            <h3 className="font-display text-sm text-muted-foreground mb-3">Scales</h3>
            <ul className="space-y-1">
              {practiceLog.scales?.filter(s => s).map((scale, idx) => (
                <li key={idx} className="flex items-center gap-2 text-foreground">
                  <span className="text-muted-foreground text-sm w-4">{idx + 1}</span>
                  {scale}
                </li>
              ))}
              {(!practiceLog.scales || practiceLog.scales.filter(s => s).length === 0) && (
                <li className="text-muted-foreground italic">No scales recorded</li>
              )}
            </ul>
          </div>
        </div>

        {/* Repertoire and Notes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-card rounded-lg p-4 shadow-sm border border-border">
            <h3 className="font-display text-sm text-muted-foreground mb-3">Repertoire & Exercises</h3>
            <ul className="space-y-1">
              {practiceLog.repertoire?.filter(r => r).map((item, idx) => (
                <li key={idx} className="flex items-center gap-2 text-foreground">
                  <div className="w-3 h-3 rounded-full border border-muted-foreground/30" />
                  {item}
                </li>
              ))}
              {(!practiceLog.repertoire || practiceLog.repertoire.filter(r => r).length === 0) && (
                <li className="text-muted-foreground italic">No repertoire recorded</li>
              )}
            </ul>
          </div>
          <div className="space-y-4">
            <div className="bg-card rounded-lg p-4 shadow-sm border border-border">
              <h3 className="font-display text-sm text-muted-foreground mb-2">Notes & Focus</h3>
              <p className="text-foreground whitespace-pre-wrap">
                {practiceLog.notes || <span className="text-muted-foreground italic">No notes recorded</span>}
              </p>
            </div>
            {practiceLog.metronome_used && (
              <div className="bg-card rounded-lg p-4 shadow-sm border border-border">
                <p className="text-sm text-foreground">✓ Used Metronome</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Shared via Practice Log App
          </p>
        </div>
      </div>
    </div>
  );
}
