import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { MessagesSquare, Newspaper, Search as SearchIcon, Users } from "lucide-react";
import { useState } from "react";

import { AppShell, PageHeading } from "@/components/campus/AppShell";
import { EmptyState } from "@/components/campus/EmptyState";
import { UserAvatar } from "@/components/campus/UserAvatar";
import { CardSkeletonList } from "@/components/campus/LoadingSkeleton";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { timeAgo } from "@/lib/campus";

export const Route = createFileRoute("/_authenticated/search")({
  head: () => ({
    meta: [
      { title: "Search CampusTruth" },
      {
        name: "description",
        content: "Search verified campus updates, student posts, questions and people.",
      },
      { property: "og:title", content: "Search CampusTruth" },
      {
        property: "og:description",
        content: "Search verified campus updates, student posts, questions and people.",
      },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const [term, setTerm] = useState("");
  const query = term.trim();

  const results = useQuery({
    queryKey: ["search", query],
    enabled: query.length > 1,
    queryFn: async () => {
      const like = `%${query}%`;
      const [announcements, posts, questions, people] = await Promise.all([
        supabase
          .from("announcements")
          .select("id, title, content, published_at")
          .or(`title.ilike.${like},content.ilike.${like}`)
          .limit(8),
        supabase
          .from("posts")
          .select("id, title, content, created_at")
          .eq("removed", false)
          .or(`title.ilike.${like},content.ilike.${like}`)
          .limit(8),
        supabase
          .from("questions")
          .select("id, title, created_at")
          .ilike("title", like)
          .limit(8),
        supabase
          .from("profiles")
          .select("id, full_name, username, avatar_url, level")
          .or(`full_name.ilike.${like},username.ilike.${like}`)
          .limit(8),
      ]);
      return {
        announcements: announcements.data ?? [],
        posts: posts.data ?? [],
        questions: questions.data ?? [],
        people: people.data ?? [],
      };
    },
  });

  const total =
    (results.data?.announcements.length ?? 0) +
    (results.data?.posts.length ?? 0) +
    (results.data?.questions.length ?? 0) +
    (results.data?.people.length ?? 0);

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl">
        <PageHeading title="Search" description="Updates, posts, questions and students." />

        <div className="relative mb-5">
          <SearchIcon
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <label htmlFor="global-search" className="sr-only">
            Search CampusTruth
          </label>
          <Input
            id="global-search"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Try “school fees”, “hostel”, “timetable”…"
            className="h-12 rounded-2xl bg-card pl-9"
            autoFocus
          />
        </div>

        {query.length < 2 ? (
          <EmptyState
            icon={SearchIcon}
            title="Start typing to search"
            description="Search across verified campus updates, student posts, questions and people."
          />
        ) : results.isLoading ? (
          <CardSkeletonList count={3} />
        ) : total === 0 ? (
          <EmptyState
            icon={SearchIcon}
            title="Nothing found"
            description="Try fewer words, or ask TrustBot — it checks verified campus records for you."
          />
        ) : (
          <div className="space-y-6">
            {results.data?.announcements.length ? (
              <section>
                <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  <Newspaper className="size-4" aria-hidden="true" />
                  Campus updates
                </h2>
                <ul className="space-y-2">
                  {results.data.announcements.map((item) => (
                    <li key={item.id}>
                      <Link
                        to="/updates/$id"
                        params={{ id: item.id }}
                        className="surface-card block p-4 hover:bg-secondary/50"
                      >
                        <span className="block font-semibold">{item.title}</span>
                        <span className="mt-1 line-clamp-2 block text-sm text-muted-foreground">
                          {item.content}
                        </span>
                        <span className="mt-1 block text-xs text-muted-foreground">
                          {timeAgo(item.published_at)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {results.data?.questions.length ? (
              <section>
                <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  <MessagesSquare className="size-4" aria-hidden="true" />
                  Questions
                </h2>
                <ul className="space-y-2">
                  {results.data.questions.map((item) => (
                    <li key={item.id}>
                      <Link
                        to="/qa/$id"
                        params={{ id: item.id }}
                        className="surface-card block p-4 hover:bg-secondary/50"
                      >
                        <span className="block font-semibold">{item.title}</span>
                        <span className="mt-1 block text-xs text-muted-foreground">
                          {timeAgo(item.created_at)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {results.data?.posts.length ? (
              <section>
                <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Student posts
                </h2>
                <ul className="space-y-2">
                  {results.data.posts.map((item) => (
                    <li key={item.id} className="surface-card p-4">
                      {item.title ? <p className="font-semibold">{item.title}</p> : null}
                      <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">
                        {item.content}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {timeAgo(item.created_at)}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {results.data?.people.length ? (
              <section>
                <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  <Users className="size-4" aria-hidden="true" />
                  Students
                </h2>
                <ul className="space-y-2">
                  {results.data.people.map((person) => (
                    <li key={person.id} className="surface-card flex items-center gap-3 p-4">
                      <UserAvatar name={person.full_name} url={person.avatar_url} className="size-9" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {person.full_name ?? "Student"}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {person.username ? `@${person.username}` : ""}
                          {person.level ? ` · ${person.level} level` : ""}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        )}
      </div>
    </AppShell>
  );
}
