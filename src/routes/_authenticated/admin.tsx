import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { EyeOff, Loader2, Megaphone, ShieldCheck, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell, PageHeading } from "@/components/campus/AppShell";
import { EmptyState } from "@/components/campus/EmptyState";
import { CardSkeletonList } from "@/components/campus/LoadingSkeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useRoles, useSessionUser } from "@/hooks/useCampusUser";
import {
  getAdminOverview,
  moderatePost,
  publishAnnouncement,
  resolveReport,
  setStudentStatus,
} from "@/lib/admin.functions";
import { UNILAG_ID, friendlyError, timeAgo } from "@/lib/campus";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin dashboard — CampusTruth" },
      { name: "description", content: "Moderate reports, verify students and publish campus updates." },
      { property: "og:title", content: "Admin dashboard — CampusTruth" },
      {
        property: "og:description",
        content: "Moderate reports, verify students and publish campus updates.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

const CARD = "rounded-3xl border border-primary/15 bg-white";
const TAB =
  "rounded-full px-4 py-2 text-sm font-medium text-primary/70 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm";
const VERIFIED_PILL = "border-transparent bg-accent text-accent-foreground hover:bg-accent";

function AdminPage() {
  const { userId } = useSessionUser();
  const { data: roles, isLoading: rolesLoading } = useRoles(userId);
  const isAdmin = roles?.includes("admin");
  const queryClient = useQueryClient();

  const loadOverview = useServerFn(getAdminOverview);
  const doResolve = useServerFn(resolveReport);
  const doModerate = useServerFn(moderatePost);
  const doStatus = useServerFn(setStudentStatus);
  const doPublish = useServerFn(publishAnnouncement);

  const overview = useQuery({
    queryKey: ["admin", "overview"],
    enabled: !!isAdmin,
    queryFn: () => loadOverview({}),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin", "overview"] });
  const onError = (error: unknown) => toast.error(friendlyError(error));

  const reportAction = useMutation({
    mutationFn: (input: { id: string; status: "resolved" | "dismissed" }) => doResolve({ data: input }),
    onSuccess: () => {
      toast.success("Report updated");
      refresh();
    },
    onError,
  });

  const postAction = useMutation({
    mutationFn: (input: { id: string; removed?: boolean; verified?: boolean }) =>
      doModerate({ data: input }),
    onSuccess: () => {
      toast.success("Post updated");
      refresh();
    },
    onError,
  });

  const statusAction = useMutation({
    mutationFn: (input: {
      userId: string;
      verified?: boolean;
      role?: "student" | "course_rep" | "admin";
    }) => doStatus({ data: input }),
    onSuccess: () => {
      toast.success("Student updated");
      refresh();
    },
    onError,
  });

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [sourceName, setSourceName] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");

  const publish = useMutation({
    mutationFn: () =>
      doPublish({
        data: {
          title: title.trim(),
          content: content.trim(),
          sourceName: sourceName.trim() || undefined,
          sourceUrl: sourceUrl.trim() || "",
          schoolId: UNILAG_ID,
        },
      }),
    onSuccess: () => {
      toast.success("Update published to every student");
      setTitle("");
      setContent("");
      setSourceName("");
      setSourceUrl("");
      refresh();
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
    },
    onError,
  });

  if (rolesLoading) {
    return (
      <AppShell>
        <CardSkeletonList count={3} />
      </AppShell>
    );
  }

  if (!isAdmin) {
    return (
      <AppShell>
        <EmptyState
          icon={ShieldCheck}
          title="Admin only"
          description="These tools are limited to the CampusTruth verification team."
        />
      </AppShell>
    );
  }

  const data = overview.data;
  const canPublish = title.trim().length > 0 && content.trim().length > 0;

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl">
        <PageHeading
          title="Admin dashboard"
          description="Keep CampusTruth accurate: review reports, verify students, publish updates."
        />

        {/* stats */}
        <dl className="mb-6 grid grid-cols-3 gap-3">
          {[
            { label: "Students", value: data?.stats.students ?? 0, alert: false },
            { label: "Questions", value: data?.stats.questions ?? 0, alert: false },
            { label: "Open reports", value: data?.stats.openReports ?? 0, alert: true },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`${CARD} p-4 ${stat.alert && stat.value > 0 ? "border-primary bg-accent" : ""}`}
            >
              <dd className="text-3xl font-semibold tabular-nums tracking-tight">{stat.value}</dd>
              <dt
                className={`mt-0.5 text-sm ${
                  stat.alert && stat.value > 0 ? "text-accent-foreground/80" : "text-primary/60"
                }`}
              >
                {stat.label}
              </dt>
            </div>
          ))}
        </dl>

        <Tabs defaultValue="reports">
          <TabsList className="mb-4 h-auto w-full justify-start gap-1 overflow-x-auto rounded-full bg-muted p-1 sm:w-auto">
            <TabsTrigger value="reports" className={TAB}>
              Reports
            </TabsTrigger>
            <TabsTrigger value="posts" className={TAB}>
              Posts
            </TabsTrigger>
            <TabsTrigger value="people" className={TAB}>
              Students
            </TabsTrigger>
            <TabsTrigger value="publish" className={TAB}>
              Publish update
            </TabsTrigger>
          </TabsList>

          {/* reports */}
          <TabsContent value="reports">
            {overview.isLoading ? (
              <CardSkeletonList count={3} />
            ) : data?.reports.length ? (
              <ul className="space-y-3">
                {data.reports.map((report: any) => (
                  <li key={report.id} className={`${CARD} p-4`}>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className="bg-muted text-primary/70">
                        {report.target_type}
                      </Badge>
                      <Badge
                        className={
                          report.status === "open"
                            ? "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive"
                            : VERIFIED_PILL
                        }
                      >
                        {report.status}
                      </Badge>
                      <span className="text-sm text-primary/60">{timeAgo(report.created_at)}</span>
                    </div>
                    <p className="mt-2 text-sm font-semibold">{report.reason}</p>
                    {report.details ? (
                      <p className="mt-1 text-sm text-primary/70">{report.details}</p>
                    ) : null}
                    {report.status === "open" ? (
                      <div className="mt-3 flex gap-2">
                        <Button
                          size="sm"
                          className="rounded-full"
                          disabled={reportAction.isPending}
                          onClick={() =>
                            reportAction.mutate({ id: report.id, status: "resolved" })
                          }
                        >
                          Mark resolved
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="rounded-full"
                          disabled={reportAction.isPending}
                          onClick={() =>
                            reportAction.mutate({ id: report.id, status: "dismissed" })
                          }
                        >
                          Dismiss
                        </Button>
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={ShieldCheck}
                title="No reports"
                description="Nothing has been reported by students yet."
              />
            )}
          </TabsContent>

          {/* posts */}
          <TabsContent value="posts">
            {overview.isLoading ? (
              <CardSkeletonList count={3} />
            ) : (
              <ul className="space-y-3">
                {(data?.posts ?? []).map((post: any) => (
                  <li key={post.id} className={`${CARD} p-4`}>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className="bg-muted text-primary/70">
                        {post.category}
                      </Badge>
                      {post.verified ? <Badge className={VERIFIED_PILL}>Verified</Badge> : null}
                      {post.removed ? <Badge variant="destructive">Hidden</Badge> : null}
                      <span className="text-sm text-primary/60">{timeAgo(post.created_at)}</span>
                    </div>
                    {post.title ? <p className="mt-2 font-semibold">{post.title}</p> : null}
                    <p className="mt-1 line-clamp-3 text-sm text-primary/70">{post.content}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full border-primary/20 bg-transparent hover:bg-primary/5"
                        disabled={postAction.isPending}
                        onClick={() =>
                          postAction.mutate({ id: post.id, verified: !post.verified })
                        }
                      >
                        <ShieldCheck />
                        {post.verified ? "Remove verified mark" : "Mark as verified"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-full"
                        disabled={postAction.isPending}
                        onClick={() => {
                          // hiding removes it from every student's feed, so confirm first
                          if (
                            post.removed ||
                            window.confirm("Hide this post from every student's feed?")
                          ) {
                            postAction.mutate({ id: post.id, removed: !post.removed });
                          }
                        }}
                      >
                        <EyeOff />
                        {post.removed ? "Restore" : "Hide from feed"}
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>

          {/* students */}
          <TabsContent value="people">
            {overview.isLoading ? (
              <CardSkeletonList count={3} />
            ) : (
              <ul className="space-y-3">
                {(data?.profiles ?? []).map((person: any) => (
                  <li key={person.id} className={`${CARD} flex flex-wrap items-center gap-3 p-4`}>
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-primary/70">
                      <Users className="size-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{person.full_name ?? "Student"}</p>
                      <p className="text-sm text-primary/60">
                        {person.username ? `@${person.username}` : "no username"}
                        {person.level ? ` · ${person.level} level` : ""}
                      </p>
                    </div>
                    {person.verified ? <Badge className={VERIFIED_PILL}>Verified</Badge> : null}
                    <div className="ml-auto flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full border-primary/20 bg-transparent hover:bg-primary/5"
                        disabled={statusAction.isPending}
                        onClick={() =>
                          statusAction.mutate({ userId: person.id, verified: !person.verified })
                        }
                      >
                        {person.verified ? "Unverify" : "Verify student"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-full"
                        disabled={statusAction.isPending}
                        onClick={() => {
                          // course-rep badges carry trust, so make it a deliberate click
                          if (
                            window.confirm(
                              `Make ${person.full_name ?? "this student"} a course rep? Their posts will carry the Course Rep badge.`,
                            )
                          ) {
                            statusAction.mutate({ userId: person.id, role: "course_rep" });
                          }
                        }}
                      >
                        Make course rep
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>

          {/* publish */}
          <TabsContent value="publish">
            <form
              className={`${CARD} space-y-4 p-5 sm:p-6`}
              onSubmit={(event) => {
                event.preventDefault();
                if (!canPublish) return;
                // this goes to every student and into TrustBot's knowledge, so confirm
                if (window.confirm("Publish this update to every student?")) {
                  publish.mutate();
                }
              }}
            >
              <p className="flex items-center gap-2 text-base font-semibold">
                <span className="flex size-8 items-center justify-center rounded-full bg-accent text-accent-foreground">
                  <Megaphone className="size-4" aria-hidden="true" />
                </span>
                Publish a verified campus update
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="a-title">Title</Label>
                <Input
                  id="a-title"
                  className="h-12 rounded-xl"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Second semester registration deadline"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="a-content">Details</Label>
                <Textarea
                  id="a-content"
                  className="rounded-xl"
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  placeholder="Exactly what the official notice says."
                  rows={5}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="a-source">Source name</Label>
                  <Input
                    id="a-source"
                    className="h-12 rounded-xl"
                    value={sourceName}
                    onChange={(event) => setSourceName(event.target.value)}
                    placeholder="UNILAG Student Affairs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="a-url">Source link (optional)</Label>
                  <Input
                    id="a-url"
                    type="url"
                    className="h-12 rounded-xl"
                    value={sourceUrl}
                    onChange={(event) => setSourceUrl(event.target.value)}
                    placeholder="https://unilag.edu.ng/…"
                  />
                </div>
              </div>
              <p className="text-sm text-primary/60">
                Published updates are also added to the assistant's verified knowledge, so TrustBot
                can cite them.
              </p>
              <Button
                type="submit"
                disabled={publish.isPending || !canPublish}
                className="h-12 rounded-full bg-accent px-8 text-base text-accent-foreground hover:bg-accent/90"
              >
                {publish.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    Publishing…
                  </>
                ) : (
                  "Publish update"
                )}
              </Button>
            </form>

            {data?.announcements.length ? (
              <div className="mt-6">
                <h2 className="mb-2 text-sm font-semibold text-primary/70">Recently published</h2>
                <ul className="space-y-2">
                  {data.announcements.map((item: any) => (
                    <li key={item.id} className={`${CARD} p-3 text-sm`}>
                      <span className="font-medium">{item.title}</span>
                      <span className="block text-sm text-primary/60">
                        {item.source_name ?? "CampusTruth"} · {timeAgo(item.published_at)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}