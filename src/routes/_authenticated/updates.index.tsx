import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ChevronRight, Newspaper, Search, X } from "lucide-react";
import { useState } from "react";

import { AppShell, PageHeading } from "@/components/campus/AppShell";
import { EmptyState } from "@/components/campus/EmptyState";
import { CardSkeletonList } from "@/components/campus/LoadingSkeleton";
import { TrustBadge } from "@/components/campus/TrustBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { UNILAG_ID, timeAgo } from "@/lib/campus";

export const Route = createFileRoute("/_authenticated/updates/")({
  head: () => ({
    meta: [
      { title: "Campus updates — CampusTruth" },
      {
        name: "description",
        content: "Verified UNILAG announcements with their original source and publication date.",
      },
      { property: "og:title", content: "Campus updates — CampusTruth" },
      {
        property: "og:description",
        content: "Verified UNILAG announcements with their original source and publication date.",
      },
    ],
  }),
  component: UpdatesPage,
});

function UpdatesPage() {
  const [term, setTerm] = useState("");

  const updates = useQuery({
    queryKey: ["announcements", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("id, title, content, source_name, confidence, verified, published_at")
        .eq("school_id", UNILAG_ID)
        .order("published_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });

  const query = term.trim().toLowerCase();
  const filtered = (updates.data ?? []).filter((item) =>
    `${item.title} ${item.content}`.toLowerCase().includes(query),
  );
  const hasAny = (updates.data ?? []).length > 0;

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl">
        <PageHeading
          title="Campus updates"
          description="Every update here is checked against an official source before it is published."
        />

        <div className="relative mb-2">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-primary/60"
            aria-hidden="true"
          />
          <label htmlFor="updates-search" className="sr-only">
            Search updates
          </label>
          <Input
            id="updates-search"
            type="search"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Search fees, exams, registration…"
            className="h-12 rounded-full border-primary/20 bg-white pl-11 pr-11"
          />
          {term ? (
            <button
              type="button"
              onClick={() => setTerm("")}
              aria-label="Clear search"
              className="absolute right-1.5 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full text-primary/60 transition-colors hover:bg-primary/5 hover:text-primary"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          ) : null}
        </div>

        {/* announced to screen readers as you type; hidden visually when not searching */}
        <p className="mb-4 min-h-5 px-2 text-sm text-primary/60" aria-live="polite">
          {query && !updates.isLoading && !updates.isError
            ? `${filtered.length} ${filtered.length === 1 ? "update" : "updates"} found`
            : ""}
        </p>

        {updates.isLoading ? (
          <CardSkeletonList count={4} />
        ) : updates.isError ? (
          <EmptyState
            icon={Newspaper}
            title="We couldn't load campus updates"
            description="Check your connection and try again."
            action={<Button onClick={() => updates.refetch()}>Try again</Button>}
          />
        ) : filtered.length ? (
          <ul className="space-y-3">
            {filtered.map((item) => (
              <li key={item.id}>
                <Link
                  to="/updates/$id"
                  params={{ id: item.id }}
                  className="group flex items-start gap-3 rounded-3xl border border-primary/15 bg-white p-4 transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                    <Newspaper className="size-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
                      <TrustBadge level={item.verified ? "official" : "student"} />
                      {item.confidence ? (
                        <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium tabular-nums text-primary/70">
                          {item.confidence}% confidence
                        </span>
                      ) : null}
                      <span className="text-sm text-primary/60">{timeAgo(item.published_at)}</span>
                    </span>
                    <span className="mt-2 block text-base font-semibold leading-snug">
                      {item.title}
                    </span>
                    <span className="mt-1 line-clamp-2 block text-sm leading-relaxed text-primary/70">
                      {item.content}
                    </span>
                    {item.source_name ? (
                      <span className="mt-2 block text-sm text-primary/60">
                        Source: <span className="font-medium">{item.source_name}</span>
                      </span>
                    ) : null}
                  </span>
                  <ChevronRight
                    className="mt-3 size-4 shrink-0 text-primary/50 transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            ))}
          </ul>
        ) : hasAny ? (
          <EmptyState
            icon={Newspaper}
            title="No updates match that search"
            description="Try a different word, or clear the search to see everything."
            action={
              <Button variant="outline" onClick={() => setTerm("")}>
                Clear search
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={Newspaper}
            title="No updates yet"
            description="Verified announcements will show up here as soon as they're published."
          />
        )}
      </div>
    </AppShell>
  );
}