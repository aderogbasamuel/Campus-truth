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

const PRIMARY_NAV = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/updates", label: "Updates", icon: Newspaper },
  { to: "/saved", label: "Saved", icon: Save },
  { to: "/settings", label: "Settings", icon: Settings },
  { to: "/ask", label: "TrustBot", icon: Bot },
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
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-7xl">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-1 border-r border-border bg-sidebar px-4 py-6 lg:flex">
          <Link to="/home" className="mb-6 flex items-center gap-2 px-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-lime text-lime-foreground">
              <MessagesSquare className="size-5" aria-hidden="true" />
            </span>
            <span className="text-lg font-bold">
              Campus<span className="text-muted-foreground">Truth</span>
            </span>
          </Link>
          <nav className="flex flex-col gap-1" aria-label="Main navigation">
            {DESKTOP_NAV.map((item) => {
              const active = pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-lime text-lime-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
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
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  pathname.startsWith("/admin")
                    ? "bg-lime text-lime-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                <Shield className="size-4" aria-hidden="true" />
                Admin
              </Link>
            ) : null}
          </nav>
          <Link
            to="/settings"
            className="mt-auto flex items-center gap-3 rounded-xl bg-secondary px-3 py-3 text-left"
          >
            <UserAvatar name={profile?.full_name} url={profile?.avatar_url} className="size-9" />
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">
                {profile?.full_name ?? "Your profile"}
              </span>
              <span className="block text-xs text-muted-foreground">{credits ?? 0} credits</span>
            </span>
          </Link>
        </aside>

        <div className="min-w-0 flex-1 pb-24 lg:pb-0">
          <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur lg:hidden">
            <Link to="/home" className="flex items-center gap-2">
              <UserAvatar name={profile?.full_name} url={profile?.avatar_url} className="size-9" />
              <span className="text-base font-bold">
                Campus<span className="text-muted-foreground">Truth</span>
              </span>
            </Link>
            <div className="ml-auto flex items-center gap-1">
              <Link
                to="/notifications"
                aria-label="Notifications"
                className="relative flex size-10 items-center justify-center rounded-xl text-foreground hover:bg-secondary"
              >
                <Bell className="size-5" aria-hidden="true" />
                {unread ? (
                  <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-destructive" />
                ) : null}
              </Link>
              <Link
                to="/search"
                aria-label="Search"
                className="flex size-10 items-center justify-center rounded-xl text-foreground hover:bg-secondary"
              >
                <Search className="size-5" aria-hidden="true" />
              </Link>
            </div>
          </header>

          <main className="px-4 py-4 md:px-6 lg:px-8 lg:py-8">{children}</main>
        </div>
      </div>

      <nav
        aria-label="Mobile navigation"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background px-2 pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        <ul className="flex items-center justify-between">
          {PRIMARY_NAV.map((item) => {
            const active = pathname.startsWith(item.to);
            return (
              <li key={item.to} className="flex-1">
                <Link
                  to={item.to}
                  aria-label={item.label}
                  className="flex flex-col items-center gap-1 py-2"
                >
                  <span
                    className={cn(
                      "flex size-11 items-center justify-center rounded-2xl transition-colors",
                      active ? "bg-lime text-lime-foreground" : "text-foreground",
                    )}
                  >
                    <item.icon className="size-5" aria-hidden="true" />
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
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <span className="h-6 w-1 rounded-full bg-primary" aria-hidden="true" />
          {title}
        </h1>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
