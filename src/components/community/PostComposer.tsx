import { useState, useRef } from "react";
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
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

interface SelectedImage {
  file: File;
  preview: string;
}

export function PostComposer({ onPostCreated }: PostComposerProps) {
  const { session, user } = useAuth();
  const { toast } = useToast();
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [images, setImages] = useState<SelectedImage[]>([]);
  const [inputKey, setInputKey] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const charCount = content.trim().length;
  const hasText = charCount > 0;
  const hasImages = images.length > 0;
  const canSubmit = (hasText || hasImages) && charCount <= 500 && !submitting;

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) {
      toast({ title: "Maximum images reached", description: `You can attach up to ${MAX_IMAGES} images.` });
      return;
    }

    const toAdd: SelectedImage[] = [];
    for (const file of files.slice(0, remaining)) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        toast({ title: "Invalid format", description: `${file.name} is not a supported image format.`, variant: "destructive" });
        continue;
      }
      if (file.size > MAX_IMAGE_SIZE) {
        toast({ title: "File too large", description: `${file.name} exceeds the 5MB limit.`, variant: "destructive" });
        continue;
      }
      toAdd.push({ file, preview: URL.createObjectURL(file) });
    }

    setImages((prev) => [...prev, ...toAdd]);
    // Reset input so re-selecting the same file works
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      const removed = prev[index];
      URL.revokeObjectURL(removed.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const uploadImages = async (userId: string): Promise<string[]> => {
    const timestamp = Date.now();
    const uploads = images.map(async (img, i) => {
      const ext = img.file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${userId}/${timestamp}-${i}.${ext}`;
      const { error } = await supabase.storage
        .from("community-images")
        .upload(path, img.file, { contentType: img.file.type });
      if (error) throw new Error(`Failed to upload image ${i + 1}: ${error.message}`);
      return path;
    });
    return Promise.all(uploads);
  };

  const cleanupImages = async (paths: string[]) => {
    if (paths.length === 0) return;
    await supabase.storage.from("community-images").remove(paths);
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    if (!session || !user) {
      toast({ title: "Session expired", description: "Please refresh the page and try again.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    let uploadedPaths: string[] = [];

    try {
      // Upload images first
      if (hasImages) {
        uploadedPaths = await uploadImages(user.id);
      }

      const body: Record<string, unknown> = {};
      if (hasText) body.content = content.trim();
      if (uploadedPaths.length > 0) body.image_paths = uploadedPaths;

      const { data, error } = await supabase.functions.invoke("moderate-and-post", {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body,
      });

      if (error) {
        await cleanupImages(uploadedPaths);
        toast({ title: "Error", description: "Failed to submit post. Please try again.", variant: "destructive" });
        return;
      }

      if (data?.error) {
        await cleanupImages(uploadedPaths);
        toast({
          title: data.moderation_rejected ? "Post not approved" : "Error",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      // Success — clear form
      setContent("");
      images.forEach((img) => URL.revokeObjectURL(img.preview));
      setImages([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setInputKey(prev => prev + 1);
      onPostCreated();
      toast({ title: "Posted!", description: "Your post has been shared with the community." });
    } catch (err) {
      console.error("Post submission error:", err);
      await cleanupImages(uploadedPaths);
      toast({ title: "Error", description: "Something went wrong. Please try again.", variant: "destructive" });
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
        <div className="flex gap-2 flex-wrap">
          {images.map((img, i) => (
            <div key={i} className="relative group">
              <img
                src={img.preview}
                alt={`Selected ${i + 1}`}
                className="h-16 w-16 rounded-md object-cover border border-border"
              />
              <button
                type="button"
                onClick={() => removeImage(i)}
                disabled={submitting}
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
          {images.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {images.length}/{MAX_IMAGES} images
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <input
            key={inputKey}
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES.join(",")}
            multiple
            className="hidden"
            onChange={handleImageSelect}
            disabled={submitting || images.length >= MAX_IMAGES}
          />
          <Button
            variant="ghost"
            size="sm"
            type="button"
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.click();
              } else {
                console.warn("PostComposer: fileInputRef is null");
                toast({ title: "Please try again", description: "The image picker wasn't ready. Tap the button once more.", variant: "destructive" });
              }
            }}
            disabled={submitting || images.length >= MAX_IMAGES}
          >
            <ImagePlus className="h-4 w-4" />
          </Button>
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
    </div>
  );
}
