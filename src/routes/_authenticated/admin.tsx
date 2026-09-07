import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { EyeOff, Megaphone, ShieldCheck, Users } from "lucide-react";
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

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl">
        <PageHeading
          title="Admin dashboard"
          description="Keep CampusTruth accurate: review reports, verify students, publish updates."
        />

        <div className="mb-5 grid grid-cols-3 gap-3">
          {[
            { label: "Students", value: data?.stats.students ?? 0 },
            { label: "Questions", value: data?.stats.questions ?? 0 },
            { label: "Open reports", value: data?.stats.openReports ?? 0 },
          ].map((stat) => (
            <div key={stat.label} className="surface-card p-4">
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        <Tabs defaultValue="reports">
          <TabsList className="mb-4">
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="people">Students</TabsTrigger>
            <TabsTrigger value="publish">Publish update</TabsTrigger>
          </TabsList>

          <TabsContent value="reports">
            {overview.isLoading ? (
              <CardSkeletonList count={3} />
            ) : data?.reports.length ? (
              <ul className="space-y-3">
                {data.reports.map((report: any) => (
                  <li key={report.id} className="surface-card p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{report.target_type}</Badge>
                      <Badge
                        className={
                          report.status === "open"
                            ? "bg-destructive text-destructive-foreground"
                            : "bg-lime text-lime-foreground"
                        }
                      >
                        {report.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {timeAgo(report.created_at)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-semibold">{report.reason}</p>
                    {report.details ? (
                      <p className="mt-1 text-sm text-muted-foreground">{report.details}</p>
                    ) : null}
                    {report.status === "open" ? (
                      <div className="mt-3 flex gap-2">
                        <Button
                          size="sm"
                          onClick={() =>
                            reportAction.mutate({ id: report.id, status: "resolved" })
                          }
                        >
                          Mark resolved
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
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

          <TabsContent value="posts">
            {overview.isLoading ? (
              <CardSkeletonList count={3} />
            ) : (
              <ul className="space-y-3">
                {(data?.posts ?? []).map((post: any) => (
                  <li key={post.id} className="surface-card p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{post.category}</Badge>
                      {post.verified ? (
                        <Badge className="bg-lime text-lime-foreground">Verified</Badge>
                      ) : null}
                      {post.removed ? <Badge variant="destructive">Hidden</Badge> : null}
                      <span className="text-xs text-muted-foreground">
                        {timeAgo(post.created_at)}
                      </span>
                    </div>
                    {post.title ? <p className="mt-2 font-semibold">{post.title}</p> : null}
                    <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{post.content}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
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
                        onClick={() => postAction.mutate({ id: post.id, removed: !post.removed })}
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

          <TabsContent value="people">
            {overview.isLoading ? (
              <CardSkeletonList count={3} />
            ) : (
              <ul className="space-y-3">
                {(data?.profiles ?? []).map((person: any) => (
                  <li key={person.id} className="surface-card flex flex-wrap items-center gap-3 p-4">
                    <Users className="size-4 text-muted-foreground" aria-hidden="true" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{person.full_name ?? "Student"}</p>
                      <p className="text-xs text-muted-foreground">
                        {person.username ? `@${person.username}` : "no username"}
                        {person.level ? ` · ${person.level} level` : ""}
                      </p>
                    </div>
                    {person.verified ? (
                      <Badge className="bg-lime text-lime-foreground">Verified</Badge>
                    ) : null}
                    <div className="ml-auto flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          statusAction.mutate({ userId: person.id, verified: !person.verified })
                        }
                      >
                        {person.verified ? "Unverify" : "Verify student"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => statusAction.mutate({ userId: person.id, role: "course_rep" })}
                      >
                        Make course rep
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>

          <TabsContent value="publish">
            <form
              className="surface-card space-y-3 p-4"
              onSubmit={(event) => {
                event.preventDefault();
                publish.mutate();
              }}
            >
              <p className="flex items-center gap-2 text-sm font-semibold">
                <Megaphone className="size-4" aria-hidden="true" />
                Publish a verified campus update
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="a-title">Title</Label>
                <Input
                  id="a-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Second semester registration deadline"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="a-content">Details</Label>
                <Textarea
                  id="a-content"
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  placeholder="Exactly what the official notice says."
                  rows={5}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="a-source">Source name</Label>
                  <Input
                    id="a-source"
                    value={sourceName}
                    onChange={(event) => setSourceName(event.target.value)}
                    placeholder="UNILAG Student Affairs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="a-url">Source link (optional)</Label>
                  <Input
                    id="a-url"
                    value={sourceUrl}
                    onChange={(event) => setSourceUrl(event.target.value)}
                    placeholder="https://unilag.edu.ng/…"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Published updates are also added to the assistant's verified knowledge, so TrustBot
                can cite them.
              </p>
              <Button type="submit" disabled={publish.isPending}>
                {publish.isPending ? "Publishing…" : "Publish update"}
              </Button>
            </form>

            {data?.announcements.length ? (
              <ul className="mt-4 space-y-2">
                {data.announcements.map((item: any) => (
                  <li key={item.id} className="surface-card p-3 text-sm">
                    <span className="font-medium">{item.title}</span>
                    <span className="block text-xs text-muted-foreground">
                      {item.source_name ?? "CampusTruth"} · {timeAgo(item.published_at)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
