import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initialsOf } from "@/lib/campus";
import { cn } from "@/lib/utils";

type Props = {
  name?: string | null;
  url?: string | null;
  className?: string;
};

export function UserAvatar({ name, url, className }: Props) {
  return (
    <Avatar className={cn("size-10 border border-border", className)}>
      {url ? <AvatarImage src={url} alt={name ?? "Student avatar"} /> : null}
      <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
        {initialsOf(name)}
      </AvatarFallback>
    </Avatar>
  );
}
