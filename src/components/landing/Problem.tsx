import { X } from "lucide-react";

const PAIN_POINTS = [
  "Notices scattered across group chats, social media and notice boards",
  "Reposts with no source and no date",
  "Rumours that spread faster than corrections",
];

// Illustrative only: these are made-up examples of the kind of messages students see.
const RUMOURS = [
  { text: "Exam has been moved to Friday, I just heard", tag: "No source", tilt: "-rotate-2" },
  { text: "No o, it's still Monday. Check the group", tag: "Forwarded", tilt: "rotate-1 sm:ml-8" },
  { text: "Registration extended, pay before it closes!!", tag: "No date", tilt: "-rotate-1" },
];

export function Problem() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16" aria-labelledby="problem-heading">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        {/* copy */}
        <div>
          <h2
            id="problem-heading"
            className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl"
          >
            The problem with campus information
          </h2>
          <p className="mt-4 max-w-md text-base leading-relaxed text-primary/70 sm:text-lg">
            Important updates get buried in group chats, reposted without a source and changed along
            the way. By the time you hear about a deadline, it may already be wrong or gone.
          </p>

          <ul className="mt-8 space-y-3">
            {PAIN_POINTS.map((point) => (
              <li key={point} className="flex items-start gap-3 text-sm sm:text-base">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <X className="size-3" strokeWidth={3} aria-hidden="true" />
                </span>
                {point}
              </li>
            ))}
          </ul>
        </div>

        {/* messy messages, purely decorative */}
        <div aria-hidden="true" className="mx-auto w-full max-w-md">
          <ul className="space-y-3">
            {RUMOURS.map(({ text, tag, tilt }) => (
              <li
                key={text}
                className={`rounded-2xl border border-primary/15 bg-white p-4 shadow-[0_4px_0_0] shadow-primary/10 ${tilt}`}
              >
                <p className="text-sm leading-relaxed">{text}</p>
                <span className="mt-3 inline-block rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-primary/70">
                  {tag}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-center text-xs text-primary/50">
            Illustrative examples of messages students see
          </p>
        </div>
      </div>
    </section>
  );
}

export default Problem;