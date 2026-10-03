import { Link } from "@tanstack/react-router";
import { MessagesSquare } from "lucide-react";
import { NAV_LINKS } from "./Navbar";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-primary/10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link to="/" className="flex items-center gap-2.5 font-semibold">
            <span className="flex size-8 items-center justify-center rounded-lg border border-primary/20 bg-accent text-accent-foreground">
              <MessagesSquare className="size-4" aria-hidden="true" />
            </span>
            CampusTruth
          </Link>
          <p className="mt-2 text-sm text-primary/60">
            Verified campus updates for UNILAG students.
          </p>
        </div>

        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium">
          {NAV_LINKS.map((link: (typeof NAV_LINKS)[number]) => (
            <Link key={link.to} to={link.to} className="text-primary/70 transition-colors hover:text-primary">
              {link.label}
            </Link>
          ))}
          <Link
            to="/auth"
            search={{ mode: "login" }}
            className="text-primary/70 transition-colors hover:text-primary"
          >
            Log in
          </Link>
        </nav>
      </div>

      <p className="px-6 pb-8 text-center text-xs text-primary/50">© {year} CampusTruth</p>
    </footer>
  );
}

export default Footer;