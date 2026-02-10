import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, ImagePlus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface PostComposerProps {
  onPostCreated: () => void;
}

const MAX_IMAGES = 5;

export function PostComposer({ onPostCreated }: PostComposerProps) {
  const { session, user } = useAuth();
  const { toast } = useToast();
  const [content, setContent] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [inputKey, setInputKey] = useState(0);

  const charCount = content.trim().length;
  const hasText = charCount > 0 && charCount <= 500;
  const hasImages = images.length > 0;
  const canSubmit = (hasText || hasImages) && !submitting;

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) {
      toast({ title: `Max ${MAX_IMAGES} images`, variant: "destructive" });
      return;
    }
    const toAdd = files.slice(0, remaining);
    setImages((prev) => [...prev, ...toAdd]);
    // Reset input so re-selecting same file works
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (userId: string): Promise<string[]> => {
    const paths: string[] = [];
    for (const file of images) {
      const ext = file.name.split(".").pop() || "jpg";
      const filePath = `${userId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from("community-images")
        .upload(filePath, file);
      if (error) throw error;
      paths.push(filePath);
    }
    return paths;
  };

  const cleanupImages = async (paths: string[]) => {
    if (paths.length > 0) {
      await supabase.storage.from("community-images").remove(paths);
    }
  };

  const invokeWithTimeout = async (body: Record<string, unknown>) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);
    try {
      const result = await supabase.functions.invoke("moderate-and-post", {
        headers: { Authorization: `Bearer ${session!.access_token}` },
        body,
      });
      clearTimeout(timeoutId);
      return result;
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit || !session || !user) return;

    setSubmitting(true);
    const trimmedContent = content.trim();
    let uploadedPaths: string[] = [];

    try {
      // Upload images first
      if (images.length > 0) {
        uploadedPaths = await uploadImages(user.id);
      }

      const body: Record<string, unknown> = { content: trimmedContent };
      if (uploadedPaths.length > 0) {
        body.image_paths = uploadedPaths;
      }

      let data: any = null;
      let error: any = null;
      let timedOut = false;

      try {
        const result = await invokeWithTimeout(body);
        data = result.data;
        error = result.error;
      } catch (err: any) {
        if (err?.name === "AbortError" || err?.message?.includes("abort")) {
          try {
            const result = await invokeWithTimeout(body);
            data = result.data;
            error = result.error;
          } catch {
            timedOut = true;
          }
        } else {
          error = err;
        }
      }

      if (timedOut) {
        await cleanupImages(uploadedPaths);
        toast({
          title: "Taking longer than expected",
          description: "The server is busy. Please try again in a moment.",
          variant: "destructive",
        });
        setSubmitting(false);
        return;
      }

      if (error) {
        await cleanupImages(uploadedPaths);
        toast({
          title: "Error",
          description: "Failed to submit post. Please try again.",
          variant: "destructive",
        });
        setSubmitting(false);
        return;
      }

      if (data && !data.success) {
        await cleanupImages(uploadedPaths);
        toast({
          title: data.moderation_rejected ? "Post not approved" : "Cannot post",
          description: data.error || "Something went wrong.",
          variant: "destructive",
        });
        setSubmitting(false);
        return;
      }

      setContent("");
      setImages([]);
      setInputKey((k) => k + 1);
      onPostCreated();
      toast({
        title: "Posted!",
        description: "Your post has been shared with the community.",
      });
    } catch (err) {
      await cleanupImages(uploadedPaths);
      toast({
        title: "Upload failed",
        description: "Could not upload images. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
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

      {/* Image previews */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((file, i) => (
            <div key={i} className="relative group w-16 h-16">
              <img
                src={URL.createObjectURL(file)}
                alt={`Preview ${i + 1}`}
                className="w-16 h-16 object-cover rounded-md border border-border"
              />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <label
            htmlFor={`image-input-${inputKey}`}
            className={`inline-flex items-center justify-center h-8 w-8 rounded-md cursor-pointer text-muted-foreground hover:text-foreground hover:bg-accent transition-colors ${
              images.length >= MAX_IMAGES ? "opacity-50 pointer-events-none" : ""
            }`}
            title={`Attach images (${images.length}/${MAX_IMAGES})`}
          >
            <ImagePlus className="h-4 w-4" />
          </label>
          <input
            key={inputKey}
            id={`image-input-${inputKey}`}
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={handleImageSelect}
            disabled={submitting || images.length >= MAX_IMAGES}
          />
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
        </div>
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
