import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/campus/AppShell";
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

  useEffect(() => {
    if (!profile.data) return;
    setFullName(profile.data.full_name ?? "");
    setUsername(profile.data.username ?? "");
    setBio(profile.data.bio ?? "");
    setLevel(profile.data.level ?? "");
  }, [profile.data]);

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
        <h1 className="text-2xl font-bold">Your profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Official and course-rep badges are granted by CampusTruth moderators only.
        </p>

        {profile.isLoading ? (
          <Skeleton className="mt-5 h-64 w-full rounded-2xl" />
        ) : (
          <div className="surface-card mt-5 space-y-4 p-5">
            <div className="flex items-center gap-3">
              <UserAvatar
                name={profile.data?.full_name}
                url={profile.data?.avatar_url}
                className="size-14"
              />
              <div>
                <p className="text-base font-semibold">
                  {profile.data?.full_name ?? "Your profile"}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <TrustBadge level={profile.data?.verified ? "official" : "student"} />
                  <span className="text-xs text-muted-foreground">{credits ?? 0} credits</span>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="full-name">Full name</Label>
              <Input
                id="full-name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="e.g. ada_unilag"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="level">Level</Label>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger id="level">
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
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                placeholder="A short line about your course or interests"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={() => save.mutate()} disabled={save.isPending}>
                {save.isPending ? "Saving…" : "Save changes"}
              </Button>
              <Button
                variant="ghost"
                onClick={async () => {
                  await signOut();
                  navigate({ to: "/auth", search: { mode: "login" }, replace: true });
                }}
              >
                Sign out
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
