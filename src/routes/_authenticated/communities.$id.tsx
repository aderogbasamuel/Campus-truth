import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, Check, Loader2, Users } from "lucide-react";
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

  const memberCount = members.data ?? 0;

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl">
        <Link
          to="/communities"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary/70 hover:text-primary"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          All communities
        </Link>

        {community.isLoading ? (
          <Skeleton className="mt-4 h-32 w-full rounded-3xl" />
        ) : community.isError ? (
          <div className="mt-4">
            <EmptyState
              icon={Users}
              title="We couldn't load this community"
              description="Check your connection and try again."
              action={<Button onClick={() => community.refetch()}>Try again</Button>}
            />
          </div>
        ) : community.data ? (
          <>
            {/* header */}
            <section className="mt-4 flex flex-wrap items-start gap-4 rounded-3xl border border-primary/15 bg-white p-5 sm:p-6">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                <Users className="size-6" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl font-semibold leading-snug tracking-tight">
                  {community.data.name}
                </h1>
                {community.data.description ? (
                  <p className="mt-1.5 text-sm leading-relaxed text-primary/70">
                    {community.data.description}
                  </p>
                ) : null}
                <p className="mt-3 flex flex-wrap items-center gap-2 text-sm text-primary/60">
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium tabular-nums text-primary/70">
                    {memberCount} member{memberCount === 1 ? "" : "s"}
                  </span>
                  {community.data.level ? (
                    <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-primary/70">
                      {community.data.level} level
                    </span>
                  ) : null}
                </p>
              </div>
              <Button
                variant={joined.data ? "outline" : "default"}
                className={
                  joined.data
                    ? "w-full rounded-full border-primary/20 bg-transparent hover:bg-primary/5 sm:w-auto"
                    : "w-full rounded-full bg-accent text-accent-foreground hover:bg-accent/90 sm:w-auto"
                }
                onClick={() => toggle.mutate()}
                disabled={toggle.isPending || joined.isLoading}
                aria-pressed={!!joined.data}
              >
                {toggle.isPending ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : joined.data ? (
                  <Check className="size-4" aria-hidden="true" />
                ) : null}
                {joined.data ? "Joined" : "Join"}
              </Button>
            </section>

            {/* posts only make sense once we know the community exists */}
            <section aria-labelledby="group-posts-heading" className="mt-8">
              <h2 id="group-posts-heading" className="text-lg font-semibold tracking-tight">
                Posts from this group
              </h2>
              {posts.isLoading ? (
                <div className="mt-3 space-y-3">
                  {[0, 1].map((key) => (
                    <Skeleton key={key} className="h-40 w-full rounded-3xl" />
                  ))}
                </div>
              ) : posts.isError ? (
                <div className="mt-3">
                  <EmptyState
                    icon={Users}
                    title="We couldn't load posts"
                    description="Check your connection and try again."
                    action={<Button onClick={() => posts.refetch()}>Try again</Button>}
                  />
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
            </section>
          </>
        ) : (
          <div className="mt-4">
            <EmptyState
              icon={Users}
              title="Community not found"
              description="This community may have been removed. Browse the full list instead."
              action={
                <Button asChild variant="outline">
                  <Link to="/communities">Browse communities</Link>
                </Button>
              }
            />
          </div>
        )}
      </div>
    </AppShell>
  );
}