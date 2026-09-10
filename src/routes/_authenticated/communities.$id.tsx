import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, Users } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/campus/AppShell";
import { EmptyState } from "@/components/campus/EmptyState";
import { PostCard, type FeedPost } from "@/components/campus/PostCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSessionUser } from "@/hooks/useCampusUser";
import { supabase } from "@/integrations/supabase/client";
import { friendlyError } from "@/lib/campus";

export const Route = createFileRoute("/_authenticated/communities/$id")({
  head: () => ({
    meta: [
      { title: "Community — CampusTruth" },
      {
        name: "description",
        content: "Community posts, members and updates for your faculty, department and level.",
      },
      { property: "og:title", content: "Community — CampusTruth" },
      {
        property: "og:description",
        content: "Community posts, members and updates for your faculty, department and level.",
      },
    ],
  }),
  component: CommunityDetailPage,
});

function CommunityDetailPage() {
  const { id } = Route.useParams();
  const { userId } = useSessionUser();
  const queryClient = useQueryClient();

  const community = useQuery({
    queryKey: ["community", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("communities")
        .select("id, name, description, level, faculty_id, department_id")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const members = useQuery({
    queryKey: ["community-member-count", id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("community_members")
        .select("user_id", { count: "exact", head: true })
        .eq("community_id", id);
      if (error) throw error;
      return count ?? 0;
    },
  });

  const joined = useQuery({
    queryKey: ["community-joined", id, userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("community_members")
        .select("community_id")
        .eq("community_id", id)
        .eq("user_id", userId!)
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
  });

  const posts = useQuery({
    queryKey: ["community-posts", id, community.data?.faculty_id, community.data?.department_id, community.data?.level],
    enabled: !!community.data,
    queryFn: async () => {
      let query = supabase
        .from("posts")
        .select(
          "id, author_id, title, content, image_url, category, verified, created_at, author:profiles!posts_author_id_fkey(full_name, username, avatar_url, verified)",
        )
        .eq("removed", false)
        .order("created_at", { ascending: false })
        .limit(30);
      const record = community.data!;
      if (record.department_id) query = query.eq("department_id", record.department_id);
      else if (record.faculty_id) query = query.eq("faculty_id", record.faculty_id);
      if (record.level) query = query.eq("level", record.level);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as FeedPost[];
    },
  });

  const toggle = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("Please sign in first.");
      if (joined.data) {
        const { error } = await supabase
          .from("community_members")
          .delete()
          .eq("community_id", id)
          .eq("user_id", userId);
        if (error) throw error;
        return "left" as const;
      }
      const { error } = await supabase
        .from("community_members")
        .insert({ community_id: id, user_id: userId });
      if (error) throw error;
      return "joined" as const;
    },
    onSuccess: (result) => {
      toast.success(result === "joined" ? "Joined the community" : "Left the community");
      queryClient.invalidateQueries({ queryKey: ["community-joined", id] });
      queryClient.invalidateQueries({ queryKey: ["community-member-count", id] });
      queryClient.invalidateQueries({ queryKey: ["community-members"] });
    },
    onError: (error) => toast.error(friendlyError(error)),
  });

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl">
        <Link
          to="/communities"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          All communities
        </Link>

        {community.isLoading ? (
          <Skeleton className="mt-4 h-28 w-full rounded-2xl" />
        ) : community.data ? (
          <div className="surface-card mt-4 flex flex-wrap items-start gap-3 p-5">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-lime-soft text-primary">
              <Users className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-bold">{community.data.name}</h1>
              {community.data.description ? (
                <p className="mt-1 text-sm text-muted-foreground">{community.data.description}</p>
              ) : null}
              <p className="mt-2 text-xs text-muted-foreground">
                {members.data ?? 0} member{members.data === 1 ? "" : "s"}
                {community.data.level ? ` · ${community.data.level} level` : ""}
              </p>
            </div>
            <Button
              variant={joined.data ? "secondary" : "default"}
              onClick={() => toggle.mutate()}
              disabled={toggle.isPending}
            >
              {joined.data ? "Joined" : "Join"}
            </Button>
          </div>
        ) : (
          <EmptyState
            icon={Users}
            title="Community not found"
            description="This community may have been removed. Browse the full list instead."
          />
        )}

        <h2 className="mt-8 text-base font-semibold">Posts from this group</h2>
        {posts.isLoading ? (
          <div className="mt-3 space-y-3">
            {[0, 1].map((key) => (
              <Skeleton key={key} className="h-40 w-full rounded-2xl" />
            ))}
          </div>
        ) : posts.data && posts.data.length > 0 ? (
          <div className="mt-3 space-y-4">
            {posts.data.map((post) => (
              <PostCard key={post.id} post={post} currentUserId={userId} />
            ))}
          </div>
        ) : (
          <div className="mt-3">
            <EmptyState
              icon={Users}
              title="No posts yet"
              description="Be the first to share something useful with this group from the home feed."
            />
          </div>
        )}
      </div>
    </AppShell>
  );
}
