import { BadgeCheck, GraduationCap, Landmark, Users } from "lucide-react";

import { cn } from "@/lib/utils";

export type TrustLevel = "official" | "verified" | "course_rep" | "student";

// `accent` is the lime, so Verified owns it. Course Rep gets a primary tint
// instead, otherwise the two badges would look identical.
const CONFIG: Record<TrustLevel, { label: string; icon: typeof BadgeCheck; className: string }> = {
  official: {
    label: "Official",
    icon: Landmark,
    className: "bg-primary text-primary-foreground",
  },
  verified: {
    label: "Verified",
    icon: BadgeCheck,
    className: "bg-accent text-accent-foreground",
  },
  course_rep: {
    label: "Course Rep",
    icon: GraduationCap,
    className: "border border-primary/25 bg-primary/10 text-primary",
  },
  student: {
    label: "Student",
    icon: Users,
    className: "bg-muted text-primary/70",
  },
};

export function TrustBadge({ level, className }: { level: TrustLevel; className?: string }) {
  const config = CONFIG[level];
  const Icon = config.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
        config.className,
        className,
      )}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {config.label}
    </span>
  );
}