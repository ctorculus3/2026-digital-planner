import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface StudentLog {
  id: string;
  log_date: string;
  goals: string | null;
  subgoals: string | null;
  start_time: string | null;
  stop_time: string | null;
  total_time: unknown;
  warmups: string[] | null;
  scales: string[] | null;
  repertoire: string[] | null;
  repertoire_completed: boolean[] | null;
  repertoire_recordings: string[] | null;
  notes: string | null;
  metronome_used: boolean | null;
  ear_training: string[] | null;
  ear_training_completed: boolean[] | null;
  additional_tasks: string[] | null;
  additional_tasks_completed: boolean[] | null;
  music_listening: string[] | null;
  music_listening_completed: boolean[] | null;
}

interface MediaItem {
  id: string;
  media_type: string;
  file_path: string | null;
  youtube_url: string | null;
  label: string | null;
  sort_order: number;
}

interface PdfItem {
  id: string;
  file_path: string;
  file_name: string;
  sort_order: number;
}

export function useStudentLogView(studentUserId: string, logDate: string) {
  const logQuery = useQuery({
    queryKey: ["student-log-view", studentUserId, logDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("practice_logs")
        .select("*")
        .eq("user_id", studentUserId)
        .eq("log_date", logDate)
        .maybeSingle();
      if (error) throw error;
      return data as StudentLog | null;
    },
    enabled: !!studentUserId && !!logDate,
  });

  const mediaQuery = useQuery({
    queryKey: ["student-log-media", studentUserId, logDate, logQuery.data?.id],
    queryFn: async () => {
      if (!logQuery.data?.id) return [];
      const { data, error } = await supabase
        .from("practice_media")
        .select("id, media_type, file_path, youtube_url, label, sort_order")
        .eq("practice_log_id", logQuery.data.id)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data as MediaItem[]) || [];
    },
    enabled: !!logQuery.data?.id,
  });

  const pdfQuery = useQuery({
    queryKey: ["student-log-pdfs", studentUserId, logDate, logQuery.data?.id],
    queryFn: async () => {
      if (!logQuery.data?.id) return [];
      const { data, error } = await supabase
        .from("lesson_pdfs")
        .select("id, file_path, file_name, sort_order")
        .eq("practice_log_id", logQuery.data.id)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data as PdfItem[]) || [];
    },
    enabled: !!logQuery.data?.id,
  });

  return {
    practiceLog: logQuery.data ?? null,
    mediaItems: mediaQuery.data ?? [],
    pdfItems: pdfQuery.data ?? [],
    isLoading: logQuery.isLoading,
  };
}
