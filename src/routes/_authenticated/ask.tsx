import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { BadgeCheck, Bot, ExternalLink, Loader2, Plus, Send, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/campus/AppShell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useCredits, useSessionUser } from "@/hooks/useCampusUser";
import { supabase } from "@/integrations/supabase/client";
import { askTrustBot } from "@/lib/ai.functions";
import { friendlyError, timeAgo } from "@/lib/campus";

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

async function loadMessages(conversationId: string) {
  const { data, error } = await supabase
    .from("messages")
    .select("id, role, content, sources")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as ChatMessage[];
}

function AskPage() {
  const { userId } = useSessionUser();
  const { data: credits } = useCredits(userId);
  const queryClient = useQueryClient();
  const ask = useServerFn(askTrustBot);

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const messages = useQuery({
    queryKey: ["messages", conversationId],
    enabled: !!conversationId,
    queryFn: () => loadMessages(conversationId!),
  });

  const history = messages.data ?? [];
  const outOfCredits = credits !== undefined && credits <= 0;

  // keep the newest message in view (and don't animate for people who asked us not to)
  useEffect(() => {
    if (!messages.data?.length && !pending) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    bottomRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "end" });
  }, [messages.data, pending]);

  const send = useMutation({
    mutationFn: async (question: string) => {
      setPending(question);
      return ask({ data: { question, conversationId } });
    },
    onSuccess: async (result) => {
      // Load the saved messages BEFORE clearing the pending bubble, so the
      // question never blinks out between the answer arriving and the list refreshing.
      await queryClient
        .fetchQuery({
          queryKey: ["messages", result.conversationId],
          queryFn: () => loadMessages(result.conversationId),
        })
        .catch(() => undefined);
      setPending(null);
      setDraft("");
      setConversationId(result.conversationId);
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

  const canSend = !send.isPending && !outOfCredits && draft.trim().length > 0;

  const startNewChat = () => {
    setConversationId(null);
    setDraft("");
    inputRef.current?.focus();
  };

  return (
    <AppShell>
      <div className="mx-auto flex max-w-2xl flex-col">
        {/* identity + credits */}
        <header className="relative mb-4 flex flex-wrap items-center gap-3 overflow-hidden rounded-3xl bg-primary p-4 text-primary-foreground">
          <BadgeCheck
            aria-hidden="true"
            strokeWidth={1}
            className="pointer-events-none absolute -bottom-6 -right-3 size-28 text-accent/15"
          />
          <span className="relative flex size-11 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
            <Bot className="size-5" aria-hidden="true" />
          </span>
          <div className="relative min-w-0 flex-1">
            <h1 className="text-lg font-semibold tracking-tight">TrustBot</h1>
            <p className="text-sm text-primary-foreground/75">
              Answers only from verified campus records. Never guesses.
            </p>
          </div>
          <span className="relative shrink-0 rounded-full bg-accent px-3 py-1 text-xs font-medium tabular-nums text-accent-foreground">
            {credits ?? 0} credits
          </span>
        </header>

        {history.length > 0 ? (
          <div className="mb-3 flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full border-primary/20 bg-transparent hover:bg-primary/5"
              onClick={startNewChat}
              disabled={send.isPending}
            >
              <Plus aria-hidden="true" />
              New chat
            </Button>
          </div>
        ) : null}

        <div role="log" aria-label="Conversation with TrustBot" className="space-y-4">
          {history.length === 0 && !pending ? (
            <section className="rounded-3xl border border-primary/15 bg-white p-5 sm:p-6">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                <Sparkles className="size-5" aria-hidden="true" />
              </span>
              <h2 className="mt-3 text-lg font-semibold tracking-tight">
                What would you like to know?
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-primary/70">
                Campus updates and browsing are always free. Each TrustBot answer uses one credit.
              </p>
              <ul className="mt-4 space-y-2">
                {SUGGESTIONS.map((item) => (
                  <li key={item}>
                    <button
                      type="button"
                      disabled={send.isPending || outOfCredits}
                      onClick={() => submit(item)}
                      className="w-full rounded-2xl bg-muted px-4 py-3 text-left text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:hover:bg-muted disabled:hover:text-inherit"
                    >
                      {item}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {messages.isLoading ? <Skeleton className="h-24 w-full rounded-3xl" /> : null}

          {messages.isError ? (
            <div className="rounded-3xl border border-primary/15 bg-white p-4 text-sm">
              <p className="font-medium">We couldn't load this conversation.</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3 rounded-full"
                onClick={() => messages.refetch()}
              >
                Try again
              </Button>
            </div>
          ) : null}

          {history.map((message) =>
            message.role === "user" ? (
              <div key={message.id} className="flex justify-end">
                <p className="max-w-[85%] whitespace-pre-line rounded-3xl rounded-br-lg bg-primary px-4 py-3 text-sm leading-relaxed text-primary-foreground">
                  {message.content}
                </p>
              </div>
            ) : (
              <div key={message.id} className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground"
                >
                  <Sparkles className="size-4" />
                </span>
                <div className="min-w-0 flex-1 rounded-3xl rounded-tl-lg border border-primary/15 bg-white p-4">
                  <p className="sr-only">TrustBot says:</p>
                  <p className="whitespace-pre-line text-[15px] leading-relaxed">
                    {message.content}
                  </p>

                  {message.sources?.length ? (
                    <div className="mt-4 border-t border-primary/10 pt-3">
                      <p className="flex items-center gap-1.5 text-sm font-semibold">
                        <BadgeCheck className="size-4" aria-hidden="true" />
                        Sources
                      </p>
                      <ul className="mt-2 space-y-2">
                        {message.sources.map((source, index) => (
                          <li
                            key={`${message.id}-${index}`}
                            className="rounded-2xl bg-muted px-3 py-2.5 text-sm"
                          >
                            <span className="block font-medium leading-snug">{source.title}</span>
                            {source.source_name || source.published_at ? (
                              <span className="mt-0.5 block text-primary/60">
                                {source.source_name}
                                {source.source_name && source.published_at ? " · " : ""}
                                {source.published_at ? timeAgo(source.published_at) : ""}
                              </span>
                            ) : null}
                            {source.source_url ? (
                              <a
                                href={source.source_url}
                                target="_blank"
                                rel="noreferrer noopener"
                                className="mt-1.5 inline-flex items-center gap-1 font-semibold text-primary underline underline-offset-2"
                              >
                                Open source
                                <ExternalLink className="size-3.5" aria-hidden="true" />
                                <span className="sr-only"> (opens in a new tab)</span>
                              </a>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              </div>
            ),
          )}

          {pending ? (
            <>
              <div className="flex justify-end">
                <p className="max-w-[85%] whitespace-pre-line rounded-3xl rounded-br-lg bg-primary px-4 py-3 text-sm leading-relaxed text-primary-foreground">
                  {pending}
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground"
                >
                  <Sparkles className="size-4" />
                </span>
                <div className="flex items-center gap-3 rounded-3xl rounded-tl-lg border border-primary/15 bg-white px-4 py-3">
                  <span className="flex items-center gap-1" aria-hidden="true">
                    {[0, 1, 2].map((dot) => (
                      <span
                        key={dot}
                        className="size-1.5 rounded-full bg-primary/50 motion-safe:animate-bounce"
                        style={{ animationDelay: `${dot * 120}ms` }}
                      />
                    ))}
                  </span>
                  <span className="text-sm text-primary/70" role="status">
                    Checking verified campus records…
                  </span>
                </div>
              </div>
            </>
          ) : null}
          <div ref={bottomRef} />
        </div>

        {/* composer */}
        <div className="sticky bottom-24 -mx-4 mt-4 bg-gradient-to-t from-background via-background to-transparent px-4 pb-2 pt-4 lg:bottom-0">
          {outOfCredits ? (
            <p
              role="status"
              className="mb-3 rounded-2xl border border-primary/15 bg-muted px-4 py-3 text-sm leading-relaxed"
            >
              You're out of credits, so TrustBot is paused.{" "}
              <Link to="/updates" className="font-semibold underline underline-offset-2">
                Campus updates
              </Link>{" "}
              are still free to read.
            </p>
          ) : null}

          <form
            className="flex items-center gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (canSend) submit(draft);
            }}
          >
            <label htmlFor="trustbot-input" className="sr-only">
              Ask TrustBot a question
            </label>
            <Textarea
              ref={inputRef}
              id="trustbot-input"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                // Enter sends, Shift+Enter adds a line. Touch keyboards keep Enter as a new line.
                if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
                if (!window.matchMedia("(pointer: fine)").matches) return;
                event.preventDefault();
                if (canSend) submit(draft);
              }}
              placeholder={outOfCredits ? "No credits left" : "Ask about fees, exams, registration…"}
              rows={1}
              disabled={outOfCredits}
              className="field-sizing-fixed h-12 min-h-12 max-h-12 resize-none overflow-y-auto rounded-3xl border-primary/20 bg-white px-4 py-[13px] leading-5"
            />
            <Button
              type="submit"
              size="icon"
              className="size-12 shrink-0 rounded-full bg-accent text-accent-foreground hover:bg-accent/90"
              aria-label="Send question"
              disabled={!canSend}
            >
              {send.isPending ? (
                <Loader2 className="animate-spin" aria-hidden="true" />
              ) : (
                <Send aria-hidden="true" />
              )}
            </Button>
          </form>
          <p className="mt-2 px-2 text-xs text-primary/60 [@media(pointer:coarse)]:hidden">
            Enter to send · Shift+Enter for a new line
          </p>
        </div>
      </div>
    </AppShell>
  );
}
