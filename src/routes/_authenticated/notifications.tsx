import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Bell, CheckCheck } from "lucide-react";
import { toast } from "sonner";

import { AppShell, PageHeading } from "@/components/campus/AppShell";
import { EmptyState } from "@/components/campus/EmptyState";
import { CardSkeletonList } from "@/components/campus/LoadingSkeleton";
import { Button } from "@/components/ui/button";
import { useSessionUser } from "@/hooks/useCampusUser";
import { supabase } from "@/integrations/supabase/client";
import { friendlyError, timeAgo } from "@/lib/campus";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — CampusTruth" },
      { name: "description", content: "Replies, answers and campus alerts meant for you." },
      { property: "og:title", content: "Notifications — CampusTruth" },
      { property: "og:description", content: "Replies, answers and campus alerts meant for you." },
    ],
  }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const { userId } = useSessionUser();
  const queryClient = useQueryClient();

  const notifications = useQuery({
    queryKey: ["notifications", "list", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("id, type, title, message, read, created_at")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false })
        .limit(60);
      if (error) throw error;
      return data ?? [];
    },
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  const markAll = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", userId!)
        .eq("read", false);
      if (error) throw error;
    },
    onSuccess: refresh,
    onError: (error) => toast.error(friendlyError(error)),
  });

  const markOne = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notifications").update({ read: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: refresh,
  });

  const unread = (notifications.data ?? []).filter((item) => !item.read).length;

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl">
        <PageHeading
          title="Notifications"
          description={unread ? `${unread} unread` : "You're all caught up."}
          action={
            unread ? (
              <Button variant="secondary" onClick={() => markAll.mutate()}>
                <CheckCheck />
                Mark all read
              </Button>
            ) : undefined
          }
        />

        {notifications.isLoading ? (
          <CardSkeletonList count={4} />
        ) : notifications.data?.length ? (
          <ul className="space-y-2">
            {notifications.data.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => !item.read && markOne.mutate(item.id)}
                  className={cn(
                    "surface-card flex w-full items-start gap-3 p-4 text-left transition-colors",
                    item.read ? "opacity-70" : "border-primary/30",
                  )}
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-lime-soft text-primary">
                    <Bell className="size-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{item.title}</span>
                    {item.message ? (
                      <span className="mt-1 block text-sm text-muted-foreground">
                        {item.message}
                      </span>
                    ) : null}
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {timeAgo(item.created_at)}
                    </span>
                  </span>
                  {!item.read ? (
                    <span className="mt-2 size-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={Bell}
            title="No notifications yet"
            description="When someone replies to your post or answers your question, you'll see it here."
          />
        )}
      </div>
    </AppShell>
  );
}
