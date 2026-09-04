import { BadgeCheck, GraduationCap, Landmark, Users } from "lucide-react";

import { cn } from "@/lib/utils";

export type TrustLevel = "official" | "verified" | "course_rep" | "student";

const CONFIG: Record<TrustLevel, { label: string; icon: typeof BadgeCheck; className: string }> = {
  official: {
    label: "Official",
    icon: Landmark,
    className: "bg-primary text-primary-foreground",
  },
  verified: {
    label: "Verified",
    icon: BadgeCheck,
    className: "bg-lime text-lime-foreground",
  },
  course_rep: {
    label: "Course Rep",
    icon: GraduationCap,
    className: "bg-accent text-accent-foreground border border-border",
  },
  student: {
    label: "Student",
    icon: Users,
    className: "bg-muted text-muted-foreground",
  },
};

export function TrustBadge({ level, className }: { level: TrustLevel; className?: string }) {
  const config = CONFIG[level];
  const Icon = config.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
        config.className,
        className,
      )}
    >
      <Icon className="size-3" aria-hidden="true" />
      {config.label}
    </span>
  );
}
