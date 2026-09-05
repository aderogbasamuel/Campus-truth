import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Camera } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

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
import { Textarea } from "@/components/ui/textarea";
import { useProfile, useSessionUser } from "@/hooks/useCampusUser";
import { supabase } from "@/integrations/supabase/client";
import { LEVELS, UNILAG_ID, friendlyError, uploadImage } from "@/lib/campus";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Set up your profile — CampusTruth" },
      {
        name: "description",
        content: "Tell CampusTruth your faculty, department and level to personalise your feed.",
      },
      { property: "og:title", content: "Set up your profile — CampusTruth" },
      {
        property: "og:description",
        content: "Tell CampusTruth your faculty, department and level to personalise your feed.",
      },
    ],
  }),
  component: Onboarding,
});

function Onboarding() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { userId } = useSessionUser();
  const { data: profile } = useProfile(userId);
  const fileRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [facultyId, setFacultyId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [level, setLevel] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name ?? "");
    setUsername(profile.username ?? "");
    setBio(profile.bio ?? "");
    setFacultyId(profile.faculty_id ?? "");
    setDepartmentId(profile.department_id ?? "");
    setLevel(profile.level ?? "");
    setAvatarUrl(profile.avatar_url ?? null);
  }, [profile]);

  const { data: faculties } = useQuery({
    queryKey: ["faculties", UNILAG_ID],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("faculties")
        .select("id, name")
        .eq("school_id", UNILAG_ID)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: departments } = useQuery({
    queryKey: ["departments", facultyId],
    enabled: !!facultyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("departments")
        .select("id, name")
        .eq("faculty_id", facultyId)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const upload = useMutation({
    mutationFn: async (file: File) => uploadImage("avatars", userId!, file),
    onSuccess: (url) => setAvatarUrl(url),
    onError: (error) => toast.error(friendlyError(error)),
  });

  const save = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("Please sign in again.");
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim(),
          username: username.trim() || null,
          bio: bio.trim() || null,
          school_id: UNILAG_ID,
          faculty_id: facultyId || null,
          department_id: departmentId || null,
          level: level || null,
          avatar_url: avatarUrl,
          onboarded: true,
        })
        .eq("id", userId);
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      navigate({ to: "/home", replace: true });
    },
    onError: (error) => toast.error(friendlyError(error)),
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-lg px-4 py-10">
        <div className="flex flex-col items-center text-center">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="relative rounded-full"
            aria-label="Upload a profile photo"
          >
            <UserAvatar name={fullName} url={avatarUrl} className="size-24" />
            <span className="absolute -bottom-1 -right-1 flex size-8 items-center justify-center rounded-full bg-lime text-lime-foreground shadow-card">
              <Camera className="size-4" aria-hidden="true" />
            </span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) upload.mutate(file);
            }}
          />
          <h1 className="mt-5 text-2xl font-extrabold">Set up your profile</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            We use this to show you the right announcements, questions and communities.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Powered by AI • UNILAG pilot</p>
        </div>

        <form
          className="mt-8 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            save.mutate();
          }}
        >
          <div className="surface-card space-y-4 p-5">
            <div className="space-y-1.5">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                required
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
              <Label htmlFor="bio">Short bio</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                rows={3}
                placeholder="What are you studying?"
              />
            </div>
          </div>

          <div className="surface-card space-y-4 p-5">
            <div className="space-y-1.5">
              <Label>Faculty</Label>
              <Select
                value={facultyId}
                onValueChange={(value) => {
                  setFacultyId(value);
                  setDepartmentId("");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose your faculty" />
                </SelectTrigger>
                <SelectContent>
                  {(faculties ?? []).map((faculty) => (
                    <SelectItem key={faculty.id} value={faculty.id}>
                      {faculty.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Department</Label>
              <Select value={departmentId} onValueChange={setDepartmentId} disabled={!facultyId}>
                <SelectTrigger>
                  <SelectValue placeholder={facultyId ? "Choose your department" : "Pick a faculty first"} />
                </SelectTrigger>
                <SelectContent>
                  {(departments ?? []).map((department) => (
                    <SelectItem key={department.id} value={department.id}>
                      {department.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Level</Label>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger>
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
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={save.isPending}>
            {save.isPending ? "Saving…" : "Get started"}
          </Button>
        </form>
      </div>
    </div>
  );
}
