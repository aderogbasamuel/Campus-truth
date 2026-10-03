import { Plus } from "lucide-react";

/* CHECK these answers before shipping. Each one should match how CampusTruth really works. */
const FAQS = [
  {
    q: "Is CampusTruth run by the university?",
    a: "No. CampusTruth is built by students. We pull from official school sources and always show where each notice came from, so you can check it yourself.",
  },
  {
    q: "Who checks the notices?",
    a: "Every notice is traced back to an official source and dated before it's published. In student discussions, course reps are clearly marked.",
  },
  {
    q: "What if the assistant isn't sure?",
    a: "It says so. Answers are built only from verified campus records, so when there's no verified source, it tells you instead of guessing.",
  },
  {
    q: "Is it free?",
    a: "Yes. Creating an account is free and comes with 25 assistant credits to start.",
  },
  {
    q: "Which campuses are supported?",
    a: "UNILAG first, with more campuses coming soon.",
  },
];

export function Faq() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16" aria-labelledby="faq-heading">
      <div className="grid gap-10 lg:grid-cols-[2fr_3fr] lg:gap-16">
        <div>
          <h2
            id="faq-heading"
            className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl"
          >
            Questions students ask
          </h2>
          <p className="mt-4 max-w-sm text-base leading-relaxed text-primary/70">
            Short answers about how CampusTruth works and what to expect.
          </p>
        </div>

        <div className="space-y-3">
          {FAQS.map(({ q, a }, i) => (
            <details
              key={q}
              open={i === 0}
              className="group rounded-2xl border border-primary/15 bg-white"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-2xl p-5 text-base font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary [&::-webkit-details-marker]:hidden">
                {q}
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                  <Plus
                    className="size-4 transition-transform duration-200 group-open:rotate-45 motion-reduce:transition-none"
                    aria-hidden="true"
                  />
                </span>
              </summary>
              <p className="px-5 pb-5 text-sm leading-relaxed text-primary/70">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Faq;