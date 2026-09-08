import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/campus/AppShell";
import { EmptyState } from "@/components/campus/EmptyState";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSessionUser } from "@/hooks/useCampusUser";
import { supabase } from "@/integrations/supabase/client";
import { friendlyError } from "@/lib/campus";

export const Route = createFileRoute("/_authenticated/communities")({
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

function CommunitiesPage() {
  const { userId } = useSessionUser();
  const queryClient = useQueryClient();

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
    },
    onError: (error) => toast.error(friendlyError(error)),
  });

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold">Communities</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Join the groups that match your faculty, department and level.
        </p>

        {communities.isLoading ? (
          <div className="mt-5 space-y-3">
            {[0, 1, 2].map((key) => (
              <Skeleton key={key} className="h-24 w-full rounded-2xl" />
            ))}
          </div>
        ) : communities.data && communities.data.length > 0 ? (
          <ul className="mt-5 space-y-3">
            {communities.data.map((community) => {
              const joined = memberships.data?.includes(community.id) ?? false;
              return (
                <li key={community.id} className="surface-card flex items-start gap-3 p-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-lime-soft text-primary">
                    <Users className="size-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base font-semibold">{community.name}</h2>
                    {community.description ? (
                      <p className="mt-1 text-sm text-muted-foreground">{community.description}</p>
                    ) : null}
                  </div>
                  <Button
                    variant={joined ? "secondary" : "default"}
                    onClick={() => toggle.mutate(community.id)}
                    disabled={toggle.isPending}
                  >
                    {joined ? "Joined" : "Join"}
                  </Button>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState
            icon={Users}
            title="No communities yet"
            description="Communities for your faculty and department will appear here soon."
          />
        )}
      </div>
    </AppShell>
  );
}
