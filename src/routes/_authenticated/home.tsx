import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { Bot, ImagePlus, MessagesSquare, Newspaper, Send, Sparkles, Users } from "lucide-react";
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

const QUICK_LINKS = [
  { to: "/updates", label: "Campus updates", icon: Newspaper },
  { to: "/ask", label: "Ask TrustBot", icon: Bot },
] as const;

function HomePage() {
  const navigate = useNavigate();
  const { userId, loading } = useSessionUser();
  const { data: profile, isLoading: profileLoading } = useProfile(userId);

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

  const firstName = (profile?.full_name ?? "").split(" ")[0];

  return (
    <AppShell>
      <section className="mb-5">
        <p className="text-sm text-muted-foreground">Welcome back</p>
        <h1 className="text-2xl font-extrabold">{firstName ? `Hi ${firstName}` : "Hi there"} 👋</h1>
      </section>

      <Link
        to="/ask"
        className="brand-hero mb-6 flex items-center gap-3 rounded-3xl px-5 py-4 text-primary-foreground shadow-float"
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-lime text-lime-foreground">
          <Sparkles className="size-5" aria-hidden="true" />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold">Ask about your campus</span>
          <span className="block truncate text-xs opacity-80">
            Fees, exams, registration — answered from verified sources only
          </span>
        </span>
      </Link>

      <section className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">Trending now</h2>
          <Link to="/updates" className="text-sm font-semibold text-primary hover:underline">
            See all
          </Link>
        </div>
        {announcements.isLoading ? (
          <CardSkeletonList count={2} />
        ) : announcements.data?.length ? (
          <ul className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2">
            {announcements.data.map((item) => (
              <li key={item.id} className="w-72 shrink-0 snap-start">
                <Link
                  to="/updates/$id"
                  params={{ id: item.id }}
                  className="surface-card flex h-full flex-col gap-2 p-4"
                >
                  <div className="flex items-center gap-2">
                    <TrustBadge level={item.verified ? "official" : "student"} />
                    {item.confidence ? (
                      <span className="text-[11px] font-semibold text-muted-foreground">
                        {item.confidence}% confidence
                      </span>
                    ) : null}
                  </div>
                  <h3 className="text-sm font-bold leading-snug">{item.title}</h3>
                  <p className="line-clamp-3 text-xs text-muted-foreground">{item.content}</p>
                  <p className="mt-auto text-[11px] text-muted-foreground">
                    {item.source_name ?? "UNILAG"} • {timeAgo(item.published_at)}
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

      <section className="mb-8 grid grid-cols-2 gap-3">
        {QUICK_LINKS.map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to} className="surface-card flex items-center gap-3 p-4">
            <span className="flex size-10 items-center justify-center rounded-xl bg-lime-soft text-primary">
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <span className="text-sm font-semibold">{label}</span>
          </Link>
        ))}
      </section>

      <Composer userId={userId} />

      <section className="mt-6 space-y-3">
        <h2 className="text-lg font-bold">From students</h2>
        {feed.isLoading || profileLoading ? (
          <CardSkeletonList />
        ) : feed.error ? (
          <EmptyState
            icon={MessagesSquare}
            title="We couldn't load the feed"
            description="Please check your connection and try again."
            action={<Button onClick={() => feed.refetch()}>Try again</Button>}
          />
        ) : feed.data?.length ? (
          feed.data.map((post) => (
            <PostCard key={post.id} post={post} currentUserId={userId} />
          ))
        ) : (
          <EmptyState
            icon={Users}
            title="No posts yet"
            description="Be the first to share something useful with your campus."
          />
        )}
      </section>
    </AppShell>
  );
}

function Composer({ userId }: { userId: string | null }) {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile(userId);
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<string>("general");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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
        content: content.trim(),
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
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      toast.success("Posted to your campus.");
    },
    onError: (error) => toast.error(friendlyError(error)),
  });

  return (
    <form
      className="surface-card space-y-3 p-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (content.trim().length < 3) {
          toast.error("Write a little more before posting.");
          return;
        }
        create.mutate();
      }}
    >
      <Textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        rows={3}
        placeholder="Share something useful with your campus…"
        aria-label="Write a post"
      />
      {imageUrl ? (
        <img src={imageUrl} alt="Attached to your post" className="max-h-56 w-full rounded-2xl object-cover" />
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-auto min-w-40">
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
          }}
        />
        <Button type="submit" className="ml-auto" disabled={create.isPending}>
          <Send className="size-4" aria-hidden="true" />
          Post
        </Button>
      </div>
    </form>
  );
}
