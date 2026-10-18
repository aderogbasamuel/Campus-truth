import { Link } from "@tanstack/react-router";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";

type LegalLayoutProps = {
  title: string;
  description: string;
  updated: string;
  children: ReactNode;
};

export default function LegalLayout({
  title,
  description,
  updated,
  children,
}: LegalLayoutProps) {
  return (
    <div className="min-h-screen bg-white text-[#28443F]">
      <header className="border-b border-[#28443F]/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
          <Link to="/" className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-[#F2FD7D]">
              <ShieldCheck className="size-6 text-[#28443F]" />
            </span>

            <span className="text-xl font-bold tracking-tight">
              Campus<span className="text-[#6D7C24]">Truth</span>
            </span>
          </Link>

          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-[#28443F]/15 px-4 py-2 text-sm font-medium transition hover:bg-[#28443F]/5"
          >
            <ArrowLeft className="size-4" />
            Back to home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="mb-10 border-b border-[#28443F]/10 pb-8">
          <span className="mb-4 inline-flex rounded-full bg-[#F2FD7D] px-3 py-1 text-xs font-semibold uppercase tracking-wider">
            CampusTruth · Legal
          </span>

          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            {title}
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-7 text-[#28443F]/75">
            {description}
          </p>

          <p className="mt-5 text-sm text-[#28443F]/60">
            Last updated: {updated}
          </p>
        </div>

        <article className="legal-content">{children}</article>

        <div className="mt-14 rounded-2xl bg-[#28443F] p-6 text-white sm:p-8">
          <div className="max-w-2xl">
            <h2 className="text-xl font-semibold">
              Questions about these documents?
            </h2>

            <p className="mt-2 text-sm leading-6 text-white/75">
              Contact the CampusTruth team for questions about your privacy,
              account, or use of the platform.
            </p>

            <a
              href="mailto:campustruth.team@gmail.com"
              className="mt-4 inline-flex rounded-full bg-[#F2FD7D] px-5 py-3 text-sm font-semibold text-[#28443F] transition hover:opacity-90"
            >
              Contact CampusTruth
            </a>
          </div>
        </div>

        <footer className="mt-10 flex flex-wrap gap-x-6 gap-y-3 border-t border-[#28443F]/10 pt-6 text-sm">
          <Link to="/" className="hover:underline">
            Home
          </Link>
          <Link to="/privacy" className="hover:underline">
            Privacy Policy
          </Link>
          <Link to="/terms" className="hover:underline">
            Terms of Service
          </Link>
        </footer>
      </main>

      <style>{`
        .legal-content h2 {
          margin-top: 2.5rem;
          margin-bottom: 0.75rem;
          font-size: 1.35rem;
          line-height: 1.4;
          font-weight: 700;
          letter-spacing: -0.025em;
        }

        .legal-content h3 {
          margin-top: 1.5rem;
          margin-bottom: 0.5rem;
          font-size: 1.05rem;
          font-weight: 650;
        }

        .legal-content p {
          margin-top: 0.75rem;
          color: #28443F;
          line-height: 1.85;
        }

        .legal-content ul {
          margin-top: 0.75rem;
          padding-left: 1.5rem;
          list-style: disc;
        }

        .legal-content li {
          margin-top: 0.5rem;
          padding-left: 0.25rem;
          line-height: 1.75;
        }

        .legal-content a {
          text-decoration: underline;
          text-underline-offset: 3px;
        }
      `}</style>
    </div>
  );
}