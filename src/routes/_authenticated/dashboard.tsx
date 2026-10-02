import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Award,
  BadgeCheck,
  CheckCircle2,
  Circle,
  FileText,
  GraduationCap,
  MessageSquare,
  Users,
} from "lucide-react";

import { AppShell, PageHeading } from "@/components/campus/AppShell";
import { CardSkeletonList } from "@/components/campus/LoadingSkeleton";
import { TrustBadge } from "@/components/campus/TrustBadge";
import { UserAvatar } from "@/components/campus/UserAvatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useCredits, useProfile, useRoles, useSessionUser } from "@/hooks/useCampusUser";
import { supabase } from "@/integrations/supabase/client";
import { timeAgo } from "@/lib/campus";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "My Dashboard — CampusTruth" },
      { name: "description", content: "Your CampusTruth profile, communities, posts and badge progress." },
      { property: "og:title", content: "My Dashboard — CampusTruth" },
      { property: "og:description", content: "Your CampusTruth profile, communities, posts and badge progress." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { userId, loading: sessionLoading } = useSessionUser();
  const { data: profile, isLoading: profileLoading } = useProfile(userId);
  const { data: roles } = useRoles(userId);
  const { data: credits } = useCredits(userId);

  const { data: communities, isLoading: communitiesLoading } = useQuery({
    queryKey: ["my-communities", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("community_members")
        .select("joined_at, communities(id, name, description, level)")
        .eq("user_id", userId!)
        .order("joined_at", { ascending: false });
      if (error) throw error;
      return (data ?? [])
        .map((row) => row.communities)
        .filter((c): c is NonNullable<typeof c> => !!c);
    },
  });

  const { data: myPosts, isLoading: postsLoading } = useQuery({
    queryKey: ["my-posts", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("id, title, content, category, verified, created_at")
        .eq("author_id", userId!)
        .eq("removed", false)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: commentCount } = useQuery({
    queryKey: ["my-comment-count", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("comments")
        .select("id", { count: "exact", head: true })
        .eq("author_id", userId!);
      if (error) throw error;
      return count ?? 0;
    },
  });

  if (sessionLoading || profileLoading) {
    return (
      <AppShell>
        <PageHeading title="My dashboard" description="Your progress on CampusTruth." />
        <CardSkeletonList count={3} />
      </AppShell>
    );
  }

  const isVerified = profile?.verified ?? false;
  const isCourseRep = roles?.includes("course_rep") ?? false;
  const isAdmin = roles?.includes("admin") ?? false;
  const postCount = myPosts?.length ?? 0;
  const communityCount = communities?.length ?? 0;
  const profileComplete = !!(profile?.full_name && profile?.username && profile?.bio && profile?.avatar_url);

  const badges = [
    {
      label: "Profile complete",
      description: "Add your name, username, bio and photo",
      earned: profileComplete,
      icon: CheckCircle2,
    },
    {
      label: "Community member",
      description: "Join your first community",
      earned: communityCount > 0,
      icon: Users,
    },
    {
      label: "First post",
      description: "Share your first post with campus",
      earned: postCount > 0,
      icon: FileText,
    },
    {
      label: "Conversation starter",
      description: "Write 5 comments",
      earned: (commentCount ?? 0) >= 5,
      icon: MessageSquare,
    },
    {
      label: "Verified student",
      description: "Verified by a CampusTruth admin",
      earned: isVerified,
      icon: BadgeCheck,
    },
    {
      label: "Course rep",
      description: "Granted by an admin for your class",
      earned: isCourseRep,
      icon: GraduationCap,
    },
  ];
  const earnedCount = badges.filter((b) => b.earned).length;
  const badgeProgress = Math.round((earnedCount / badges.length) * 100);

  return (
    <AppShell>
      <PageHeading title="My dashboard" description="Your profile, communities and badge progress." />

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Profile card */}
        <section className="surface-card p-5 lg:col-span-1" aria-label="My profile">
          <div className="flex items-start gap-4">
            <UserAvatar name={profile?.full_name} url={profile?.avatar_url} className="size-16" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-lg font-bold">{profile?.full_name ?? "Student"}</h2>
                {isVerified ? <TrustBadge level="verified" /> : null}
                {isCourseRep ? <TrustBadge level="course_rep" /> : null}
                {isAdmin ? <TrustBadge level="official" /> : null}
              </div>
              {profile?.username ? (
                <p className="text-sm text-muted-foreground">@{profile.username}</p>
              ) : null}
              {profile?.level ? (
                <p className="mt-1 text-xs text-muted-foreground">{profile.level} Level</p>
              ) : null}
            </div>
          </div>
          {profile?.bio ? <p className="mt-3 text-sm text-muted-foreground">{profile.bio}</p> : null}
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-secondary px-2 py-3">
              <p className="text-lg font-bold">{postCount}</p>
              <p className="text-[11px] text-muted-foreground">Posts</p>
            </div>
            <div className="rounded-xl bg-secondary px-2 py-3">
              <p className="text-lg font-bold">{communityCount}</p>
              <p className="text-[11px] text-muted-foreground">Communities</p>
            </div>
            <div className="rounded-xl bg-secondary px-2 py-3">
              <p className="text-lg font-bold">{credits ?? 0}</p>
              <p className="text-[11px] text-muted-foreground">Credits</p>
            </div>
          </div>
          <Button asChild variant="outline" className="mt-4 w-full">
            <Link to="/settings">Edit profile</Link>
          </Button>
        </section>

        {/* Badge tracker */}
        <section className="surface-card p-5 lg:col-span-2" aria-label="Badge tracker">
          <div className="flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <Award className="size-4 text-primary" aria-hidden="true" />
              Badge tracker
            </h2>
            <span className="text-sm text-muted-foreground">
              {earnedCount} of {badges.length} earned
            </span>
          </div>
          <Progress value={badgeProgress} className="mt-3" aria-label="Badge progress" />
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {badges.map((badge) => (
              <li
                key={badge.label}
                className={cn(
                  "flex items-start gap-3 rounded-xl border p-3",
                  badge.earned ? "border-primary/40 bg-lime-soft" : "border-border bg-secondary/50",
                )}
              >
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-lg",
                    badge.earned ? "bg-lime text-lime-foreground" : "bg-muted text-muted-foreground",
                  )}
                >
                  <badge.icon className="size-4" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5 text-sm font-semibold">
                    {badge.label}
                    {badge.earned ? (
                      <CheckCircle2 className="size-3.5 text-primary" aria-label="Earned" />
                    ) : (
                      <Circle className="size-3.5 text-muted-foreground" aria-label="Not yet earned" />
                    )}
                  </span>
                  <span className="block text-xs text-muted-foreground">{badge.description}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Communities joined */}
        <section className="surface-card p-5 lg:col-span-1" aria-label="Communities I joined">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <Users className="size-4 text-primary" aria-hidden="true" />
            My communities
          </h2>
          {communitiesLoading ? (
            <div className="mt-3"><CardSkeletonList count={2} /></div>
          ) : communityCount === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              You haven't joined any communities yet.{" "}
              <Link to="/communities" className="font-medium text-primary underline">
                Browse communities
              </Link>
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {communities!.map((community) => (
                <li key={community.id}>
                  <Link
                    to="/communities/$id"
                    params={{ id: community.id }}
                    className="block rounded-xl bg-secondary px-3 py-2.5 transition-colors hover:bg-secondary/70"
                  >
                    <span className="block truncate text-sm font-medium">{community.name}</span>
                    {community.level ? (
                      <span className="text-xs text-muted-foreground">{community.level} Level</span>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* My posts */}
        <section className="surface-card p-5 lg:col-span-2" aria-label="My posts">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <FileText className="size-4 text-primary" aria-hidden="true" />
            My posts
          </h2>
          {postsLoading ? (
            <div className="mt-3"><CardSkeletonList count={2} /></div>
          ) : postCount === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              You haven't posted yet.{" "}
              <Link to="/home" className="font-medium text-primary underline">
                Share something with campus
              </Link>
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-border">
              {myPosts!.map((post) => (
                <li key={post.id}>
                  <Link
                    to="/posts/$id"
                    params={{ id: post.id }}
                    className="block py-3 transition-colors hover:bg-secondary/50"
                  >
                    <span className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium">
                        {post.title ?? post.content.slice(0, 80)}
                      </span>
                      {post.verified ? <TrustBadge level="verified" /> : null}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {post.category} · {timeAgo(post.created_at)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AppShell>
  );
}
