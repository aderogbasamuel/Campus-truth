import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ArrowLeft,
  BadgeCheck,
  Bookmark,
  ExternalLink,
  Link2,
  Loader2,
  Newspaper,
} from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/campus/AppShell";
import { EmptyState } from "@/components/campus/EmptyState";
import { ReportDialog } from "@/components/campus/ReportDialog";
import { TrustBadge } from "@/components/campus/TrustBadge";
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

const CARD = "rounded-3xl border border-primary/15 bg-white p-5 sm:p-6";

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
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-primary/70 hover:text-primary"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          All campus updates
        </Link>

        {update.isLoading ? (
          <div className={`${CARD} space-y-3`}>
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-7 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ) : update.data ? (
          <article className={CARD}>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
              <TrustBadge level={update.data.verified ? "official" : "student"} />
              {update.data.confidence ? (
                <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-medium tabular-nums text-accent-foreground">
                  {update.data.confidence}% confidence
                </span>
              ) : null}
              {update.data.published_at ? (
                <time
                  dateTime={update.data.published_at}
                  className="text-sm text-primary/60"
                >
                  {new Date(update.data.published_at).toLocaleDateString(undefined, {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </time>
              ) : null}
            </div>

            <h1 className="mt-4 text-2xl font-semibold leading-snug tracking-tight sm:text-3xl">
              {update.data.title}
            </h1>
            <p className="mt-4 whitespace-pre-line text-base leading-relaxed text-primary/80">
              {update.data.content}
            </p>

            {/* the proof: this is the point of the whole product, so it gets real weight */}
            <div className="mt-6 rounded-2xl border border-primary/15 bg-muted p-4">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <span className="flex size-6 items-center justify-center rounded-full bg-accent text-accent-foreground">
                  <BadgeCheck className="size-3.5" aria-hidden="true" />
                </span>
                Where this came from
              </p>
              <p className="mt-2 text-sm font-medium">
                {update.data.source_name ?? "CampusTruth verification team"}
              </p>
              {update.data.source_url ? (
                <a
                  href={update.data.source_url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-primary underline underline-offset-2"
                >
                  Open the original source
                  <ExternalLink className="size-3.5" aria-hidden="true" />
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              ) : (
                <p className="mt-2 text-sm text-primary/70">
                  No public link yet. Confirm with your department office if you need proof.
                </p>
              )}
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-primary/10 pt-5">
              <Button
                variant={saved.data ? "default" : "outline"}
                className={
                  saved.data
                    ? "rounded-full"
                    : "rounded-full border-primary/20 bg-transparent hover:bg-primary/5"
                }
                disabled={toggleSave.isPending || saved.isLoading}
                onClick={() => toggleSave.mutate()}
                aria-pressed={!!saved.data}
              >
                {toggleSave.isPending ? (
                  <Loader2 className="animate-spin" aria-hidden="true" />
                ) : (
                  <Bookmark className={saved.data ? "fill-current" : ""} aria-hidden="true" />
                )}
                {saved.data ? "Saved" : "Save"}
              </Button>
              <Button
                variant="ghost"
                className="rounded-full"
                onClick={() => {
                  navigator.clipboard
                    .writeText(window.location.href)
                    .then(() => toast.success("Link copied"))
                    .catch(() => toast.error("Couldn't copy the link"));
                }}
              >
                <Link2 aria-hidden="true" />
                Copy link
              </Button>
              <ReportDialog targetType="announcement" targetId={id}>
                <Button variant="ghost" className="rounded-full">
                  Report a problem
                </Button>
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