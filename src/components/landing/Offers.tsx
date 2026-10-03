const OFFERS = [
  {
    title: "No more searching everywhere",
    body: "We pull updates from multiple campus sources into one clean feed.",
  },
  {
    title: "Stay ahead of deadlines",
    body: "Registration, exams, fees and events, delivered to you early.",
  },
  {
    title: "Clear & verified information",
    body: "Filtered to remove noise, reposts and misinformation.",
  },
  {
    title: "Built specifically for your campus",
    body: "Starting with UNILAG, expanding soon.",
  },
];

/**
 * Scattered sources converge into one verified feed card,
 * which sits on top of a campus building.
 */
function CampusArt() {
  return (
    <svg
      viewBox="0 0 320 370"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="h-full w-full text-primary"
    >
      {/* noisy sources */}
      <g transform="rotate(-8 60 48)">
        <rect x="28" y="28" width="64" height="40" rx="8" />
        <path d="M38 42h30M38 52h18" />
      </g>
      <g transform="rotate(4 156 34)">
        <rect x="124" y="14" width="64" height="40" rx="8" />
        <path d="M134 28h34M134 38h22" />
      </g>
      <g transform="rotate(10 258 54)">
        <rect x="226" y="34" width="64" height="40" rx="8" />
        <path d="M236 48h26M236 58h34" />
      </g>

      {/* funnel lines */}
      <path d="M62 74C62 104 140 96 150 122" strokeDasharray="3 6" />
      <path d="M156 58V122" strokeDasharray="3 6" />
      <path d="M262 80C262 106 182 98 170 122" strokeDasharray="3 6" />

      {/* clean feed card */}
      <rect x="64" y="122" width="192" height="112" rx="16" className="fill-accent" />
      {/* verified badge */}
      <circle cx="94" cy="152" r="12" fill="#fff" />
      <path d="m88 152 4.5 4.5L101 147" strokeWidth={2.5} />
      <path d="M116 147h84M116 158h52" />
      {/* tags */}
      <rect x="82" y="178" width="52" height="20" rx="10" fill="#fff" />
      <path d="M94 188h28" />
      <rect x="142" y="178" width="52" height="20" rx="10" />
      <path d="M154 188h28" />
      {/* deadline clock */}
      <circle cx="226" cy="190" r="14" fill="#fff" />
      <path d="M226 182v8l5 3" />
      <path d="M82 214h92" strokeDasharray="2 5" />

      {/* connector */}
      <path d="M160 234v26" />

      {/* campus building */}
      <path d="M70 292 160 260l90 32Z" fill="#fff" />
      <circle cx="160" cy="280" r="5" />
      <rect x="70" y="292" width="180" height="9" />
      <path d="M90 301v36M125 301v36M160 301v36M195 301v36M230 301v36" strokeWidth={6} />
      <rect x="58" y="337" width="204" height="9" />
      <rect x="46" y="346" width="228" height="9" fill="currentColor" />

      {/* sparkles */}
      <path d="M22 140v16M14 148h16" />
      <path d="M296 120v12M290 126h12" />
      <circle cx="296" cy="300" r="3" fill="currentColor" />
      <circle cx="26" cy="250" r="3" fill="currentColor" />
    </svg>
  );
}

export function Offers() {
  return (
    <div className="mx-auto max-w-6xl py-10">
    <section
      className="overflow-hidden sm:rounded-[2rem] bg-accent px-6 py-12 text-primary sm:px-12 sm:py-16"
      aria-labelledby="offers-heading"
    >
      <h2
        id="offers-heading"
        className="text-3xl font-semibold tracking-tight sm:text-4xl"
      >
        What CampusTruth offers
      </h2>

      <div className="mt-10 grid items-center gap-12 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] md:gap-16">
        {/* illustration: white panel with an offset outline frame */}
        <div className="relative mx-auto w-full max-w-sm md:max-w-none">
          <div
            aria-hidden="true"
            className="absolute inset-0 translate-x-3 translate-y-3 rounded-3xl border-2 border-primary md:-translate-x-4 md:translate-y-4"
          />
          <div
            className="relative aspect-[320/370] rounded-3xl border-2 border-primary bg-white p-5"
            style={{
              backgroundImage:
                "radial-gradient(rgba(22,23,29,0.12) 1px, transparent 1px)",
              backgroundSize: "16px 16px",
            }}
          >
            <CampusArt />
          </div>
        </div>

        {/* timeline */}
        <ol className="relative">
          <span
            aria-hidden="true"
            className="absolute bottom-4 left-[19px] top-4 w-0.5 rounded-full bg-primary/25"
          />
          {OFFERS.map(({ title, body }, i) => (
            <li key={title} className="group relative pb-10 pl-16 last:pb-0">
              <span
                className="absolute left-0 top-0 flex size-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground ring-[6px] ring-accent transition-transform group-hover:scale-110"
              >
                {i + 1}
              </span>
              <h3 className="text-xl font-semibold leading-snug">
                <span className="rounded bg-[length:0%_100%] bg-gradient-to-r from-white to-white bg-no-repeat px-1 transition-[background-size] duration-300 [-webkit-box-decoration-break:clone] [box-decoration-break:clone] group-hover:bg-[length:100%_100%] -ml-1">
                  {title}
                </span>
              </h3>
              <p className="mt-1.5 max-w-sm text-sm leading-relaxed opacity-75">
                {body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
    </div>
  );
}

export default Offers;