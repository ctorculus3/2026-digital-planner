import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface PostComposerProps {
  onPostCreated: () => void;
}

export function PostComposer({ onPostCreated }: PostComposerProps) {
  const { session } = useAuth();
  const { toast } = useToast();
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const charCount = content.trim().length;
  const canSubmit = charCount > 0 && charCount <= 500 && !submitting;

  const invokeWithTimeout = async (trimmedContent: string) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);
    try {
      const result = await supabase.functions.invoke("moderate-and-post", {
        headers: { Authorization: `Bearer ${session!.access_token}` },
        body: { content: trimmedContent },
      });
      clearTimeout(timeoutId);
      return result;
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit || !session) return;

    setSubmitting(true);
    const trimmedContent = content.trim();

    let data: any = null;
    let error: any = null;
    let timedOut = false;

    try {
      const result = await invokeWithTimeout(trimmedContent);
      data = result.data;
      error = result.error;
    } catch (err: any) {
      if (err?.name === "AbortError" || err?.message?.includes("abort")) {
        // First attempt timed out — retry once
        try {
          const result = await invokeWithTimeout(trimmedContent);
          data = result.data;
          error = result.error;
        } catch (retryErr: any) {
          timedOut = true;
        }
      } else {
        error = err;
      }
    }

    if (timedOut) {
      toast({
        title: "Taking longer than expected",
        description: "The server is busy. Please try again in a moment.",
        variant: "destructive",
      });
      setSubmitting(false);
      return;
    }

    if (error) {
      toast({
        title: "Error",
        description: "Failed to submit post. Please try again.",
        variant: "destructive",
      });
      setSubmitting(false);
      return;
    }

    if (data && !data.success) {
      toast({
        title: data.moderation_rejected ? "Post not approved" : "Cannot post",
        description: data.error || "Something went wrong.",
        variant: "destructive",
      });
      setSubmitting(false);
      return;
    }

    setContent("");
    onPostCreated();
    toast({
      title: "Posted!",
      description: "Your post has been shared with the community.",
    });
    setSubmitting(false);
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <Textarea
        placeholder="Share a thought with the community…"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        maxLength={500}
        className="min-h-[80px] resize-none bg-background"
        disabled={submitting}
      />
      <div className="flex items-center justify-between">
        <span
          className={`text-xs ${
            charCount > 450
              ? charCount > 500
                ? "text-destructive"
                : "text-primary"
              : "text-muted-foreground"
          }`}
        >
          {charCount}/500
        </span>
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="gap-1.5"
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          Post
        </Button>
      </div>
    </div>
  );
}
