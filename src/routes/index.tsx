import { Link, createFileRoute } from "@tanstack/react-router";
import {
  BadgeCheck,
  Bot,
  BookOpen,
  Bus,
  Calendar,
  GraduationCap,
  Landmark,
  Library,
  MessagesSquare,
  Newspaper,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CampusTruth — Your campus, decoded" },
      {
        name: "description",
        content:
          "Verified University of Lagos updates, student answers and an AI campus assistant grounded in trusted sources.",
      },
      { property: "og:title", content: "CampusTruth — Your campus, decoded" },
      {
        property: "og:description",
        content:
          "Verified UNILAG updates, real student answers and a campus assistant that never guesses.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const SCATTER = [
  { Icon: GraduationCap, className: "left-6 top-10 size-8 rotate-[-12deg]" },
  { Icon: BookOpen, className: "right-8 top-16 size-7 rotate-[10deg]" },
  { Icon: Bus, className: "left-12 top-40 size-7 rotate-[8deg]" },
  { Icon: Calendar, className: "right-12 top-44 size-8 rotate-[-8deg]" },
  { Icon: Library, className: "left-4 bottom-56 size-7 rotate-[14deg]" },
  { Icon: Wallet, className: "right-6 bottom-60 size-7 rotate-[-14deg]" },
  { Icon: Landmark, className: "left-1/2 top-24 size-6 rotate-[6deg]" },
];

const FEATURES = [
  {
    Icon: BadgeCheck,
    title: "Verified first",
    body: "Official notices carry their source, publish date and a confidence badge.",
  },
  {
    Icon: Bot,
    title: "TrustBot",
    body: "Answers built only from verified campus records — it says so when it doesn't know.",
  },
  {
    Icon: MessagesSquare,
    title: "Real students",
    body: "Ask your faculty, department and level. Course reps are clearly marked.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <section className="relative overflow-hidden bg-primary px-6 pb-14 pt-16 text-primary-foreground">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-25">
          {SCATTER.map(({ Icon, className }, index) => (
            <Icon key={index} className={`absolute ${className}`} />
          ))}
        </div>
        <div className="relative mx-auto max-w-3xl text-center">
          <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-lime text-lime-foreground">
            <MessagesSquare className="size-7" aria-hidden="true" />
          </span>
          <p className="mt-5 text-lg font-bold tracking-tight">
            Campus<span className="opacity-70">Truth</span>
          </p>
          <h1 className="mt-6 text-4xl font-extrabold leading-tight sm:text-5xl">
            Your campus, decoded
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm opacity-80 sm:text-base">
            Verified information for University of Lagos students — announcements you can trust,
            answers from people on your course, and an assistant that never invents dates or fees.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button asChild size="lg" className="w-full bg-lime text-lime-foreground hover:bg-lime/90 sm:w-auto">
              <Link to="/auth" search={{ mode: "signup" }}>
                Get started
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="w-full border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 sm:w-auto"
            >
              <Link to="/auth" search={{ mode: "login" }}>
                I already have an account
              </Link>
            </Button>
          </div>
          <p className="mt-4 text-xs opacity-60">Powered by AI • UNILAG pilot</p>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-3 px-4 py-10 sm:grid-cols-3">
        {FEATURES.map(({ Icon, title, body }) => (
          <article key={title} className="surface-card p-5">
            <span className="flex size-10 items-center justify-center rounded-xl bg-lime-soft text-primary">
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <h2 className="mt-4 text-base font-semibold">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{body}</p>
          </article>
        ))}
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-16">
        <div className="surface-card flex flex-wrap items-center justify-between gap-4 p-6">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <Newspaper className="size-5 text-primary" aria-hidden="true" />
              Start with what's verified
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Create your free account and get 25 assistant credits to begin.
            </p>
          </div>
          <Button asChild size="lg">
            <Link to="/auth" search={{ mode: "signup" }}>
              Create free account
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
