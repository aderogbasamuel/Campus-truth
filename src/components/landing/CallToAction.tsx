import { Link } from "@tanstack/react-router";
import { BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CallToAction() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-16" aria-labelledby="cta-heading">
      <div className="relative overflow-hidden rounded-[2rem] bg-primary px-6 py-10 text-primary-foreground sm:px-12 sm:py-14">
        {/* decorative badge */}
        <BadgeCheck
          aria-hidden="true"
          strokeWidth={1}
          className="pointer-events-none absolute -bottom-12 -right-8 size-64 text-accent/20 sm:size-80"
        />

        <div className="relative max-w-lg">
          <h2 id="cta-heading" className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Start with what's verified.
          </h2>
          <p className="mt-3 text-base leading-relaxed text-primary-foreground/75">
            Create your free account and get 25 assistant credits to begin.
          </p>
          <Button
            asChild
            size="lg"
            className="mt-7 h-12 w-full rounded-full bg-accent px-7 text-base text-accent-foreground hover:bg-accent/90 sm:w-auto"
          >
            <Link to="/auth" search={{ mode: "signup" }}>
              Create free account
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

export default CallToAction;