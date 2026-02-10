import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import type { CommunityPost } from "@/hooks/useCommunityPosts";

interface PostCardProps {
  post: CommunityPost;
  isOwn: boolean;
  isModerator?: boolean;
  onDelete: (postId: string) => void;
}

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function getImageUrl(path: string): string {
  const { data } = supabase.storage.from("community-images").getPublicUrl(path);
  return data.publicUrl;
}

export function PostCard({ post, isOwn, isModerator = false, onDelete }: PostCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const timeAgo = formatDistanceToNow(new Date(post.created_at), {
    addSuffix: true,
  });

  const canDelete = isOwn || isModerator;
  const images = post.image_paths || [];

  return (
    <>
      <div className="rounded-lg border border-border bg-card p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              {post.avatar_url && (
                <AvatarImage src={post.avatar_url} alt={post.display_name || "User"} />
              )}
              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                {getInitials(post.display_name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {post.display_name || "Anonymous"}
              </p>
              <p className="text-xs text-muted-foreground">{timeAgo}</p>
            </div>
          </div>
          {canDelete && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
              onClick={() => setConfirmOpen(true)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        {post.content && (
          <p className="text-sm text-foreground whitespace-pre-wrap break-words pl-11">
            {post.content}
          </p>
        )}

        {/* Image gallery */}
        {images.length > 0 && (
          <div
            className={`pl-11 grid gap-1.5 ${
              images.length === 1
                ? "grid-cols-1"
                : "grid-cols-2"
            }`}
          >
            {images.map((path, i) => (
              <img
                key={path}
                src={getImageUrl(path)}
                alt={`Post image ${i + 1}`}
                className="w-full rounded-md object-cover cursor-pointer hover:opacity-90 transition-opacity border border-border"
                style={{ maxHeight: images.length === 1 ? "20rem" : "10rem" }}
                onClick={() => setLightboxIndex(i)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      <Dialog open={lightboxIndex !== null} onOpenChange={() => setLightboxIndex(null)}>
        <DialogContent className="max-w-3xl p-2 bg-background/95">
          <DialogTitle className="sr-only">Image preview</DialogTitle>
          <DialogDescription className="sr-only">Full size image from community post</DialogDescription>
          {lightboxIndex !== null && images[lightboxIndex] && (
            <img
              src={getImageUrl(images[lightboxIndex])}
              alt="Full size"
              className="w-full h-auto max-h-[80vh] object-contain rounded"
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete post?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The post will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => onDelete(post.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
