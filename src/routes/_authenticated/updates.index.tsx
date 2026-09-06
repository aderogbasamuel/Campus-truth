import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ChevronRight, Newspaper, Search } from "lucide-react";
import { useState } from "react";

import { AppShell, PageHeading } from "@/components/campus/AppShell";
import { EmptyState } from "@/components/campus/EmptyState";
import { CardSkeletonList } from "@/components/campus/LoadingSkeleton";
import { TrustBadge } from "@/components/campus/TrustBadge";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { UNILAG_ID, timeAgo } from "@/lib/campus";

export const Route = createFileRoute("/_authenticated/updates")({
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

  const filtered = (updates.data ?? []).filter((item) =>
    `${item.title} ${item.content}`.toLowerCase().includes(term.trim().toLowerCase()),
  );

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl">
        <PageHeading
          title="Campus updates"
          description="Every update here is checked against an official source before it is published."
        />

        <div className="relative mb-4">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <label htmlFor="updates-search" className="sr-only">
            Search updates
          </label>
          <Input
            id="updates-search"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Search fees, exams, registration…"
            className="h-12 rounded-2xl bg-card pl-9"
          />
        </div>

        {updates.isLoading ? (
          <CardSkeletonList count={4} />
        ) : updates.isError ? (
          <EmptyState
            icon={Newspaper}
            title="We couldn't load campus updates"
            description="Check your connection and refresh the page to try again."
          />
        ) : filtered.length ? (
          <ul className="space-y-3">
            {filtered.map((item) => (
              <li key={item.id}>
                <Link
                  to="/updates/$id"
                  params={{ id: item.id }}
                  className="surface-card flex items-start gap-3 p-4 transition-colors hover:bg-secondary/50"
                >
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-lime-soft text-primary">
                    <Newspaper className="size-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <TrustBadge level={item.verified ? "official" : "student"} />
                      <span className="text-xs text-muted-foreground">
                        {timeAgo(item.published_at)}
                      </span>
                      {item.confidence ? (
                        <Badge variant="secondary" className="bg-lime-soft text-lime-foreground">
                          {item.confidence}% confidence
                        </Badge>
                      ) : null}
                    </span>
                    <span className="mt-2 block font-semibold">{item.title}</span>
                    <span className="mt-1 line-clamp-2 block text-sm text-muted-foreground">
                      {item.content}
                    </span>
                    {item.source_name ? (
                      <span className="mt-2 block text-xs text-muted-foreground">
                        Source: {item.source_name}
                      </span>
                    ) : null}
                  </span>
                  <ChevronRight className="mt-3 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={Newspaper}
            title="No updates match that search"
            description="Try a different word, or come back later — new verified updates arrive regularly."
          />
        )}
      </div>
    </AppShell>
  );
}
