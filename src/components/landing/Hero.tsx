import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { BadgeCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

/* ------------------------------------------------------------------ */
/* Sample conversations                                                */
/* REPLACE these with real, checkable notices from your records.       */
/* The card is labelled "Sample conversation", but a trust product     */
/* should still only show answers that are actually true.              */
/* ------------------------------------------------------------------ */

const questions = [
  {
    question: "When does second semester registration close?",
    answer: "Registration closes this Friday at 5:00 PM. Late registration attracts a penalty fee.",
    source: "Registrar notice · published 3 days ago",
  },
  {
    question: "Is the CSC 101 exam still holding on Monday?",
    answer:
      "Yes. The faculty timetable lists it for Monday at 9:00 AM. No change has been announced.",
    source: "Faculty exam timetable · updated this week",
  },
  {
    question: "Where do I pay my school fees?",
    answer:
      "Fees are paid through the official student portal only. Ignore any other payment links going around.",
    source: "Bursary notice · published last week",
  },
] as const;

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return reduced;
}

type Phase = "question" | "answer" | "hold";

/* ------------------------------------------------------------------ */
/* Assistant preview card                                              */
/* ------------------------------------------------------------------ */

export function CampusAssistantPreview() {
  const reduced = usePrefersReducedMotion();

  const [index, setIndex] = useState(0);
  const [qLen, setQLen] = useState(0);
  const [aLen, setALen] = useState(0);
  const [phase, setPhase] = useState<Phase>("question");

  const current = questions[index]!;

  // one timer chain drives the whole loop
  useEffect(() => {
    if (reduced) return;

    let timer: ReturnType<typeof setTimeout>;

    if (phase === "question") {
      timer =
        qLen < current.question.length
          ? setTimeout(() => setQLen(qLen + 1), 40)
          : setTimeout(() => setPhase("answer"), 450);
    } else if (phase === "answer") {
      timer =
        aLen < current.answer.length
          ? setTimeout(() => setALen(aLen + 1), 24)
          : setTimeout(() => setPhase("hold"), 3000);
    } else {
      timer = setTimeout(() => {
        setIndex((i) => (i + 1) % questions.length);
        setQLen(0);
        setALen(0);
        setPhase("question");
      }, 400);
    }

    return () => clearTimeout(timer);
  }, [reduced, phase, qLen, aLen, current]);

  // with reduced motion, show a finished conversation and never animate
  const question = reduced ? current.question : current.question.slice(0, qLen);
  const answer = reduced ? current.answer : current.answer.slice(0, aLen);
  const done = reduced || (phase !== "question" && aLen >= current.answer.length);

  const first = questions[0];

  return (
    <div
      role="group"
      aria-label="Sample conversation with the campus assistant"
      className="relative mx-auto w-full max-w-[440px]"
    >
      {/* lime block behind the card */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -rotate-3 translate-x-2 translate-y-3 rounded-[32px] bg-accent"
      />

      <div className="relative overflow-hidden rounded-[28px] bg-primary p-5 text-white shadow-xl">
        {/* screen readers get one static example instead of the typing loop */}
        <p className="sr-only">
          Sample: a student asks "{first.question}" and the assistant replies "{first.answer}" with
          the source: {first.source}.
        </p>

        <div aria-hidden="true">
          {/* header */}
          <div className="mb-5 flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-accent text-accent-foreground">
              <Sparkles className="size-4" />
            </div>
            <div>
              <p className="text-sm font-semibold">Campus Assistant</p>
              <p className="text-xs text-white/70">Sample conversation</p>
            </div>
          </div>

          {/* question */}
          <div className="rounded-2xl bg-white/10 px-4 py-3">
            <p className="text-xs font-medium text-accent">You</p>
            <p className="mt-1 min-h-6 text-sm leading-6">
              {question}
              {!reduced && phase === "question" && (
                <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-accent align-middle" />
              )}
            </p>
          </div>

          {/* answer */}
          <div className="mt-4 px-1">
            <p className="flex items-center gap-1.5 text-xs font-medium text-accent">
              <Sparkles className="size-3.5" />
              CampusTruth AI
            </p>
            <p className="mt-1.5 min-h-[96px] text-[15px] leading-6 text-white/95">
              {answer}
              {!reduced && phase === "answer" && (
                <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-accent align-middle" />
              )}
            </p>
          </div>

          {/* source */}
          <div
            className={`flex items-center gap-2 border-t border-white/10 pt-4 transition-all duration-500 motion-reduce:transition-none ${
              done ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
            }`}
          >
            <BadgeCheck className="size-4 shrink-0 text-accent" />
            <span className="text-xs text-white/70">{current.source}</span>
            <span className="ml-auto rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">
              Verified
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Hero                                                                */
/* ------------------------------------------------------------------ */

const highlight =
  "inline-block rounded-lg bg-accent px-2 -rotate-1 text-accent-foreground [-webkit-box-decoration-break:clone] [box-decoration-break:clone]";

export function Hero() {
  return (
    <section className="relative overflow-hidden text-primary isolate">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 text-primary opacity-20
    [background-image:radial-gradient(currentColor_1px,transparent_1px)]
    [background-size:20px_20px]
    [-webkit-mask-image:linear-gradient(to_bottom,black,transparent_85%)]
    [mask-image:linear-gradient(to_bottom,black,transparent_85%)]"
      />
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-6 pb-20 pt-12 sm:pt-16 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:pt-24">
        {/* copy */}
        <div className="text-center lg:text-left">
          <p className="inline-flex items-center gap-2 rounded-full border border-primary/15 px-3 py-1 text-sm font-medium">
            <span className="size-1.5 rounded-full bg-accent ring-2 ring-primary" />
            Built for UNILAG students
          </p>

          <h1 className="mt-5 text-[40px] font-semibold leading-[1.3] tracking-tight sm:text-5xl lg:text-6xl lg:leading-[1.25]">
            <span className="block">
              Know what's <span className={highlight}>happening.</span>
            </span>
            <span className="block">
              Know what's <span className={highlight}>true.</span>
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-md text-base leading-relaxed text-primary/70 sm:text-lg lg:mx-0">
            Verified updates, real student conversations, and an assistant that only answers from
            official campus records.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
            <Button
              asChild
              size="lg"
              className="h-12 w-full rounded-full bg-accent px-7 text-base text-accent-foreground hover:bg-accent/90 sm:w-auto"
            >
              <Link to="/auth" search={{ mode: "signup" }}>
                Get started
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 w-full rounded-full border-primary/20 bg-transparent px-7 text-base text-primary hover:bg-primary/5 sm:w-auto"
            >
              <Link to="/auth" search={{ mode: "login" }}>
                I already have an account
              </Link>
            </Button>
          </div>
        </div>

        {/* live demo */}
        <div className="px-2 pb-3">
          <CampusAssistantPreview />
        </div>
      </div>
    </section>
  );
}

export default Hero;
