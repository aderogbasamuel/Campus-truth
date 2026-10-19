import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Check, ChevronRight, Loader2, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell, PageHeading } from "@/components/campus/AppShell";
import { EmptyState } from "@/components/campus/EmptyState";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSessionUser } from "@/hooks/useCampusUser";
import { supabase } from "@/integrations/supabase/client";
import { friendlyError } from "@/lib/campus";

export const Route = createFileRoute("/_authenticated/communities/")({
  head: () => ({
    meta: [
      { title: "Communities — CampusTruth" },
      {
        name: "description",
        content: "Join your faculty, department and level communities on CampusTruth.",
      },
      { property: "og:title", content: "Communities — CampusTruth" },
      {
        property: "og:description",
        content: "Join your faculty, department and level communities on CampusTruth.",
      },
    ],
  }),
  component: CommunitiesPage,
});

type View = "all" | "joined";

function CommunitiesPage() {
  const { userId } = useSessionUser();
  const queryClient = useQueryClient();
  const [view, setView] = useState<View>("all");

  const communities = useQuery({
    queryKey: ["communities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("communities")
        .select("id, name, description, level")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  // Member counts get their own query, so a problem here can never hide the list itself.
  const counts = useQuery({
    queryKey: ["community-counts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("communities").select("id, community_members(count)");
      if (error) {
        console.warn("Couldn't load community member counts:", error);
        return {} as Record<string, number>;
      }
      const map: Record<string, number> = {};
      for (const row of (data ?? []) as unknown as {
        id: string;
        community_members: { count: number }[] | null;
      }[]) {
        map[row.id] = row.community_members?.[0]?.count ?? 0;
      }
      return map;
    },
  });

  const memberships = useQuery({
    queryKey: ["community-members", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("community_members")
        .select("community_id")
        .eq("user_id", userId!);
      if (error) throw error;
      return (data ?? []).map((row) => row.community_id);
    },
  });

  const toggle = useMutation({
    mutationFn: async (communityId: string) => {
      if (!userId) throw new Error("Please sign in first.");
      if (memberships.data?.includes(communityId)) {
        const { error } = await supabase
          .from("community_members")
          .delete()
          .eq("user_id", userId)
          .eq("community_id", communityId);
        if (error) throw error;
        return "left" as const;
      }
      const { error } = await supabase
        .from("community_members")
        .insert({ user_id: userId, community_id: communityId });
      if (error) throw error;
      return "joined" as const;
    },
    onSuccess: (result) => {
      toast.success(result === "joined" ? "Joined the community" : "Left the community");
      queryClient.invalidateQueries({ queryKey: ["community-members"] });
      queryClient.invalidateQueries({ queryKey: ["community-counts"] });
      // keep any open community page in step
      queryClient.invalidateQueries({ queryKey: ["community-joined"] });
      queryClient.invalidateQueries({ queryKey: ["community-member-count"] });
    },
    onError: (error) => toast.error(friendlyError(error)),
  });

  const all = communities.data ?? [];
  const joinedIds = new Set(memberships.data ?? []);
  const joinedCount = all.filter((community) => joinedIds.has(community.id)).length;
  const visible = view === "joined" ? all.filter((community) => joinedIds.has(community.id)) : all;
  const loading = communities.isLoading || (view === "joined" && memberships.isLoading);

  const tab = (active: boolean) =>
    `rounded-full py-2 text-sm font-medium transition-colors ${
      active ? "bg-white text-primary shadow-sm" : "text-primary/60 hover:text-primary"
    }`;

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl">
        <PageHeading
          title="Communities"
          description="Join the groups that match your faculty, department and level."
        />

        {all.length > 0 ? (
          <div className="mb-4 grid grid-cols-2 gap-1 rounded-full bg-muted p-1">
            <button
              type="button"
              aria-pressed={view === "all"}
              className={tab(view === "all")}
              onClick={() => setView("all")}
            >
              All communities
            </button>
            <button
              type="button"
              aria-pressed={view === "joined"}
              className={tab(view === "joined")}
              onClick={() => setView("joined")}
            >
              Joined{joinedCount > 0 ? ` (${joinedCount})` : ""}
            </button>
          </div>
        ) : null}

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((key) => (
              <Skeleton key={key} className="h-24 w-full rounded-3xl" />
            ))}
          </div>
        ) : communities.isError ? (
          <EmptyState
            icon={Users}
            title="We couldn't load communities"
            description="Check your connection and try again."
            action={<Button onClick={() => communities.refetch()}>Try again</Button>}
          />
        ) : all.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No communities yet"
            description="Communities for your faculty and department will appear here soon."
          />
        ) : visible.length === 0 ? (
          <EmptyState
            icon={Users}
            title="You haven't joined any communities"
            description="Join one from the full list and it will show up here."
            action={
              <Button variant="outline" onClick={() => setView("all")}>
                Browse all communities
              </Button>
            }
          />
        ) : (
          <ul className="space-y-3">
            {visible.map((community) => {
              const joined = joinedIds.has(community.id);
              // only the card being toggled shows a spinner; the rest stay usable
              const busy = toggle.isPending && toggle.variables === community.id;
              const memberCount = counts.data?.[community.id];
              return (
                <li
                  key={community.id}
                  className="flex items-start gap-1 rounded-3xl border border-primary/15 bg-white p-2 transition-colors hover:border-primary/30"
                >
                  {/* the whole text area opens the community; Join stays a separate button */}
                  <Link
                    to="/communities/$id"
                    params={{ id: community.id }}
                    className="group flex min-w-0 flex-1 items-start gap-3 rounded-2xl p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                      <Users className="size-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-base font-semibold leading-snug [overflow-wrap:anywhere]">
                        {community.name}
                      </h2>
                      {community.level || memberCount !== undefined ? (
                        <p className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          {community.level ? (
                            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-primary/70">
                              {community.level} level
                            </span>
                          ) : null}
                          {memberCount !== undefined ? (
                            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium tabular-nums text-primary/70">
                              {memberCount} member{memberCount === 1 ? "" : "s"}
                            </span>
                          ) : null}
                        </p>
                      ) : null}
                      {community.description ? (
                        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-primary/70">
                          {community.description}
                        </p>
                      ) : null}
                    </div>
                    <ChevronRight
                      className="mt-3 hidden size-4 shrink-0 text-primary/40 transition-transform group-hover:translate-x-0.5 sm:block"
                      aria-hidden="true"
                    />
                  </Link>
                  <Button
                    variant={joined ? "outline" : "default"}
                    className={
                      joined
                        ? "m-2 shrink-0 rounded-full border-primary/20 bg-transparent hover:bg-primary/5"
                        : "m-2 shrink-0 rounded-full bg-accent text-accent-foreground hover:bg-accent/90"
                    }
                    onClick={() => toggle.mutate(community.id)}
                    disabled={toggle.isPending || memberships.isLoading}
                    aria-pressed={joined}
                    aria-label={`${joined ? "Leave" : "Join"} ${community.name}`}
                  >
                    {busy ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    ) : joined ? (
                      <Check className="size-4" aria-hidden="true" />
                    ) : null}
                    {joined ? "Joined" : "Join"}
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </AppShell>
  );
}