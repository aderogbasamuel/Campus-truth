import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CircleHelp,
  Menu,
  MessagesSquare,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const NAV_LINKS = [
  { to: "/ask", label: "Campus Assistant", Icon: Sparkles },
  { to: "/qa", label: "Q&A", Icon: CircleHelp },
  { to: "/communities", label: "Communities", Icon: Users },
] as const;

export function Navbar() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  // Escape closes the mobile menu
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="relative z-40 px-4 pt-4">
      {/* tap outside to close (mobile only) */}
      {open && <div className="fixed inset-0 md:hidden" aria-hidden="true" onClick={close} />}

      <div className="relative mx-auto max-w-6xl">
        <div className="flex items-center justify-between gap-2 rounded-full border border-primary/10 bg-white py-2.5 pl-3 pr-2.5">
          {/* logo */}
          <Link to="/" onClick={close} className="flex items-center gap-2.5">
            <span className="flex size-10 items-center justify-center rounded-xl border border-primary/20 bg-accent text-accent-foreground">
              <MessagesSquare className="size-5" aria-hidden="true" />
            </span>
            <span className="text-lg font-semibold tracking-tight">CampusTruth</span>
          </Link>

          {/* desktop links */}
          <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className="rounded-full px-4 py-2 text-sm font-medium text-primary/70 transition-colors hover:bg-primary/5 hover:text-primary"
                activeProps={{ className: "bg-primary/5 text-primary" }}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* desktop actions */}
          <div className="hidden items-center gap-2 md:flex">
            <Button asChild variant="ghost" className="rounded-full">
              <Link to="/auth" search={{ mode: "login" }}>
                Log in
              </Link>
            </Button>
            <Button
              asChild
              className="rounded-full bg-accent text-accent-foreground hover:bg-accent/90"
            >
              <Link to="/auth" search={{ mode: "signup" }}>
                Get started
              </Link>
            </Button>
          </div>

          {/* mobile menu button */}
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-menu"
            className="flex size-11 items-center justify-center rounded-full border border-primary/30 bg-background transition-all duration-200 hover:bg-primary/5 active:scale-95 md:hidden"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>

        {/* mobile dropdown: `invisible` when closed so links can't be tabbed to */}
        <div
          id="mobile-menu"
          className={`absolute inset-x-0 top-full mt-2 origin-top rounded-[28px] border border-primary/10 bg-white p-3 shadow-lg shadow-primary/5 transition duration-200 motion-reduce:transition-none md:hidden ${
            open ? "visible translate-y-0 opacity-100" : "invisible -translate-y-2 opacity-0"
          }`}
        >
          <nav aria-label="Mobile" className="space-y-1">
            {NAV_LINKS.map(({ to, label, Icon }) => (
              <Link
                key={to}
                to={to}
                onClick={close}
                className="flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-medium transition-colors hover:bg-primary/5"
              >
                <Icon className="size-5 text-primary" aria-hidden="true" />
                {label}
              </Link>
            ))}
          </nav>

          <div className="my-3 h-px bg-primary/10" />

          <div className="space-y-1">
            <Link
              to="/auth"
              search={{ mode: "signup" }}
              onClick={close}
              className="flex w-full items-center justify-between rounded-full bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
            >
              Get started
              <span className="flex size-8 items-center justify-center rounded-full bg-accent text-accent-foreground">
                <ArrowRight className="size-4" aria-hidden="true" />
              </span>
            </Link>
            <Link
              to="/auth"
              search={{ mode: "login" }}
              onClick={close}
              className="block rounded-full px-5 py-3 text-center text-sm font-medium transition-colors hover:bg-primary/5"
            >
              I already have an account
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;