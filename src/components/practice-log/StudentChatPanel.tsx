import { useState, useRef, useEffect } from "react";
import { useStudentChat, type ChatMessage } from "@/hooks/useStudioChat";
import { useStudentStudio } from "@/hooks/useStudentStudio";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Send, Loader2, GraduationCap } from "lucide-react";
import { format } from "date-fns";

interface Props {
  logDate: string;
}

export function StudentChatPanel({ logDate }: Props) {
  const { studioInfo, loading: studioLoading } = useStudentStudio();
  const { messages, loading, sending, sendMessage } = useStudentChat(
    studioInfo?.studio_id,
    logDate
  );
  const [draft, setDraft] = useState("");
  const [open, setOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  // Auto-open if there are existing messages
  useEffect(() => {
    if (messages.length > 0) setOpen(true);
  }, [messages.length]);

  const handleSend = async () => {
    if (!draft.trim() || sending) return;
    const text = draft;
    setDraft("");
    await sendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Don't render if student isn't in a studio
  if (studioLoading || !studioInfo) return null;
  if (loading) return null;

  return (
    <div className="bg-primary/5 border border-primary/20 rounded-lg overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-4 py-3 text-sm font-display text-primary hover:bg-primary/10 transition-colors"
      >
        <GraduationCap className="h-4 w-4" />
        <span>Chat with {studioInfo.teacher_name || "Teacher"}</span>
        {messages.length > 0 && (
          <span className="ml-auto text-xs bg-primary/15 text-primary rounded-full px-2 py-0.5">
            {messages.length}
          </span>
        )}
      </button>

      {open && (
        <div className="border-t border-primary/20">
          {/* Messages area */}
          <div className="max-h-72 overflow-y-auto px-4 py-3 space-y-3">
            {messages.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">
                No messages yet — send a message to your teacher about this session.
              </p>
            )}
            {messages.map((msg) => (
              <ChatBubble key={msg.id} message={msg} />
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-primary/20 px-3 py-2 flex items-end gap-2">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message…"
              className="min-h-[40px] max-h-28 resize-none text-sm"
              rows={1}
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={sending || !draft.trim()}
              className="shrink-0 h-9 w-9"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Chat bubble ───────────────────────────────────────────────────────────── */

function ChatBubble({ message }: { message: ChatMessage }) {
  const isOwn = message.sender_role === "student";
  const time = format(new Date(message.created_at), "h:mm a");

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
          isOwn
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground"
        }`}
      >
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[10px] font-medium uppercase opacity-70">
            {message.sender_role}
          </span>
          <span className="text-[10px] opacity-50">{time}</span>
        </div>
        <p className="whitespace-pre-wrap break-words">{message.message}</p>
      </div>
    </div>
  );
}
