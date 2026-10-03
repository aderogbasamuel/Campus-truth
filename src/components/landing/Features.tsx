import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";

/* ------------------------------------------------------------------ */
/* SVG illustrations — line art, they inherit colour via currentColor  */
/* ------------------------------------------------------------------ */

const svgProps = {
  viewBox: "0 0 120 100",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  className: "h-full w-full",
};

/** Magnifier with a check, a globe and a sparkle */
function VerifiedArt() {
  return (
    <svg {...svgProps}>
      {/* sparkle */}
      <path d="M22 14v14M15 21h14M17 16l10 10M27 16 17 26" />
      {/* magnifier */}
      <circle cx="68" cy="42" r="22" />
      <circle cx="68" cy="42" r="15" strokeDasharray="2 4" />
      <path d="m84 58 18 20" strokeWidth={4} />
      <path d="m58 43 7 7 13-15" strokeWidth={2.5} />
      {/* globe */}
      <circle cx="26" cy="78" r="11" />
      <ellipse cx="26" cy="78" rx="5" ry="11" />
      <path d="M15 78h22" />
      {/* connector */}
      <path d="M37 78h18v-9" />
      <circle cx="55" cy="66" r="2" fill="currentColor" />
      <circle cx="104" cy="22" r="2" fill="currentColor" />
    </svg>
  );
}

/** Two chat bubbles, one marked as a course rep */
function StudentsArt() {
  return (
    <svg {...svgProps}>
      {/* bubble 1 */}
      <path d="M16 14h54a6 6 0 0 1 6 6v22a6 6 0 0 1-6 6H38l-12 10V48h-10a6 6 0 0 1-6-6V20a6 6 0 0 1 6-6Z" />
      <circle cx="30" cy="31" r="2" fill="currentColor" />
      <circle cx="43" cy="31" r="2" fill="currentColor" />
      <circle cx="56" cy="31" r="2" fill="currentColor" />
      {/* bubble 2 */}
      <path d="M52 56h46a6 6 0 0 1 6 6v18a6 6 0 0 1-6 6H92v10L80 86H52a6 6 0 0 1-6-6V62a6 6 0 0 1 6-6Z" />
      <path d="M58 68h34M58 76h20" />
      {/* course rep badge */}
      <circle cx="98" cy="18" r="10" />
      <path d="m98 12 2 4.2 4.5.6-3.3 3.1.8 4.5-4-2.2-4 2.2.8-4.5-3.3-3.1 4.5-.6Z" />
    </svg>
  );
}

/** Bot face wired to circuit lines */
function BotArt() {
  return (
    <svg {...svgProps}>
      {/* antenna */}
      <path d="M60 24V12" />
      <circle cx="60" cy="9" r="3" />
      {/* head */}
      <rect x="36" y="24" width="48" height="44" rx="12" />
      <rect x="28" y="38" width="8" height="16" rx="3" />
      <rect x="84" y="38" width="8" height="16" rx="3" />
      <circle cx="50" cy="44" r="4" />
      <circle cx="70" cy="44" r="4" />
      <path d="M50 57c4 4 16 4 20 0" />
      {/* circuits */}
      <path d="M28 46H14v22h18" />
      <circle cx="32" cy="68" r="2" fill="currentColor" />
      <path d="M92 46h14V30" />
      <circle cx="106" cy="27" r="2" fill="currentColor" />
      <path d="M60 68v14h22" />
      <circle cx="85" cy="82" r="2" fill="currentColor" />
      {/* sparkle */}
      <path d="M100 74v12M94 80h12" />
    </svg>
  );
}

/** Calendar with a clock overlay */
function DeadlinesArt() {
  return (
    <svg {...svgProps}>
      <rect x="22" y="22" width="64" height="56" rx="7" />
      <path d="M22 38h64" />
      <path d="M40 15v14M68 15v14" strokeWidth={2.5} />
      {/* date dots */}
      <circle cx="38" cy="50" r="1.8" fill="currentColor" />
      <circle cx="54" cy="50" r="1.8" fill="currentColor" />
      <circle cx="70" cy="50" r="1.8" fill="currentColor" />
      <circle cx="38" cy="64" r="1.8" fill="currentColor" />
      <circle cx="54" cy="64" r="1.8" fill="currentColor" />
      {/* clock */}
      <circle cx="86" cy="72" r="16" strokeWidth={2} />
      <path d="M86 62v10l7 5" strokeWidth={2} />
      {/* sparkle */}
      <path d="M104 14v12M98 20h12" />
      <circle cx="12" cy="50" r="2" fill="currentColor" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Data                                                                */
/* ------------------------------------------------------------------ */

type Variant = "light" | "lime" | "dark";

type Feature = {
  title: string;
  body: string;
  variant: Variant;
  href: string;
  Art: () => ReactNode;
};

const FEATURES: Feature[] = [
  {
    title: "Verified first",
    body: "Official notices carry their source, publish date and a confidence badge.",
    variant: "light",
    href: "#verified",
    Art: VerifiedArt,
  },
  {
    title: "Real students",
    body: "Ask your faculty, department and level. Course reps are clearly marked.",
    variant: "lime",
    href: "#students",
    Art: StudentsArt,
  },
  {
    title: "TrustBot",
    body: "Answers built only from verified campus records. It says so when it doesn't know.",
    variant: "dark",
    href: "#trustbot",
    Art: BotArt,
  },
  {
    // the extra one
    title: "Events & deadlines",
    body: "Registration windows, exams and campus events in one place, with reminders before they close.",
    variant: "light",
    href: "#deadlines",
    Art: DeadlinesArt,
  },
];

/* ------------------------------------------------------------------ */
/* Styles per variant                                                  */
/* ------------------------------------------------------------------ */

const STYLES: Record<
  Variant,
  { card: string; highlight: string; body: string; btn: string; art: string }
> = {
  light: {
    card: "bg-muted text-primary",
    highlight: "bg-accent text-primary",
    body: "text-primary/70",
    btn: "bg-primary text-white",
    art: "text-primary",
  },
  lime: {
    card: "bg-accent text-primary",
    highlight: "bg-white text-primary",
    body: "text-primary/75",
    btn: "bg-primary text-white",
    art: "text-primary",
  },
  dark: {
    card: "bg-primary text-white",
    highlight: "bg-white text-primary",
    body: "text-white/70",
    btn: "bg-white text-primary",
    art: "text-white",
  },
};

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export function Features() {
  return (
    <section className="mx-auto grid max-w-6xl gap-5 px-4 py-10 sm:grid-cols-2">
      
  <h2
    id="features-heading"
    className="max-w-xl text-3xl font-semibold tracking-tight sm:text-4xl"
  >
    Everything in one place, checked before you see it.
  </h2>
      {FEATURES.map(({ title, body, variant, href, Art }) => {
        const s = STYLES[variant];
        return (
          <article
            key={title}
            className={`relative flex min-h-[220px] flex-col justify-between overflow-hidden rounded-3xl border border-primary p-6 shadow-[0_5px_0_0] shadow-primary ${s.card}`}
          >
            {/* illustration, sits on the right */}
            <div
              className={`pointer-events-none absolute -right-2 top-4 h-32 w-40 sm:h-36 sm:w-44 ${s.art}`}
            >
              <Art />
            </div>

            {/* text */}
            <div className="relative max-w-[62%]">
              <h3 className="text-lg font-semibold leading-snug">
                <span
                  className={`box-decoration-clone rounded px-1.5 py-0.5 leading-[1.8] ${s.highlight}`}
                >
                  {title}
                </span>
              </h3>
              <p className={`mt-3 text-sm leading-relaxed ${s.body}`}>{body}</p>
            </div>

            {/* learn more */}
            <a
              href={href}
              className="group relative mt-6 inline-flex w-fit items-center gap-2.5 text-sm font-medium focus-visible:outline-none"
            >
              <span
                className={`flex size-8 items-center justify-center rounded-full transition-transform group-hover:rotate-12 group-focus-visible:ring-2 group-focus-visible:ring-offset-2 ${s.btn}`}
              >
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </span>
              Learn more
              <span className="sr-only"> about {title}</span>
            </a>
          </article>
        );
      })}
    </section>
  );
}

export default Features;