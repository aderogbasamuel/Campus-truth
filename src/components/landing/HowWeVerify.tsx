import { BadgeCheck, Bot, FileSearch, ShieldCheck } from "lucide-react";

/* REPLACE this copy with your real verification process.
   Only claim what you actually do: on a trust product, accuracy is the pitch. */
const STEPS = [
  {
    Icon: FileSearch,
    title: "We start from official sources",
    body: "Notices come from the school's own channels, like the registrar, faculty and department offices.",
  },
  {
    Icon: ShieldCheck,
    title: "We check and date every notice",
    body: "Each one is matched to its original and stamped with a publish date. If it can't be traced, it doesn't go out.",
  },
  {
    Icon: BadgeCheck,
    title: "You see the proof, not just the post",
    body: "Every notice shows its source, date and a confidence badge, so you can judge it yourself.",
  },
];

export function HowWeVerify() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16" aria-labelledby="verify-heading">
      <div className="max-w-xl">
        <h2
          id="verify-heading"
          className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl"
        >
          How we verify what you read
        </h2>
        <p className="mt-4 text-base leading-relaxed text-primary/70 sm:text-lg">
          Every update shows where it came from, and the assistant admits when it doesn't know.
        </p>
      </div>

      <div className="mt-12 grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        {/* steps */}
        <ol className="space-y-8">
          {STEPS.map(({ Icon, title, body }) => (
            <li key={title} className="flex gap-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-accent text-accent-foreground">
                <Icon className="size-6" aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-lg font-semibold leading-snug">{title}</h3>
                <p className="mt-1 max-w-sm text-sm leading-relaxed text-primary/70">{body}</p>
              </div>
            </li>
          ))}
        </ol>

        {/* examples (illustrative) */}
        <div className="mx-auto w-full max-w-md space-y-5">
          {/* verified notice */}
          <article className="rounded-3xl border border-primary bg-white p-5 shadow-[0_5px_0_0] shadow-primary">
            <p className="text-xs font-medium text-primary/60">Example notice</p>
            <h3 className="mt-2 text-base font-semibold leading-snug">
              Second semester registration closes Friday
            </h3>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs text-primary/60">Source</dt>
                <dd className="mt-0.5 font-medium">Registrar's office</dd>
              </div>
              <div>
                <dt className="text-xs text-primary/60">Published</dt>
                <dd className="mt-0.5 font-medium">3 days ago</dd>
              </div>
            </dl>
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-primary/10 pt-4">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground">
                <BadgeCheck className="size-3.5" aria-hidden="true" />
                Verified
              </span>
              <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-primary/70">
                High confidence
              </span>
            </div>
          </article>

          {/* assistant admits it doesn't know */}
          <article className="rounded-3xl bg-primary p-5 text-primary-foreground">
            <p className="flex items-center gap-2 text-xs font-medium text-accent">
              <Bot className="size-4" aria-hidden="true" />
              TrustBot · example
            </p>
            <p className="mt-3 rounded-2xl bg-white/10 px-4 py-3 text-sm">
              Is the hostel fee going up next session?
            </p>
            <p className="mt-3 px-1 text-[15px] leading-relaxed text-primary-foreground/90">
              I can't find a verified source for that, so I won't guess. Here's the latest official
              fee notice I do have.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}

export default HowWeVerify;