import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Bookmark, Newspaper } from "lucide-react";

import { AppShell, PageHeading } from "@/components/campus/AppShell";
import { EmptyState } from "@/components/campus/EmptyState";
import { CardSkeletonList } from "@/components/campus/LoadingSkeleton";
import { PostCard, type FeedPost } from "@/components/campus/PostCard";
import { Button } from "@/components/ui/button";
import { useSessionUser } from "@/hooks/useCampusUser";
import { supabase } from "@/integrations/supabase/client";
import { timeAgo } from "@/lib/campus";

export const Route = createFileRoute("/_authenticated/saved")({
  head: () => ({
    meta: [
      { title: "Saved — CampusTruth" },
      {
        name: "description",
        content: "Everything you bookmarked: verified campus updates and student posts.",
      },
      { property: "og:title", content: "Saved — CampusTruth" },
      {
        property: "og:description",
        content: "Everything you bookmarked: verified campus updates and student posts.",
      },
    ],
  }),
  component: SavedPage,
});

function SavedPage() {
  const { userId } = useSessionUser();

  const saved = useQuery({
    queryKey: ["saved", "list", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data: items, error } = await supabase
        .from("saved_items")
        .select("id, item_type, item_id, created_at")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;

      const postIds = (items ?? []).filter((i) => i.item_type === "post").map((i) => i.item_id);
      const announcementIds = (items ?? [])
        .filter((i) => i.item_type === "announcement")
        .map((i) => i.item_id);

      const [postsRes, announcementsRes] = await Promise.all([
        postIds.length
          ? supabase
              .from("posts")
              .select(
                "id, author_id, title, content, image_url, category, verified, created_at, author:profiles!posts_author_id_fkey(full_name, username, avatar_url, verified)",
              )
              .in("id", postIds)
              .eq("removed", false)
          : Promise.resolve({ data: [] as any[] }),
        announcementIds.length
          ? supabase
              .from("announcements")
              .select("id, title, content, source_name, published_at")
              .in("id", announcementIds)
          : Promise.resolve({ data: [] as any[] }),
      ]);

      return {
        posts: ((postsRes.data ?? []) as unknown as FeedPost[]).map((post) => ({
          ...post,
          saved: true,
        })),
        announcements: (announcementsRes.data ?? []) as {
          id: string;
          title: string;
          content: string;
          source_name: string | null;
          published_at: string;
        }[],
      };
    },
  });

  const isEmpty =
    !saved.isLoading && !saved.data?.posts.length && !saved.data?.announcements.length;

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl">
        <PageHeading title="Saved" description="Your bookmarked updates and posts, in one place." />

        {saved.isLoading ? (
          <CardSkeletonList count={3} />
        ) : isEmpty ? (
          <EmptyState
            icon={Bookmark}
            title="Nothing saved yet"
            description="Tap the bookmark icon on any update or post and it will appear here."
            action={
              <Button asChild>
                <Link to="/updates">Browse campus updates</Link>
              </Button>
            }
          />
        ) : (
          <div className="space-y-6">
            {saved.data?.announcements.length ? (
              <section>
                <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Campus updates
                </h2>
                <ul className="space-y-3">
                  {saved.data.announcements.map((item) => (
                    <li key={item.id}>
                      <Link
                        to="/updates/$id"
                        params={{ id: item.id }}
                        className="surface-card flex items-start gap-3 p-4 hover:bg-secondary/50"
                      >
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-lime-soft text-primary">
                          <Newspaper className="size-5" aria-hidden="true" />
                        </span>
                        <span className="min-w-0">
                          <span className="block font-semibold">{item.title}</span>
                          <span className="mt-1 line-clamp-2 block text-sm text-muted-foreground">
                            {item.content}
                          </span>
                          <span className="mt-1 block text-xs text-muted-foreground">
                            {item.source_name ?? "CampusTruth"} · {timeAgo(item.published_at)}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {saved.data?.posts.length ? (
              <section>
                <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Student posts
                </h2>
                <div className="space-y-3">
                  {saved.data.posts.map((post) => (
                    <PostCard key={post.id} post={post} currentUserId={userId} />
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        )}
      </div>
    </AppShell>
  );
}
