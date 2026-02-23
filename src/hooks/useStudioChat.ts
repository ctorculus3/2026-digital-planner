import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ChatMessage {
  id: string;
  studio_id: string;
  student_user_id: string;
  log_date: string;
  sender_role: "teacher" | "student";
  message: string;
  created_at: string;
}

// ── Teacher-side hook ───────────────────────────────────────────────────────
export function useTeacherChat(
  studioId: string | undefined,
  studentUserId: string,
  logDate: string
) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetchMessages = useCallback(async () => {
    if (!studioId || !studentUserId || !logDate) {
      setMessages([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from("studio_chat_messages")
        .select("*")
        .eq("studio_id", studioId)
        .eq("student_user_id", studentUserId)
        .eq("log_date", logDate)
        .order("created_at", { ascending: true });
      if (error) throw error;
      setMessages((data as ChatMessage[]) || []);
    } catch (err) {
      console.error("Error fetching chat messages:", err);
    } finally {
      setLoading(false);
    }
  }, [studioId, studentUserId, logDate]);

  // Initial fetch + realtime subscription
  useEffect(() => {
    fetchMessages();

    if (!studioId || !studentUserId || !logDate) return;

    const channelName = `studio-chat-teacher-${studioId}-${studentUserId}-${logDate}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes" as any,
        {
          event: "INSERT",
          schema: "public",
          table: "studio_chat_messages",
          filter: `studio_id=eq.${studioId}`,
        },
        (payload: any) => {
          const newMsg = payload.new as ChatMessage;
          if (
            newMsg.student_user_id === studentUserId &&
            newMsg.log_date === logDate
          ) {
            setMessages((prev) => [...prev, newMsg]);
          }
        }
      )
      .subscribe();

    channelRef.current = channel;
    return () => {
      channel.unsubscribe();
    };
  }, [fetchMessages, studioId, studentUserId, logDate]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!studioId || !studentUserId || !logDate || !user || !text.trim()) return false;
      setSending(true);
      try {
        const { error } = await (supabase as any)
          .from("studio_chat_messages")
          .insert({
            studio_id: studioId,
            student_user_id: studentUserId,
            log_date: logDate,
            sender_role: "teacher",
            message: text.trim(),
          });
        if (error) throw error;
        return true;
      } catch (err) {
        console.error("Error sending chat message:", err);
        return false;
      } finally {
        setSending(false);
      }
    },
    [studioId, studentUserId, logDate, user]
  );

  return { messages, loading, sending, sendMessage, refetch: fetchMessages };
}

// ── Student-side hook ───────────────────────────────────────────────────────
export function useStudentChat(
  studioId: string | undefined,
  logDate: string
) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetchMessages = useCallback(async () => {
    if (!user || !studioId || !logDate) {
      setMessages([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from("studio_chat_messages")
        .select("*")
        .eq("studio_id", studioId)
        .eq("student_user_id", user.id)
        .eq("log_date", logDate)
        .order("created_at", { ascending: true });
      if (error) throw error;
      setMessages((data as ChatMessage[]) || []);
    } catch (err) {
      console.error("Error fetching chat messages:", err);
    } finally {
      setLoading(false);
    }
  }, [user, studioId, logDate]);

  // Initial fetch + realtime subscription
  useEffect(() => {
    fetchMessages();

    if (!user || !studioId || !logDate) return;

    const channelName = `studio-chat-student-${user.id}-${studioId}-${logDate}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes" as any,
        {
          event: "INSERT",
          schema: "public",
          table: "studio_chat_messages",
          filter: `student_user_id=eq.${user.id}`,
        },
        (payload: any) => {
          const newMsg = payload.new as ChatMessage;
          if (newMsg.log_date === logDate && newMsg.studio_id === studioId) {
            setMessages((prev) => [...prev, newMsg]);
          }
        }
      )
      .subscribe();

    channelRef.current = channel;
    return () => {
      channel.unsubscribe();
    };
  }, [fetchMessages, user, studioId, logDate]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!user || !studioId || !logDate || !text.trim()) return false;
      setSending(true);
      try {
        const { error } = await (supabase as any)
          .from("studio_chat_messages")
          .insert({
            studio_id: studioId,
            student_user_id: user.id,
            log_date: logDate,
            sender_role: "student",
            message: text.trim(),
          });
        if (error) throw error;
        return true;
      } catch (err) {
        console.error("Error sending chat message:", err);
        return false;
      } finally {
        setSending(false);
      }
    },
    [user, studioId, logDate]
  );

  return { messages, loading, sending, sendMessage, refetch: fetchMessages };
}
