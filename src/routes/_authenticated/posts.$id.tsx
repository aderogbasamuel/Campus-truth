import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, FileQuestion } from "lucide-react";

import { AppShell } from "@/components/campus/AppShell";
import { CommentSection } from "@/components/campus/CommentSection";
import { EmptyState } from "@/components/campus/EmptyState";
import { PostCard, type FeedPost } from "@/components/campus/PostCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useSessionUser } from "@/hooks/useCampusUser";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/posts/$id")({
  head: () => ({
    meta: [
      { title: "Student post — CampusTruth" },
      {
        name: "description",
        content: "Read a student post on CampusTruth with its comments and trust badges.",
      },
      { property: "og:title", content: "Student post — CampusTruth" },
      {
        property: "og:description",
        content: "Read a student post on CampusTruth with its comments and trust badges.",
      },
    ],
  }),
  component: PostDetailPage;
});

function PostDetailPage() {
  const { id } = Route.useParams();
  const { userId } = useSessionUser();

  const post = useQuery({
    queryKey: ["post", id, userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select(
          "id, author_id, title, content, image_url, category, verified, created_at, author:profiles!posts_author_id_fkey(full_name, username, avatar_url, verified)",
        )
        .eq("id", id)
        .eq("removed", false)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;

      const [{ count: reactionCount }, { count: commentCount }] = await Promise.all([
        supabase.from("reactions").select("id", { count: "exact", head: true }).eq("post_id", id),
        supabase.from("comments").select("id", { count: "exact", head: true }).eq("post_id", id),
      ]);

      let liked = false;
      let saved = false;
      if (userId) {
        const [{ data: like }, { data: savedRow }] = await Promise.all([
          supabase
            .from("reactions")
            .select("id")
            .eq("post_id", id)
            .eq("user_id", userId)
            .maybeSingle(),
          supabase
            .from("saved_items")
            .select("id")
            .eq("item_id", id)
            .eq("item_type", "post")
            .eq("user_id", userId)
            .maybeSingle(),
        ]);
        liked = !!like;
        saved = !!savedRow;
      }

      return {
        ...(data as unknown as FeedPost),
        reaction_count: reactionCount ?? 0,
        comment_count: commentCount ?? 0,
        liked,
        saved,
      } satisfies FeedPost;
    },
  });

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl">
        <Link
          to="/home"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to feed
        </Link>

        {post.isLoading ? (
          <Skeleton className="mt-4 h-56 w-full rounded-2xl" />
        ) : post.data ? (
          <div className="mt-4 space-y-4">
            <PostCard post={post.data} currentUserId={userId} />
            <div className="surface-card p-4">
              <h2 className="text-sm font-semibold">Comments</h2>
              <CommentSection postId={post.data.id} currentUserId={userId} />
            </div>
          </div>
        ) : (
          <div className="mt-4">
            <EmptyState
              icon={FileQuestion}
              title="Post not available"
              description="This post was deleted or removed by moderators."
            />
          </div>
        )}
      </div>
    </AppShell>
  );
}
