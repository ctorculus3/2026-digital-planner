import { PostCard } from "./PostCard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, MessageSquare } from "lucide-react";
import type { CommunityPost } from "@/hooks/useCommunityPosts";

interface PostFeedProps {
  posts: CommunityPost[];
  loading: boolean;
  currentUserId?: string;
  isModerator?: boolean;
  onPostDeleted: () => void;
}

export function PostFeed({ posts, loading, currentUserId, isModerator = false, onPostDeleted }: PostFeedProps) {
  const { toast } = useToast();

  const handleDelete = async (postId: string) => {
    const { error } = await supabase
      .from("community_posts")
      .delete()
      .eq("id", postId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete post.",
        variant: "destructive",
      });
      return;
    }

    onPostDeleted();
    toast({ title: "Post deleted" });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12 space-y-2">
        <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">
          No posts yet. Be the first to share!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          isOwn={post.user_id === currentUserId}
          isModerator={isModerator}
          onDelete={handleDelete}
        />
      ))}
    </div>
  );
}
