import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, Flag, MessagesSquare, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/campus/AppShell";
import { EmptyState } from "@/components/campus/EmptyState";
import { ReportDialog } from "@/components/campus/ReportDialog";
import { UserAvatar } from "@/components/campus/UserAvatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useSessionUser } from "@/hooks/useCampusUser";
import { supabase } from "@/integrations/supabase/client";
import { friendlyError, timeAgo } from "@/lib/campus";

export const Route = createFileRoute("/_authenticated/qa/$id")({
  head: () => ({
    meta: [
      { title: "Question — CampusTruth" },
      { name: "description", content: "Read student answers to this campus question." },
      { property: "og:title", content: "Question — CampusTruth" },
      { property: "og:description", content: "Read student answers to this campus question." },
    ],
  }),
  component: QuestionDetail,
});

type AnswerRow = {
  id: string;
  content: string;
  created_at: string;
  author_id: string;
  is_best: boolean;
  author: { full_name: string | null; avatar_url: string | null; verified: boolean } | null;
};

function QuestionDetail() {
  const { id } = Route.useParams();
  const { userId } = useSessionUser();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState("");

  const question = useQuery({
    queryKey: ["question", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("questions")
        .select(
          "id, title, content, views, created_at, author_id, author:profiles!questions_author_id_fkey(full_name, avatar_url, verified)",
        )
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as
        | {
            id: string;
            title: string;
            content: string | null;
            views: number;
            created_at: string;
            author_id: string;
            author: { full_name: string | null; avatar_url: string | null; verified: boolean } | null;
          }
        | null;
    },
  });

  // Count the read once per visit so the list stays honest.
  useEffect(() => {
    if (!question.data) return;
    void supabase
      .from("questions")
      .update({ views: question.data.views + 1 })
      .eq("id", id);
  }, [question.data?.id]);

  const answers = useQuery({
    queryKey: ["answers", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("answers")
        .select(
          "id, content, created_at, author_id, is_best, author:profiles!answers_author_id_fkey(full_name, avatar_url, verified)",
        )
        .eq("question_id", id)
        .order("is_best", { ascending: false })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as AnswerRow[];
    },
  });

  const addAnswer = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("Please sign in first.");
      const content = draft.trim();
      if (content.length < 4) throw new Error("Write a slightly longer answer.");
      const { error } = await supabase
        .from("answers")
        .insert({ question_id: id, author_id: userId, content });
      if (error) throw error;
    },
    onSuccess: () => {
      setDraft("");
      queryClient.invalidateQueries({ queryKey: ["answers", id] });
      queryClient.invalidateQueries({ queryKey: ["questions"] });
    },
    onError: (error) => toast.error(friendlyError(error)),
  });

  const markBest = useMutation({
    mutationFn: async (answerId: string) => {
      const { error } = await supabase.from("answers").update({ is_best: true }).eq("id", answerId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Marked as the best answer");
      queryClient.invalidateQueries({ queryKey: ["answers", id] });
    },
    onError: (error) => toast.error(friendlyError(error)),
  });

  const removeAnswer = useMutation({
    mutationFn: async (answerId: string) => {
      const { error } = await supabase.from("answers").delete().eq("id", answerId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["answers", id] }),
    onError: (error) => toast.error(friendlyError(error)),
  });

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl">
        <Link
          to="/qa"
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          All questions
        </Link>

        {question.isLoading ? (
          <div className="surface-card space-y-3 p-5">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ) : question.data ? (
          <article className="surface-card p-5">
            <div className="flex items-center gap-3">
              <UserAvatar
                name={question.data.author?.full_name}
                url={question.data.author?.avatar_url}
                className="size-9"
              />
              <div>
                <p className="text-sm font-semibold">
                  {question.data.author?.full_name ?? "CampusTruth student"}
                </p>
                <p className="text-xs text-muted-foreground">{timeAgo(question.data.created_at)}</p>
              </div>
              <ReportDialog targetType="question" targetId={id}>
                <Button variant="ghost" size="icon" className="ml-auto" aria-label="Report question">
                  <Flag className="size-4" />
                </Button>
              </ReportDialog>
            </div>
            <h1 className="mt-4 text-xl font-bold leading-snug">{question.data.title}</h1>
            {question.data.content ? (
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">
                {question.data.content}
              </p>
            ) : null}
          </article>
        ) : (
          <EmptyState
            icon={MessagesSquare}
            title="This question isn't available"
            description="It may have been removed. Browse the other student questions instead."
          />
        )}

        <h2 className="mb-3 mt-6 text-base font-semibold">
          {answers.data?.length ?? 0} answer{answers.data?.length === 1 ? "" : "s"}
        </h2>

        {answers.isLoading ? (
          <Skeleton className="h-20 w-full rounded-2xl" />
        ) : answers.data?.length ? (
          <ul className="space-y-3">
            {answers.data.map((answer) => (
              <li key={answer.id} className="surface-card p-4">
                <div className="flex items-center gap-3">
                  <UserAvatar
                    name={answer.author?.full_name}
                    url={answer.author?.avatar_url}
                    className="size-8"
                  />
                  <span className="text-sm font-semibold">
                    {answer.author?.full_name ?? "Student"}
                  </span>
                  {answer.is_best ? (
                    <Badge className="bg-lime text-lime-foreground">Best answer</Badge>
                  ) : null}
                  <span className="text-xs text-muted-foreground">
                    {timeAgo(answer.created_at)}
                  </span>
                  <div className="ml-auto flex items-center gap-1">
                    {question.data?.author_id === userId && !answer.is_best ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Mark as best answer"
                        onClick={() => markBest.mutate(answer.id)}
                      >
                        <CheckCircle2 className="size-4" />
                      </Button>
                    ) : null}
                    <ReportDialog targetType="answer" targetId={answer.id}>
                      <Button variant="ghost" size="icon" aria-label="Report answer">
                        <Flag className="size-3.5" />
                      </Button>
                    </ReportDialog>
                    {answer.author_id === userId ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Delete answer"
                        onClick={() => removeAnswer.mutate(answer.id)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    ) : null}
                  </div>
                </div>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">{answer.content}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            No answers yet. If you know this one, help a fellow student out.
          </p>
        )}

        <form
          className="mt-4 space-y-2"
          onSubmit={(event) => {
            event.preventDefault();
            addAnswer.mutate();
          }}
        >
          <label htmlFor="answer-input" className="text-sm font-medium">
            Your answer
          </label>
          <Textarea
            id="answer-input"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Share what you know — and where you learned it."
            className="bg-card"
          />
          <Button type="submit" disabled={addAnswer.isPending || !draft.trim()}>
            {addAnswer.isPending ? "Posting…" : "Post answer"}
          </Button>
        </form>
      </div>
    </AppShell>
  );
}
