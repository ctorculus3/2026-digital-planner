// Web Speech API - use `any` to avoid missing TS types for webkit prefix

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Sparkles, Send, X, Loader2, Mic, Volume2, Square } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";

type Msg = { role: "user" | "assistant"; content: string };

interface MusicAIProps {
  journalContext?: {
    goals: string;
    repertoire: string[];
    notes: string;
  };
}

const SUGGESTIONS = [
  "What is the circle of fifths?",
  "Explain a whole tone scale",
  "Suggest warm-up exercises",
  "How do I practice sight-reading?",
];

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/music-ai`;
const TTS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`;

export function MusicAI({ journalContext }: MusicAIProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);
  const [loadingTtsIdx, setLoadingTtsIdx] = useState<number | null>(null);
  const [ttsDisabled, setTtsDisabled] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const { toast } = useToast();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const SpeechRecognitionAPI =
    typeof window !== "undefined"
      ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      : null;

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    return audioContextRef.current;
  }, []);

  const cleanupAudio = useCallback(() => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
      } catch {
        // already stopped
      }
      sourceNodeRef.current = null;
    }
    setSpeakingIdx(null);
  }, []);

  const speakMessage = useCallback(
    async (text: string, idx: number) => {
      const ctx = getAudioContext();
      await ctx.resume(); // unlock during user gesture
      cleanupAudio();

      setLoadingTtsIdx(idx);
      try {
        const resp = await fetch(TTS_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text }),
        });

        if (!resp.ok) {
          const errBody = await resp.json().catch(() => ({}));
          if (errBody.quota_exceeded) {
            setTtsDisabled(true);
            toast({
              title: "Voice Limit Reached",
              description: "Monthly voice playback limit reached. It will reset next month.",
              variant: "destructive",
            });
            cleanupAudio();
            return;
          }
          throw new Error(`TTS failed: ${resp.status}`);
        }

        const arrayBuffer = await resp.arrayBuffer();
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        sourceNodeRef.current = source;
        setSpeakingIdx(idx);

        source.onended = () => {
          cleanupAudio();
        };

        source.start();
      } catch (e: any) {
        console.error("TTS error:", e);
        toast({
          title: "Voice Error",
          description: "Failed to generate speech",
          variant: "destructive",
        });
        cleanupAudio();
      } finally {
        setLoadingTtsIdx(null);
      }
    },
    [getAudioContext, cleanupAudio, toast]
  );

  const stopSpeaking = useCallback(() => {
    cleanupAudio();
  }, [cleanupAudio]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    if (!SpeechRecognitionAPI) return;
    const recognition = new SpeechRecognitionAPI();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0]?.[0]?.transcript;
      if (transcript) {
        send(transcript);
      }
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Check TTS quota on mount
  useEffect(() => {
    const checkQuota = async () => {
      try {
        const { data } = await supabase.rpc("get_tts_usage_this_month" as any);
        if (typeof data === "number" && data >= 6000) {
          setTtsDisabled(true);
        }
      } catch {}
    };
    checkQuota();
  }, []);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      cleanupAudio();
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
    };
  }, [cleanupAudio]);

  const send = async (text: string) => {
    if (!text.trim() || isLoading) return;
    // Unlock AudioContext during the user gesture (click)
    const ctx = getAudioContext();
    ctx.resume().catch(() => {});

    const userMsg: Msg = { role: "user", content: text.trim() };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput("");
    setIsLoading(true);

    let assistantSoFar = "";
    const upsert = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, content: assistantSoFar } : m
          );
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: allMessages,
          journalContext,
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Request failed" }));
        toast({
          title:
            resp.status === 429
              ? "Rate Limited"
              : resp.status === 402
              ? "Credits Exhausted"
              : "Error",
          description: err.error || "Something went wrong",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) upsert(content);
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }

      // flush remaining
      if (buffer.trim()) {
        for (let raw of buffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) upsert(content);
          } catch {}
        }
      }

      // Auto-speak the completed response
      if (autoSpeak && !ttsDisabled && assistantSoFar.trim()) {
        const assistantIdx = allMessages.length;
        speakMessage(assistantSoFar, assistantIdx);
      }
    } catch (e) {
      console.error("MusicAI error:", e);
      toast({
        title: "Error",
        description: "Failed to get AI response",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  if (!open) {
    return (
      <div className="rounded-lg p-3 shadow-sm border border-border bg-[hsl(var(--time-section-bg))]">
        <Button
          variant="ghost"
          onClick={() => setOpen(true)}
          className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
        >
          <Sparkles className="w-4 h-4" />
          <span className="font-display text-sm">Music AI Assistant</span>
        </Button>
      </div>
    );
  }

  return (
    <div
      className="bg-card rounded-lg shadow-sm border border-border flex flex-col"
      style={{ height: "420px" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="font-display text-sm text-foreground">Music AI</span>
        </div>
        <div className="flex items-center gap-2">
          {!ttsDisabled && (
            <label className="flex items-center gap-1.5 cursor-pointer" title="Auto-speak responses">
              <Volume2 className="w-3 h-3 text-muted-foreground" />
              <Switch
                checked={autoSpeak}
                onCheckedChange={setAutoSpeak}
                className="scale-75"
              />
            </label>
          )}
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setOpen(false)}>
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Ask me anything about music theory or practice!
            </p>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-xs px-2 py-1 rounded-full border border-border bg-background text-foreground hover:bg-accent transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "text-right" : ""}>
            <div
              className={`inline-block text-sm rounded-lg px-3 py-2 max-w-[90%] text-left ${
                m.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/30 text-foreground"
              }`}
            >
              {m.role === "assistant" ? (
                <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>
              ) : (
                m.content
              )}
            </div>
            {/* TTS controls for assistant messages */}
            {m.role === "assistant" && !isLoading && !ttsDisabled && (
              <div className="mt-1">
                {speakingIdx === i ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={stopSpeaking}
                    title="Stop speaking"
                  >
                    <Square className="w-3 h-3 text-destructive" />
                  </Button>
                ) : loadingTtsIdx === i ? (
                  <Loader2 className="w-3 h-3 animate-spin text-muted-foreground ml-1" />
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => speakMessage(m.content, i)}
                    title="Read aloud"
                  >
                    <Volume2 className="w-3 h-3 text-muted-foreground" />
                  </Button>
                )}
              </div>
            )}
          </div>
        ))}
        {isLoading && messages[messages.length - 1]?.role === "user" && (
          <div className="flex items-center gap-1 text-muted-foreground">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span className="text-xs">Thinking...</span>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-2 border-t border-border">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about music theory..."
            className="flex-1 h-8 text-sm"
            disabled={isLoading}
          />
          {SpeechRecognitionAPI && (
            <Button
              type="button"
              size="icon"
              variant={isListening ? "default" : "ghost"}
              className={`h-8 w-8 shrink-0 ${
                isListening ? "animate-pulse bg-destructive hover:bg-destructive/90" : ""
              }`}
              onClick={toggleListening}
              disabled={isLoading}
            >
              <Mic className="w-3.5 h-3.5" />
            </Button>
          )}
          <Button
            type="submit"
            size="icon"
            className="h-8 w-8 shrink-0"
            disabled={isLoading || !input.trim()}
          >
            <Send className="w-3.5 h-3.5" />
          </Button>
        </form>
      </div>
    </div>
  );
}
