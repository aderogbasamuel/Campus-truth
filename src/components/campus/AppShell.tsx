import { Link, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  Bot,
  Home,
  Newspaper,
  Save,
  Search,
  Settings,
  Shield,
  Users,
  MessagesSquare,
} from "lucide-react";
import type { ReactNode } from "react";

import { UserAvatar } from "@/components/campus/UserAvatar";
import { Badge } from "@/components/ui/badge";
import { useCredits, useProfile, useRoles, useSessionUser, useUnreadCount } from "@/hooks/useCampusUser";
import { cn } from "@/lib/utils";

// TrustBot sits in the middle: it's the flagship feature and the easiest spot to reach.
const PRIMARY_NAV = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/updates", label: "Updates", icon: Newspaper },
  { to: "/ask", label: "TrustBot", icon: Bot },
  { to: "/saved", label: "Saved", icon: Save },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

const DESKTOP_NAV = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/updates", label: "Campus updates", icon: Newspaper },
  { to: "/ask", label: "TrustBot", icon: Bot },
  { to: "/qa", label: "Q&A", icon: MessagesSquare },
  { to: "/communities", label: "Communities", icon: Users },
  { to: "/saved", label: "Saved", icon: Save },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/search", label: "Search", icon: Search },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { userId } = useSessionUser();
  const { data: profile } = useProfile(userId);
  const { data: roles } = useRoles(userId);
  const { data: credits } = useCredits(userId);
  const { data: unread } = useUnreadCount(userId);
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isAdmin = roles?.includes("admin");

  return (
    <div className="min-h-screen bg-background font-sans">
      <div className="mx-auto flex w-full max-w-7xl">
        {/* desktop sidebar */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-1 border-r border-primary/10 bg-sidebar px-4 py-6 lg:flex">
          <Link to="/home" className="mb-6 flex items-center gap-2.5 px-2">
            <span className="flex size-9 items-center justify-center rounded-xl border border-primary/20 bg-accent text-accent-foreground">
              <MessagesSquare className="size-5" aria-hidden="true" />
            </span>
            <span className="text-lg font-semibold tracking-tight">
              Campus<span className="text-primary/60">Truth</span>
            </span>
          </Link>
          <nav className="flex flex-col gap-1" aria-label="Main navigation">
            {DESKTOP_NAV.map((item) => {
              const active = pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-accent text-accent-foreground"
                      : "text-primary/70 hover:bg-primary/5 hover:text-primary",
                  )}
                >
                  <item.icon className="size-4" aria-hidden="true" />
                  {item.label}
                  {item.to === "/notifications" && unread ? (
                    <Badge className="ml-auto bg-primary text-primary-foreground">{unread}</Badge>
                  ) : null}
                </Link>
              );
            })}
            {isAdmin ? (
              <Link
                to="/admin"
                aria-current={pathname.startsWith("/admin") ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  pathname.startsWith("/admin")
                    ? "bg-accent text-accent-foreground"
                    : "text-primary/70 hover:bg-primary/5 hover:text-primary",
                )}
              >
                <Shield className="size-4" aria-hidden="true" />
                Admin
              </Link>
            ) : null}
          </nav>
          <Link
            to="/settings"
            className="mt-auto flex items-center gap-3 rounded-2xl border border-primary/10 bg-white px-3 py-3 text-left transition-colors hover:bg-primary/5"
          >
            <UserAvatar name={profile?.full_name} url={profile?.avatar_url} className="size-9" />
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">
                {profile?.full_name ?? "Your profile"}
              </span>
              <span className="block text-xs text-primary/60">{credits ?? 0} credits</span>
            </span>
          </Link>
        </aside>

        <div className="min-w-0 flex-1 pb-28 lg:pb-0">
          {/* mobile top bar */}
          <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-primary/10 bg-background/90 px-4 py-3 backdrop-blur lg:hidden">
            <Link to="/home" className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-xl border border-primary/20 bg-accent text-accent-foreground">
                <MessagesSquare className="size-5" aria-hidden="true" />
              </span>
              <span className="text-base font-semibold tracking-tight">
                Campus<span className="text-primary/60">Truth</span>
              </span>
            </Link>
            <div className="ml-auto flex items-center gap-1">
              <Link
                to="/notifications"
                aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
                className="relative flex size-10 items-center justify-center rounded-xl hover:bg-primary/5"
              >
                <Bell className="size-5" aria-hidden="true" />
                {unread ? (
                  <span
                    aria-hidden="true"
                    className="absolute right-1.5 top-1.5 size-2 rounded-full bg-destructive"
                  />
                ) : null}
              </Link>
              <Link
                to="/search"
                aria-label="Search"
                className="flex size-10 items-center justify-center rounded-xl hover:bg-primary/5"
              >
                <Search className="size-5" aria-hidden="true" />
              </Link>
            </div>
          </header>

          <main className="px-4 py-4 md:px-6 lg:px-8 lg:py-8">{children}</main>
        </div>
      </div>

      {/* mobile bottom nav, now with visible labels */}
      <nav
        aria-label="Mobile navigation"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-primary/10 bg-background px-2 pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        <ul className="flex items-center justify-between">
          {PRIMARY_NAV.map((item) => {
            const active = pathname.startsWith(item.to);
            return (
              <li key={item.to} className="flex-1">
                <Link
                  to={item.to}
                  aria-current={active ? "page" : undefined}
                  className="flex flex-col items-center gap-0.5 py-2"
                >
                  <span
                    className={cn(
                      "flex h-8 w-14 items-center justify-center rounded-full transition-colors",
                      active ? "bg-accent text-accent-foreground" : "text-primary/70",
                    )}
                  >
                    <item.icon className="size-5" aria-hidden="true" />
                  </span>
                  <span
                    className={cn(
                      "text-xs font-medium",
                      active ? "text-primary" : "text-primary/60",
                    )}
                  >
                    {item.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

export function PageHeading({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <span className="h-6 w-1 rounded-full bg-primary" aria-hidden="true" />
          {title}
        </h1>
        {description ? <p className="mt-1 text-sm text-primary/60">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}