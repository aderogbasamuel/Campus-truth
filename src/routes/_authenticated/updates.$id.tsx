import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, Bookmark, ExternalLink, Link2, Newspaper } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/campus/AppShell";
import { EmptyState } from "@/components/campus/EmptyState";
import { ReportDialog } from "@/components/campus/ReportDialog";
import { TrustBadge } from "@/components/campus/TrustBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSessionUser } from "@/hooks/useCampusUser";
import { supabase } from "@/integrations/supabase/client";
import { friendlyError } from "@/lib/campus";

export const Route = createFileRoute("/_authenticated/updates/$id")({
  head: () => ({
    meta: [
      { title: "Official update — CampusTruth" },
      {
        name: "description",
        content: "Read the full verified campus update, including its official source.",
      },
      { property: "og:title", content: "Official update — CampusTruth" },
      {
        property: "og:description",
        content: "Read the full verified campus update, including its official source.",
      },
    ],
  }),
  component: UpdateDetail,
});

function UpdateDetail() {
  const { id } = Route.useParams();
  const { userId } = useSessionUser();
  const queryClient = useQueryClient();

  const update = useQuery({
    queryKey: ["announcement", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("id, title, content, source_name, source_url, confidence, verified, published_at")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const saved = useQuery({
    queryKey: ["saved", "announcement", id, userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("saved_items")
        .select("id")
        .eq("user_id", userId!)
        .eq("item_type", "announcement")
        .eq("item_id", id)
        .maybeSingle();
      if (error) throw error;
      return data?.id ?? null;
    },
  });

  const toggleSave = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("Please sign in first.");
      if (saved.data) {
        const { error } = await supabase.from("saved_items").delete().eq("id", saved.data);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("saved_items")
          .insert({ user_id: userId, item_type: "announcement", item_id: id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(saved.data ? "Removed from saved" : "Saved for later");
      queryClient.invalidateQueries({ queryKey: ["saved"] });
    },
    onError: (error) => toast.error(friendlyError(error)),
  });

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl">
        <Link
          to="/updates"
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          All campus updates
        </Link>

        {update.isLoading ? (
          <div className="surface-card space-y-3 p-5">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-7 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ) : update.data ? (
          <article className="surface-card p-5">
            <div className="flex flex-wrap items-center gap-2">
              <TrustBadge level={update.data.verified ? "official" : "student"} />
              {update.data.confidence ? (
                <Badge variant="secondary" className="bg-lime-soft text-lime-foreground">
                  {update.data.confidence}% confidence
                </Badge>
              ) : null}
              <span className="text-xs text-muted-foreground">
                {update.data.published_at
                  ? new Date(update.data.published_at).toLocaleDateString(undefined, {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : ""}
              </span>
            </div>

            <h1 className="mt-3 text-2xl font-bold leading-snug">{update.data.title}</h1>
            <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-foreground">
              {update.data.content}
            </p>

            <div className="mt-5 rounded-2xl bg-secondary p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Where this came from
              </p>
              <p className="mt-1 text-sm font-medium">
                {update.data.source_name ?? "CampusTruth verification team"}
              </p>
              {update.data.source_url ? (
                <a
                  href={update.data.source_url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-primary underline"
                >
                  Open the original source
                  <ExternalLink className="size-3.5" aria-hidden="true" />
                </a>
              ) : (
                <p className="mt-2 text-xs text-muted-foreground">
                  No public link yet — confirm with your department office if you need proof.
                </p>
              )}
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Button
                variant="secondary"
                onClick={() => toggleSave.mutate()}
                aria-pressed={!!saved.data}
              >
                <Bookmark className={saved.data ? "fill-primary text-primary" : ""} />
                {saved.data ? "Saved" : "Save"}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  void navigator.clipboard.writeText(window.location.href);
                  toast.success("Link copied");
                }}
              >
                <Link2 />
                Copy link
              </Button>
              <ReportDialog targetType="announcement" targetId={id}>
                <Button variant="ghost">Report a problem</Button>
              </ReportDialog>
            </div>
          </article>
        ) : (
          <EmptyState
            icon={Newspaper}
            title="This update isn't available"
            description="It may have been withdrawn. Browse the latest verified campus updates instead."
          />
        )}
      </div>
    </AppShell>
  );
}
