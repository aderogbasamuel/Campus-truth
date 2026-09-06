import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Bot, ExternalLink, Send, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/campus/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useCredits, useSessionUser } from "@/hooks/useCampusUser";
import { supabase } from "@/integrations/supabase/client";
import { askTrustBot } from "@/lib/ai.functions";
import { friendlyError } from "@/lib/campus";

export const Route = createFileRoute("/_authenticated/ask")({
  head: () => ({
    meta: [
      { title: "Ask TrustBot — CampusTruth" },
      {
        name: "description",
        content:
          "Ask the CampusTruth assistant about UNILAG fees, exams and deadlines — answers cite verified sources.",
      },
      { property: "og:title", content: "Ask TrustBot — CampusTruth" },
      {
        property: "og:description",
        content:
          "Ask the CampusTruth assistant about UNILAG fees, exams and deadlines — answers cite verified sources.",
      },
    ],
  }),
  component: AskPage,
});

const SUGGESTIONS = [
  "When does course registration close?",
  "How much is the acceptance fee?",
  "Where do I collect my exam timetable?",
  "What do I do if my result is missing?",
];

type Source = {
  title: string;
  source_name: string | null;
  source_url: string | null;
  published_at: string | null;
};

type ChatMessage = {
  id: string;
  role: string;
  content: string;
  sources?: Source[] | null;
};

function AskPage() {
  const { userId } = useSessionUser();
  const { data: credits } = useCredits(userId);
  const queryClient = useQueryClient();
  const ask = useServerFn(askTrustBot);

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const messages = useQuery({
    queryKey: ["messages", conversationId],
    enabled: !!conversationId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("id, role, content, sources")
        .eq("conversation_id", conversationId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as ChatMessage[];
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.data, pending]);

  const send = useMutation({
    mutationFn: async (question: string) => {
      setPending(question);
      return ask({ data: { question, conversationId } });
    },
    onSuccess: (result) => {
      setPending(null);
      setDraft("");
      setConversationId(result.conversationId);
      queryClient.invalidateQueries({ queryKey: ["messages", result.conversationId] });
      queryClient.invalidateQueries({ queryKey: ["credits"] });
    },
    onError: (error) => {
      setPending(null);
      toast.error(friendlyError(error, "TrustBot couldn't answer that. Please try again."));
    },
  });

  const submit = (question: string) => {
    const value = question.trim();
    if (value.length < 3) {
      toast.error("Ask a slightly longer question.");
      return;
    }
    send.mutate(value);
  };

  const history = messages.data ?? [];

  return (
    <AppShell>
      <div className="mx-auto flex max-w-2xl flex-col">
        <header className="surface-card mb-4 flex items-center gap-3 p-4">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-lime text-lime-foreground">
            <Bot className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h1 className="text-lg font-bold">TrustBot</h1>
            <p className="text-xs text-muted-foreground">
              Answers only from verified campus records — never guesses.
            </p>
          </div>
          <Badge variant="secondary" className="ml-auto bg-lime-soft text-lime-foreground">
            {credits ?? 0} credits
          </Badge>
        </header>

        <div className="space-y-4">
          {history.length === 0 && !pending ? (
            <div className="surface-card p-5">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-lime-soft text-primary">
                <Sparkles className="size-5" aria-hidden="true" />
              </span>
              <h2 className="mt-3 text-base font-semibold">What would you like to know?</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Campus updates and browsing are always free. Each TrustBot answer uses one credit.
              </p>
              <ul className="mt-4 space-y-2">
                {SUGGESTIONS.map((item) => (
                  <li key={item}>
                    <button
                      type="button"
                      onClick={() => submit(item)}
                      className="w-full rounded-2xl bg-secondary px-4 py-3 text-left text-sm font-medium transition-colors hover:bg-lime-soft"
                    >
                      {item}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {messages.isLoading ? <Skeleton className="h-20 w-full rounded-2xl" /> : null}

          {history.map((message) =>
            message.role === "user" ? (
              <div key={message.id} className="flex justify-end">
                <p className="max-w-[85%] whitespace-pre-line rounded-3xl bg-primary px-4 py-3 text-sm text-primary-foreground">
                  {message.content}
                </p>
              </div>
            ) : (
              <div key={message.id} className="surface-card p-4">
                <p className="whitespace-pre-line text-sm leading-relaxed">{message.content}</p>
                {message.sources?.length ? (
                  <div className="mt-3 border-t border-border pt-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Sources
                    </p>
                    <ul className="mt-2 space-y-1.5">
                      {message.sources.map((source, index) => (
                        <li key={`${message.id}-${index}`} className="text-xs">
                          <span className="font-medium">{source.title}</span>
                          {source.source_name ? (
                            <span className="text-muted-foreground"> — {source.source_name}</span>
                          ) : null}
                          {source.source_url ? (
                            <a
                              href={source.source_url}
                              target="_blank"
                              rel="noreferrer noopener"
                              className="ml-1 inline-flex items-center gap-1 text-primary underline"
                            >
                              open
                              <ExternalLink className="size-3" aria-hidden="true" />
                            </a>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ),
          )}

          {pending ? (
            <>
              <div className="flex justify-end">
                <p className="max-w-[85%] rounded-3xl bg-primary px-4 py-3 text-sm text-primary-foreground">
                  {pending}
                </p>
              </div>
              <div className="surface-card p-4" aria-live="polite">
                <p className="text-sm text-muted-foreground">
                  Checking verified campus records…
                </p>
              </div>
            </>
          ) : null}
          <div ref={bottomRef} />
        </div>

        <form
          className="sticky bottom-24 mt-4 flex items-end gap-2 lg:bottom-4"
          onSubmit={(event) => {
            event.preventDefault();
            submit(draft);
          }}
        >
          <label htmlFor="trustbot-input" className="sr-only">
            Ask TrustBot a question
          </label>
          <Textarea
            id="trustbot-input"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Ask about fees, exams, registration…"
            rows={1}
            className="min-h-12 rounded-2xl bg-card"
          />
          <Button
            type="submit"
            size="icon"
            className="size-12 shrink-0 rounded-2xl"
            aria-label="Send question"
            disabled={send.isPending || !draft.trim()}
          >
            <Send />
          </Button>
        </form>
      </div>
    </AppShell>
  );
}
