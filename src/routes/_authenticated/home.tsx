import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  CircleHelp,
  ImagePlus,
  Loader2,
  MessagesSquare,
  Newspaper,
  Send,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/campus/AppShell";
import { CardSkeletonList } from "@/components/campus/LoadingSkeleton";
import { EmptyState } from "@/components/campus/EmptyState";
import { PostCard, type FeedPost } from "@/components/campus/PostCard";
import { TrustBadge } from "@/components/campus/TrustBadge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useProfile, useSessionUser } from "@/hooks/useCampusUser";
import { supabase } from "@/integrations/supabase/client";
import {
  POST_CATEGORIES,
  UNILAG_ID,
  categoryLabel,
  friendlyError,
  timeAgo,
  uploadImage,
} from "@/lib/campus";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({
    meta: [
      { title: "Home feed — CampusTruth" },
      {
        name: "description",
        content: "Your personalised UNILAG feed: verified announcements and posts from students.",
      },
      { property: "og:title", content: "Home feed — CampusTruth" },
      {
        property: "og:description",
        content: "Your personalised UNILAG feed: verified announcements and posts from students.",
      },
    ],
  }),
  component: HomePage,
});

const MAX_POST_LENGTH = 1000;

// one card style for the whole page, same as PostCard
const CARD = "rounded-3xl border border-primary/15 bg-white";

// Pages that don't fit in the mobile bottom bar
const QUICK_LINKS = [
  { to: "/qa", label: "Q&A", hint: "Ask students, get answers", icon: CircleHelp },
  { to: "/communities", label: "Communities", hint: "Your faculty, department and level", icon: Users },
] as const;

function HomePage() {
  const navigate = useNavigate();
  const { userId, loading } = useSessionUser();
  const { data: profile, isLoading: profileLoading } = useProfile(userId);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    if (!loading && profile && !profile.onboarded) {
      navigate({ to: "/onboarding", replace: true });
    }
  }, [loading, profile, navigate]);

  const announcements = useQuery({
    queryKey: ["announcements", "trending"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("id, title, content, source_name, confidence, published_at, verified")
        .eq("school_id", UNILAG_ID)
        .order("published_at", { ascending: false })
        .limit(6);
      if (error) throw error;
      return data;
    },
  });

  const feed = useQuery({
    queryKey: ["feed", "home", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select(
          "id, author_id, title, content, image_url, category, verified, created_at, author:profiles!posts_author_id_fkey(full_name, username, avatar_url, verified), reactions(count), comments(count)",
        )
        .eq("removed", false)
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;

      const [{ data: likes }, { data: saved }] = await Promise.all([
        supabase.from("reactions").select("post_id").eq("user_id", userId!),
        supabase.from("saved_items").select("item_id").eq("user_id", userId!).eq("item_type", "post"),
      ]);
      const likedIds = new Set((likes ?? []).map((row) => row.post_id));
      const savedIds = new Set((saved ?? []).map((row) => row.item_id));

      return (data ?? []).map((row) => {
        const record = row as unknown as {
          reactions?: { count: number }[];
          comments?: { count: number }[];
        };
        return {
          ...(row as unknown as FeedPost),
          reaction_count: record.reactions?.[0]?.count ?? 0,
          comment_count: record.comments?.[0]?.count ?? 0,
          liked: likedIds.has(row.id),
          saved: savedIds.has(row.id),
        } satisfies FeedPost;
      });
    },
  });

  // Hold the page on skeletons until we know the user is onboarded,
  // so unonboarded users never see a flash of the home screen before the redirect.
  if (loading || profileLoading || (profile && !profile.onboarded)) {
    return (
      <AppShell>
        <div className="mx-auto max-w-2xl space-y-4">
          <div className="h-12 w-40 animate-pulse rounded-xl bg-muted" />
          <div className="h-24 animate-pulse rounded-3xl bg-muted" />
          <CardSkeletonList count={2} />
        </div>
      </AppShell>
    );
  }

  const firstName = (profile?.full_name ?? "").split(" ")[0];
  const feedLoading = feed.isLoading || !userId;
  const visiblePosts = (feed.data ?? []).filter(
    (post) => filter === "all" || post.category === filter,
  );

  return (
    <AppShell>
      {/* keeps the feed a readable width on big screens */}
      <div className="mx-auto max-w-2xl">
        {/* Greeting */}
        <header className="mb-6">
          <h1 className="text-3xl font-semibold tracking-tight">
            {firstName ? `Hi ${firstName}` : "Hi there"}
          </h1>
          <p className="mt-1 text-sm text-primary/70">Here's what's happening on your campus.</p>
        </header>

        {/* Hero: Ask TrustBot */}
        <Link
          to="/ask"
          className="group relative mb-3 flex items-center gap-4 overflow-hidden rounded-3xl bg-primary p-4 text-primary-foreground shadow-lg shadow-primary/10 transition-transform duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.99] sm:p-5"
        >
          <BadgeCheck
            aria-hidden="true"
            strokeWidth={1}
            className="pointer-events-none absolute -bottom-8 -right-4 size-36 text-accent/15"
          />
          <span className="relative flex size-11 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
            <Sparkles className="size-5" aria-hidden="true" />
          </span>
          <span className="relative min-w-0 flex-1">
            <span className="block text-base font-semibold">Ask TrustBot about your campus</span>
            {/* <span className="mt-0.5 block text-sm text-primary-foreground/75">
              Fees, exams, registration. Answered from verified sources only.
            </span> */}
          </span>
          <span className="relative flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground transition-transform duration-200 group-hover:translate-x-0.5">
            <ArrowRight className="size-4" aria-hidden="true" />
          </span>
        </Link>

        {/* Quick links: mobile only, the desktop sidebar already lists these */}
        <nav aria-label="Quick links" className="mb-8 grid grid-cols-2 gap-3 lg:hidden">
          {QUICK_LINKS.map(({ to, label, hint, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={cn(
                CARD,
                "group flex flex-col gap-3 p-4 transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.99]",
              )}
            >
              <span className="flex items-center justify-between">
                <span className="flex size-10 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <ArrowUpRight
                  className="size-4 text-primary/50 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </span>
              <span>
                <span className="block text-base font-semibold leading-snug">{label}</span>
                <span className="mt-0.5 block text-sm leading-snug text-primary/60">{hint}</span>
              </span>
            </Link>
          ))}
        </nav>

        {/* Trending */}
        <section className="mb-8" aria-labelledby="trending-heading">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <h2 id="trending-heading" className="text-lg font-semibold tracking-tight">
                Trending now
              </h2>
              <p className="text-sm text-primary/60">Latest from UNILAG</p>
            </div>
            <Link
              to="/updates"
              className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
            >
              See all
              <ArrowUpRight className="size-3.5" aria-hidden="true" />
            </Link>
          </div>

          {announcements.isLoading ? (
            <CardSkeletonList count={2} />
          ) : announcements.data?.length ? (
            <ul
              aria-label="Trending announcements"
              className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {announcements.data.map((item) => (
                <li key={item.id} className="w-[17rem] shrink-0 snap-start">
                  <Link
                    to="/updates/$id"
                    params={{ id: item.id }}
                    className={cn(
                      CARD,
                      "group flex h-full flex-col gap-2.5 p-4 transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <TrustBadge level={item.verified ? "official" : "student"} />
                      {item.confidence ? (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium tabular-nums text-primary/70">
                          {item.confidence}%
                        </span>
                      ) : null}
                    </div>
                    <h3 className="line-clamp-2 text-sm font-semibold leading-snug">
                      {item.title}
                    </h3>
                    <p className="line-clamp-3 text-sm leading-relaxed text-primary/70">
                      {item.content}
                    </p>
                    <p className="mt-auto pt-1 text-xs font-medium text-primary/60">
                      {item.source_name ?? "UNILAG"} · {timeAgo(item.published_at)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={Newspaper}
              title="No verified updates yet"
              description="Official announcements will appear here as soon as they're published."
            />
          )}
        </section>

        {/* Feed */}
        <section aria-labelledby="feed-heading" className="space-y-4">
          <div>
            <h2 id="feed-heading" className="text-lg font-semibold tracking-tight">
              From students
            </h2>
            <p className="text-sm text-primary/60">Share and discover what's happening</p>
          </div>

          <Composer userId={userId} />

          {/* filter chips: toggle buttons, not tabs (there are no tab panels) */}
          <div
            role="group"
            aria-label="Filter posts by category"
            className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {["all", ...POST_CATEGORIES.filter((item) => item !== "announcement")].map((item) => {
              const active = filter === item;
              return (
                <button
                  key={item}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setFilter(item)}
                  className={cn(
                    "shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-primary/15 bg-white text-primary/70 hover:text-primary",
                  )}
                >
                  {item === "all" ? "All" : categoryLabel(item)}
                </button>
              );
            })}
          </div>

          <div className="space-y-3">
            {feedLoading ? (
              <CardSkeletonList />
            ) : feed.error ? (
              <EmptyState
                icon={MessagesSquare}
                title="We couldn't load the feed"
                description="Please check your connection and try again."
                action={<Button onClick={() => feed.refetch()}>Try again</Button>}
              />
            ) : visiblePosts.length ? (
              visiblePosts.map((post) => (
                <PostCard key={post.id} post={post} currentUserId={userId} />
              ))
            ) : (
              <EmptyState
                icon={Users}
                title={filter === "all" ? "No posts yet" : "Nothing in this category yet"}
                description={
                  filter === "all"
                    ? "Be the first to share something useful with your campus."
                    : "Try another category, or post something here yourself."
                }
              />
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function Composer({ userId }: { userId: string | null }) {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile(userId);
  const [expanded, setExpanded] = useState(false);
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<string>("general");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const initial = (profile?.full_name ?? "?").trim().charAt(0).toUpperCase() || "?";
  const trimmed = content.trim();

  useEffect(() => {
    if (expanded) textareaRef.current?.focus();
  }, [expanded]);

  const upload = useMutation({
    mutationFn: async (file: File) => uploadImage("post-images", userId!, file),
    onSuccess: (url) => setImageUrl(url),
    onError: (error) => toast.error(friendlyError(error)),
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("Please sign in again.");
      const { error } = await supabase.from("posts").insert({
        author_id: userId,
        content: trimmed,
        category: category as never,
        image_url: imageUrl,
        school_id: profile?.school_id ?? UNILAG_ID,
        faculty_id: profile?.faculty_id ?? null,
        department_id: profile?.department_id ?? null,
        level: profile?.level ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setContent("");
      setImageUrl(null);
      setExpanded(false);
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      toast.success("Posted to your campus.");
    },
    onError: (error) => toast.error(friendlyError(error)),
  });

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className={cn(
          CARD,
          "flex w-full items-center gap-3 p-3 text-left transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        )}
        aria-label="Write a post"
      >
        <Avatar url={profile?.avatar_url ?? null} initial={initial} />
        <span className="flex-1 text-sm text-primary/60">
          Share something useful with your campus…
        </span>
        <span className="flex size-9 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <ImagePlus className="size-4" aria-hidden="true" />
        </span>
      </button>
    );
  }

  return (
    <form
      className={cn(CARD, "space-y-3 p-4")}
      onSubmit={(event) => {
        event.preventDefault();
        if (trimmed.length < 3) {
          toast.error("Write a little more before posting.");
          return;
        }
        create.mutate();
      }}
    >
      <div className="flex items-start gap-3">
        <Avatar url={profile?.avatar_url ?? null} initial={initial} />
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape" && !content && !imageUrl) setExpanded(false);
          }}
          rows={3}
          maxLength={MAX_POST_LENGTH}
          placeholder="Share something useful with your campus…"
          aria-label="Write a post"
          className="min-h-20 flex-1 resize-none border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0"
        />
      </div>

      {upload.isPending ? (
        <div className="flex h-24 items-center justify-center gap-2 rounded-2xl bg-muted text-sm font-medium text-primary/70">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          Uploading image…
        </div>
      ) : imageUrl ? (
        <div className="relative">
          <img
            src={imageUrl}
            alt="Attached to your post"
            loading="lazy"
            className="max-h-56 w-full rounded-2xl object-cover"
          />
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="absolute right-2 top-2 size-8 rounded-full shadow"
            aria-label="Remove image"
            onClick={() => setImageUrl(null)}
          >
            <X className="size-4" aria-hidden="true" />
          </Button>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2 border-t border-primary/10 pt-3">
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="h-9 w-auto min-w-36 rounded-full text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {POST_CATEGORIES.filter((item) => item !== "announcement").map((item) => (
              <SelectItem key={item} value={item}>
                {categoryLabel(item)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-9 rounded-full border-primary/20"
          aria-label="Add an image"
          disabled={upload.isPending}
          onClick={() => fileRef.current?.click()}
        >
          <ImagePlus className="size-4" aria-hidden="true" />
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) upload.mutate(file);
            // Reset so picking the same file twice still fires onChange.
            event.target.value = "";
          }}
        />

        <span
          className={cn(
            "ml-auto text-xs tabular-nums text-primary/60",
            content.length > MAX_POST_LENGTH - 50 && "font-semibold text-destructive",
          )}
          aria-live="polite"
        >
          {content.length}/{MAX_POST_LENGTH}
        </span>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="rounded-full"
          disabled={create.isPending}
          onClick={() => {
            setContent("");
            setImageUrl(null);
            setExpanded(false);
          }}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          size="sm"
          className="rounded-full bg-accent text-accent-foreground hover:bg-accent/90"
          disabled={create.isPending || upload.isPending || trimmed.length < 3}
        >
          {create.isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Send className="size-4" aria-hidden="true" />
          )}
          {create.isPending ? "Posting…" : "Post"}
        </Button>
      </div>
    </form>
  );
}

function Avatar({ url, initial }: { url: string | null; initial: string }) {
  if (url) {
    return (
      <img
        src={url}
        alt=""
        loading="lazy"
        className="size-9 shrink-0 rounded-full object-cover"
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground"
    >
      {initial}
    </span>
  );
}