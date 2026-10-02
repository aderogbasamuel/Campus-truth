import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { MessagesSquare } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { friendlyError } from "@/lib/campus";

export const Route = createFileRoute("/auth")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>) => ({
    mode: search["mode"] === "login" ? ("login" as const) : ("signup" as const),
  }),
  head: () => ({
    meta: [
      { title: "Sign in — CampusTruth" },
      {
        name: "description",
        content: "Create your CampusTruth account or sign in to see verified UNILAG updates.",
      },
      { property: "og:title", content: "Sign in — CampusTruth" },
      {
        property: "og:description",
        content: "Create your CampusTruth account or sign in to see verified UNILAG updates.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(mode === "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/home", replace: true });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
        navigate({ to: "/home", replace: true });
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  const submit = useMutation({
    mutationFn: async () => {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return;
      }
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/home`,
          data: { full_name: fullName },
        },
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        toast.success("Check your email to confirm your account, then sign in.");
        setIsLogin(true);
        return;
      }
      navigate({ to: "/home", replace: true });
    },
    onError: (error) => toast.error(friendlyError(error)),
  });

  const google = useMutation({
    mutationFn: async () => {
      const { lovable } = await import("@/integrations/lovable/index");
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}/auth?mode=login`,
      });
      if (result.error) throw result.error;
      return result;
    },
    onSuccess: (result) => {
      if (result.redirected) return;
      navigate({ to: "/home", replace: true });
    },
    onError: (error) => toast.error(friendlyError(error)),
  });

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="bg-primary px-6 pb-10 pt-12 text-primary-foreground">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex size-10 items-center justify-center rounded-xl bg-lime text-lime-foreground">
            <MessagesSquare className="size-5" aria-hidden="true" />
          </span>
          <span className="text-lg font-bold">
            Campus<span className="opacity-70">Truth</span>
          </span>
        </Link>
        <h1 className="mt-6 text-2xl font-extrabold">
          {isLogin ? "Welcome back" : "Join CampusTruth"}
        </h1>
        <p className="mt-2 text-sm opacity-80">
          {isLogin
            ? "Sign in to see verified updates for your faculty and level."
            : "Free for UNILAG students. You'll get 25 assistant credits to start."}
        </p>
      </div>

      <div className="mx-auto -mt-6 w-full max-w-md px-4 pb-16">
        <div className="surface-card p-5">
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              submit.mutate();
            }}
          >
            {!isLogin ? (
              <div className="space-y-1.5">
                <Label htmlFor="fullName">Full name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  autoComplete="name"
                  required
                />
              </div>
            ) : null}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete={isLogin ? "current-password" : "new-password"}
                minLength={6}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={submit.isPending}>
              {submit.isPending ? "Please wait…" : isLogin ? "Sign in" : "Create account"}
            </Button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-xs uppercase tracking-wide text-muted-foreground">or</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={google.isPending}
            onClick={() => google.mutate()}
          >
            {google.isPending ? "Opening Google…" : "Continue with Google"}
          </Button>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            {isLogin ? "New to CampusTruth?" : "Already have an account?"}{" "}
            <button
              type="button"
              className="font-semibold text-primary underline-offset-2 hover:underline"
              onClick={() => setIsLogin((value) => !value)}
            >
              {isLogin ? "Create an account" : "Sign in"}
            </button>
          </p>
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Nobody can claim official or course-rep status here — those badges are granted by campus
          admins only.
        </p>
      </div>
    </div>
  );
}
