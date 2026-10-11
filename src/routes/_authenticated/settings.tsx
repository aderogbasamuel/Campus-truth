import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2, LogOut, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AppShell, PageHeading } from "@/components/campus/AppShell";
import { TrustBadge } from "@/components/campus/TrustBadge";
import { UserAvatar } from "@/components/campus/UserAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useCredits, useProfile, useSessionUser, useSignOut } from "@/hooks/useCampusUser";
import { supabase } from "@/integrations/supabase/client";
import { LEVELS, friendlyError } from "@/lib/campus";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Your profile — CampusTruth" },
      {
        name: "description",
        content: "Update your CampusTruth profile details, level and bio, or sign out.",
      },
      { property: "og:title", content: "Your profile — CampusTruth" },
      {
        property: "og:description",
        content: "Update your CampusTruth profile details, level and bio, or sign out.",
      },
    ],
  }),
  component: SettingsPage,
});

const CARD = "rounded-3xl border border-primary/15 bg-white p-5 sm:p-6";
const MAX_BIO = 200;

function SettingsPage() {
  const { userId } = useSessionUser();
  const profile = useProfile(userId);
  const { data: credits } = useCredits(userId);
  const queryClient = useQueryClient();
  const signOut = useSignOut();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [level, setLevel] = useState("");
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (!profile.data) return;
    setFullName(profile.data.full_name ?? "");
    setUsername(profile.data.username ?? "");
    setBio(profile.data.bio ?? "");
    setLevel(profile.data.level ?? "");
  }, [profile.data]);

  // only enable Save when something actually changed
  const dirty =
    !!profile.data &&
    (fullName !== (profile.data.full_name ?? "") ||
      username !== (profile.data.username ?? "") ||
      bio !== (profile.data.bio ?? "") ||
      level !== (profile.data.level ?? ""));

  const save = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("Please sign in first.");
      if (fullName.trim().length < 2) throw new Error("Please enter your full name.");
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim(),
          username: username.trim() || null,
          bio: bio.trim() || null,
          level: level || null,
        })
        .eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Profile updated");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (error) => toast.error(friendlyError(error)),
  });

  return (
    <AppShell>
      <div className="mx-auto max-w-xl">
        <PageHeading
          title="Your profile"
          description="Update how you appear on CampusTruth."
        />

        {profile.isLoading ? (
          <Skeleton className="h-96 w-full rounded-3xl" />
        ) : (
          <div className="space-y-4">
            {/* identity */}
            <section className={`${CARD} flex items-center gap-4`} aria-label="Your account">
              <UserAvatar
                name={profile.data?.full_name}
                url={profile.data?.avatar_url}
                className="size-16"
              />
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold">
                  {profile.data?.full_name ?? "Your profile"}
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <TrustBadge level={profile.data?.verified ? "official" : "student"} />
                  <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-medium tabular-nums text-accent-foreground">
                    {credits ?? 0} credits
                  </span>
                </div>
              </div>
            </section>

            {/* details */}
            <form
              className={`${CARD} space-y-4`}
              onSubmit={(event) => {
                event.preventDefault();
                if (dirty) save.mutate();
              }}
            >
              <div className="space-y-1.5">
                <Label htmlFor="full-name">Full name</Label>
                <Input
                  id="full-name"
                  className="h-12 rounded-xl"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  autoComplete="name"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  className="h-12 rounded-xl"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="e.g. ada_unilag"
                  autoComplete="username"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="level">Level</Label>
                <Select value={level} onValueChange={setLevel}>
                  <SelectTrigger id="level" className="h-12 rounded-xl">
                    <SelectValue placeholder="Choose your level" />
                  </SelectTrigger>
                  <SelectContent>
                    {LEVELS.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="bio">About you</Label>
                <Textarea
                  id="bio"
                  className="min-h-24 rounded-xl"
                  value={bio}
                  maxLength={MAX_BIO}
                  onChange={(event) => setBio(event.target.value)}
                  placeholder="A short line about your course or interests"
                />
                <p className="text-right text-xs tabular-nums text-primary/60">
                  {bio.length}/{MAX_BIO}
                </p>
              </div>

              <Button
                type="submit"
                disabled={save.isPending || !dirty}
                className="h-12 w-full rounded-full bg-accent text-base text-accent-foreground hover:bg-accent/90 sm:w-auto sm:px-8"
              >
                {save.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    Saving…
                  </>
                ) : (
                  "Save changes"
                )}
              </Button>
            </form>

            {/* badges note */}
            <p className="flex items-start gap-2 px-2 text-sm leading-relaxed text-primary/60">
              <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              Official and course-rep badges are granted by CampusTruth moderators only.
            </p>

            {/* sign out lives apart from the form so it's never hit by accident */}
            <div className="flex justify-center pt-2">
              <Button
                type="button"
                variant="outline"
                disabled={signingOut}
                className="rounded-full border-primary/20 bg-transparent hover:bg-primary/5"
                onClick={async () => {
                  setSigningOut(true);
                  try {
                    await signOut();
                    navigate({ to: "/auth", search: { mode: "login" }, replace: true });
                  } catch (error) {
                    setSigningOut(false);
                    toast.error(friendlyError(error));
                  }
                }}
              >
                {signingOut ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <LogOut className="size-4" aria-hidden="true" />
                )}
                Sign out
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}