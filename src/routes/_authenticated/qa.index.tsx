import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Eye, MessagesSquare, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell, PageHeading } from "@/components/campus/AppShell";
import { EmptyState } from "@/components/campus/EmptyState";
import { CardSkeletonList } from "@/components/campus/LoadingSkeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useProfile, useSessionUser } from "@/hooks/useCampusUser";
import { supabase } from "@/integrations/supabase/client";
import { UNILAG_ID, friendlyError, timeAgo } from "@/lib/campus";

export const Route = createFileRoute("/_authenticated/qa/")({
  head: () => ({
    meta: [
      { title: "Student Q&A — CampusTruth" },
      {
        name: "description",
        content: "Ask fellow UNILAG students a question and get answers from people who know.",
      },
      { property: "og:title", content: "Student Q&A — CampusTruth" },
      {
        property: "og:description",
        content: "Ask fellow UNILAG students a question and get answers from people who know.",
      },
    ],
  }),
  component: QuestionsPage,
});

function QuestionsPage() {
  const { userId } = useSessionUser();
  const { data: profile } = useProfile(userId);
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const questions = useQuery({
    queryKey: ["questions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("questions")
        .select("id, title, content, views, created_at, author_id, level")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      const rows = data ?? [];
      if (!rows.length) return [] as (typeof rows[number] & { answers: number })[];

      const { data: answers } = await supabase
        .from("answers")
        .select("question_id")
        .in(
          "question_id",
          rows.map((row) => row.id),
        );
      const counts = new Map<string, number>();
      (answers ?? []).forEach((row) => {
        counts.set(row.question_id, (counts.get(row.question_id) ?? 0) + 1);
      });
      return rows.map((row) => ({ ...row, answers: counts.get(row.id) ?? 0 }));
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("Please sign in first.");
      if (title.trim().length < 8) throw new Error("Give your question a clearer title.");
      const { error } = await supabase.from("questions").insert({
        author_id: userId,
        school_id: UNILAG_ID,
        faculty_id: profile?.faculty_id ?? null,
        department_id: profile?.department_id ?? null,
        level: profile?.level ?? null,
        title: title.trim(),
        content: content.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Your question is live");
      setTitle("");
      setContent("");
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["questions"] });
    },
    onError: (error) => toast.error(friendlyError(error)),
  });

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl">
        <PageHeading
          title="Student Q&A"
          description="Real answers from students who have been through it."
          action={
            <Button onClick={() => setOpen((value) => !value)}>
              <Plus />
              Ask a question
            </Button>
          }
        />

        {open ? (
          <form
            className="surface-card mb-4 space-y-3 p-4"
            onSubmit={(event) => {
              event.preventDefault();
              create.mutate();
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="question-title">Your question</Label>
              <Input
                id="question-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="How do I fix a missing course result?"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="question-detail">More detail (optional)</Label>
              <Textarea
                id="question-detail"
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder="Add anything that helps people answer accurately."
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={create.isPending}>
                {create.isPending ? "Posting…" : "Post question"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        ) : null}

        {questions.isLoading ? (
          <CardSkeletonList count={4} />
        ) : questions.data?.length ? (
          <ul className="space-y-3">
            {questions.data.map((question) => (
              <li key={question.id}>
                <Link
                  to="/qa/$id"
                  params={{ id: question.id }}
                  className="surface-card block p-4 transition-colors hover:bg-secondary/50"
                >
                  <h2 className="font-semibold">{question.title}</h2>
                  {question.content ? (
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {question.content}
                    </p>
                  ) : null}
                  <p className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MessagesSquare className="size-3.5" aria-hidden="true" />
                      {question.answers} answer{question.answers === 1 ? "" : "s"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="size-3.5" aria-hidden="true" />
                      {question.views}
                    </span>
                    <span>{timeAgo(question.created_at)}</span>
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={MessagesSquare}
            title="No questions yet"
            description="Be the first to ask — students across your faculty can answer."
            action={<Button onClick={() => setOpen(true)}>Ask a question</Button>}
          />
        )}
      </div>
    </AppShell>
  );
}
