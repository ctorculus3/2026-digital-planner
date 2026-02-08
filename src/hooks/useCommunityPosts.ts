import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface CommunityPost {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  display_name: string | null;
  avatar_url: string | null;
  image_paths: string[] | null;
}

export function useCommunityPosts() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch posts with profile data via a join
      const { data, error } = await supabase
        .from("community_posts")
        .select("id, user_id, content, created_at, image_paths")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("Error fetching posts:", error);
        return;
      }

      if (!data || data.length === 0) {
        setPosts([]);
        return;
      }

      // Get unique user IDs and fetch profiles
      const userIds = [...new Set(data.map((p) => p.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", userIds);

      const profileMap = new Map(
        (profiles || []).map((p: any) => [p.id, { display_name: p.display_name, avatar_url: p.avatar_url }])
      );

      const enriched: CommunityPost[] = data.map((post) => {
        const profile = profileMap.get(post.user_id);
        return {
          ...post,
          display_name: profile?.display_name || null,
          avatar_url: profile?.avatar_url || null,
          image_paths: (post as any).image_paths || null,
        };
      });

      setPosts(enriched);
    } catch (err) {
      console.error("Error fetching community posts:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Realtime subscription
  useEffect(() => {
    fetchPosts();

    const channel = supabase
      .channel("community-posts-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "community_posts" },
        () => {
          // Refetch on any change to get profile data too
          fetchPosts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPosts]);

  return { posts, loading, refetch: fetchPosts, currentUserId: user?.id };
}
