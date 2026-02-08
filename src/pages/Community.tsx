import { ScallopHeader } from "@/components/practice-log/ScallopHeader";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { UserMenu } from "@/components/practice-log/UserMenu";
import { ManageSubscription } from "@/components/subscription/ManageSubscription";
import { PostComposer } from "@/components/community/PostComposer";
import { PostFeed } from "@/components/community/PostFeed";
import { StreakGateBanner } from "@/components/community/StreakGateBanner";
import { useCommunityPosts } from "@/hooks/useCommunityPosts";
import { useUserStreak } from "@/hooks/useUserStreak";
import { useUserRole } from "@/hooks/useUserRole";

export default function Community() {
  const { posts, loading: postsLoading, refetch, currentUserId } = useCommunityPosts();
  const { streak, loading: streakLoading } = useUserStreak();
  const { isModerator } = useUserRole();

  const canPost = streak >= 10;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ScallopHeader />

      {/* Top bar with nav + user controls */}
      <div className="bg-[hsl(var(--time-section-bg))] border-b border-border">
        <div className="flex items-center justify-between px-4">
          <DashboardNav />
          <div className="flex items-center gap-2">
            <ManageSubscription />
            <UserMenu />
          </div>
        </div>
      </div>

      {/* Community Content */}
      <main className="flex-1 p-4 md:p-8 max-w-3xl mx-auto w-full space-y-6">
        <h1 className="text-2xl font-display font-bold text-foreground">
          Community
        </h1>

        {/* Streak gate or composer */}
        {!streakLoading && (
          canPost ? (
            <PostComposer onPostCreated={refetch} />
          ) : (
            <StreakGateBanner streak={streak} />
          )
        )}

        {/* Post feed */}
        <PostFeed
          posts={posts}
          loading={postsLoading}
          currentUserId={currentUserId}
          isModerator={isModerator}
          onPostDeleted={refetch}
        />
      </main>
    </div>
  );
}
