import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImageGallery } from "./ImageGallery";
import type { CommunityPost } from "@/hooks/useCommunityPosts";

interface PostCardProps {
  post: CommunityPost;
  isOwn: boolean;
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

export function PostCard({ post, isOwn, onDelete }: PostCardProps) {
  const timeAgo = formatDistanceToNow(new Date(post.created_at), {
    addSuffix: true,
  });

  return (
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
        {isOwn && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(post.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
      <p className="text-sm text-foreground whitespace-pre-wrap break-words pl-11">
        {post.content}
      </p>
      {post.image_paths && post.image_paths.length > 0 && (
        <ImageGallery imagePaths={post.image_paths} />
      )}
    </div>
  );
}
