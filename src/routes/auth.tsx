import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { BadgeCheck, Eye, EyeOff, Loader2, MessagesSquare, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
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

const PERKS = [
  "Official notices show their source and date",
  "TrustBot only answers from verified records",
  "Course reps are clearly marked",
];

// Set just before we leave for Google. When we land back on this page it tells us a
// sign-in is being finished, so we can show the loading screen straight away instead
// of flashing the login form while Supabase exchanges the code.
const OAUTH_PENDING_KEY = "campustruth:oauth-pending";

function readOAuthPending() {
  try {
    return window.sessionStorage.getItem(OAUTH_PENDING_KEY) === "1";
  } catch {
    return false; // storage blocked (private mode etc.)
  }
}

function writeOAuthPending(on: boolean) {
  try {
    if (on) window.sessionStorage.setItem(OAUTH_PENDING_KEY, "1");
    else window.sessionStorage.removeItem(OAUTH_PENDING_KEY);
  } catch {
    // ignore: the loading screen is a nicety, sign-in still works without it
  }
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.54-5.17 3.54-8.87Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3c-1.08.72-2.45 1.16-4.05 1.16-3.13 0-5.78-2.11-6.73-4.96H1.27v3.09A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29A7.2 7.2 0 0 1 4.9 12c0-.8.14-1.57.37-2.29V6.62H1.27A12 12 0 0 0 0 12c0 1.94.46 3.77 1.27 5.38l4-3.09Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.27 6.62l4 3.09C6.22 6.86 8.87 4.75 12 4.75Z"
      />
    </svg>
  );
}

function AuthPage() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate();

  // The URL is the source of truth, so "Log in" links, the tab switch and the
  // back button all agree with each other.
  const isLogin = mode === "login";
  const setMode = (next: "login" | "signup") =>
    navigate({ to: "/auth", search: { mode: next }, replace: true });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // `redirecting` drives the full-screen "Signing you in…" state. It starts true when
  // we are landing back from Google, so the form never flashes.
  const [redirecting, setRedirecting] = useState(
    () => typeof window !== "undefined" && readOAuthPending(),
  );
  const [slow, setSlow] = useState(false);
  const [openingGoogle, setOpeningGoogle] = useState(false);
  const redirectedRef = useRef(false);

  // The one place that leaves this page. Safe to call more than once (the auth
  // listener and the form's onSuccess both fire), only the first call does anything.
  const goHome = useCallback(() => {
    if (redirectedRef.current) return;
    redirectedRef.current = true;
    writeOAuthPending(false);
    setRedirecting(true);
    navigate({ to: "/home", replace: true }).catch(() => {
      // navigation failed: drop the loading screen so the form is usable again
      redirectedRef.current = false;
      setRedirecting(false);
    });
  }, [navigate]);

  useEffect(() => {
    // INITIAL_SESSION fires straight away from local storage, so already-signed-in
    // visitors are redirected without waiting on a network call.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
        goHome();
      } else if (event === "INITIAL_SESSION") {
        // Initialised with no session: nothing is being finished, show the form.
        writeOAuthPending(false);
        setRedirecting(false);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [goHome]);

  // If the redirect takes a while (slow network, heavy first load), say so.
  useEffect(() => {
    if (!redirecting) {
      setSlow(false);
      return;
    }
    const timer = window.setTimeout(() => setSlow(true), 8000);
    return () => window.clearTimeout(timer);
  }, [redirecting]);

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
        setMode("login");
        return;
      }
      goHome();
    },
    onError: (error) => toast.error(friendlyError(error)),
  });

  const google = useMutation({
    mutationFn: async () => {
      writeOAuthPending(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth?mode=login` },
      });
      if (error) throw error;
      // the browser redirects to Google from here, so there is no navigation to do
    },
    // The mutation resolves before the browser actually leaves, so keep the button
    // busy ourselves instead of letting it look idle for a moment.
    onSuccess: () => setOpeningGoogle(true),
    onError: (error) => {
      writeOAuthPending(false);
      toast.error(friendlyError(error));
    },
  });

  // Coming back with the browser's back button can restore this page frozen mid-click.
  const { reset: resetGoogle } = google;
  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      writeOAuthPending(false);
      redirectedRef.current = false;
      setRedirecting(false);
      setOpeningGoogle(false);
      resetGoogle();
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, [resetGoogle]);

  const googleBusy = google.isPending || openingGoogle;
  const busy = submit.isPending || googleBusy || redirecting;

  const tab = (active: boolean) =>
    `rounded-full py-2 text-sm font-medium transition-colors ${
      active ? "bg-white text-primary shadow-sm" : "text-primary/60 hover:text-primary"
    }`;

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-2">
      {/* shown from the moment we know sign-in worked until /home has loaded */}
      {redirecting ? (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-primary px-6 text-center text-primary-foreground"
        >
          <span className="flex size-16 animate-pulse items-center justify-center rounded-2xl bg-accent text-accent-foreground">
            <MessagesSquare className="size-8" aria-hidden="true" />
          </span>
          <div className="space-y-2">
            <p className="text-xl font-semibold tracking-tight">
              {slow ? "Still working on it…" : "Signing you in…"}
            </p>
            <p className="max-w-xs text-sm leading-relaxed text-primary-foreground/80">
              {slow
                ? "Your connection looks slow. Hang tight, we're almost there."
                : "Getting your campus feed ready."}
            </p>
          </div>
          <Loader2 className="size-6 animate-spin text-accent" aria-hidden="true" />
          {slow ? (
            <Button
              type="button"
              variant="ghost"
              className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              onClick={() => window.location.reload()}
            >
              Taking too long? Try again
            </Button>
          ) : null}
        </div>
      ) : null}

      {/* brand panel: compact header on mobile, full side panel on desktop */}
      <aside className="relative overflow-hidden bg-primary px-6 pb-16 pt-10 text-primary-foreground lg:flex lg:flex-col lg:justify-between lg:px-14 lg:py-14">
        <BadgeCheck
          aria-hidden="true"
          strokeWidth={1}
          className="pointer-events-none absolute -bottom-16 -right-12 hidden size-96 text-accent/15 lg:block"
        />

        <Link to="/" className="relative flex w-fit items-center gap-2.5">
          <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
            <MessagesSquare className="size-5" aria-hidden="true" />
          </span>
          <span className="text-lg font-semibold tracking-tight">CampusTruth</span>
        </Link>

        <div className="relative mt-8 lg:mt-0">
          <h1 className="text-3xl font-semibold leading-tight tracking-tight lg:text-4xl">
            {isLogin ? "Welcome back" : "Join CampusTruth"}
          </h1>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-primary-foreground/80 lg:text-base">
            {isLogin
              ? "Sign in to see verified updates for your faculty and level."
              : "Free for UNILAG students. You'll get 25 assistant credits to start."}
          </p>

          <ul className="mt-8 hidden space-y-3 lg:block">
            {PERKS.map((perk) => (
              <li key={perk} className="flex items-center gap-3 text-sm">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                  <BadgeCheck className="size-3.5" aria-hidden="true" />
                </span>
                {perk}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative hidden text-xs text-primary-foreground/60 lg:block">
          Your campus, decoded.
        </p>
      </aside>

      {/* form */}
      <main className="flex items-start justify-center px-4 lg:items-center lg:px-10">
        <div className="relative -mt-8 w-full max-w-md pb-16 lg:mt-0 lg:pb-0">
          <div className="rounded-3xl border border-primary bg-white p-6 shadow-[0_5px_0_0] shadow-primary">
            {/* sign in / create account switch */}
            <div className="grid grid-cols-2 gap-1 rounded-full bg-muted p-1">
              <button
                type="button"
                aria-pressed={isLogin}
                className={tab(isLogin)}
                onClick={() => setMode("login")}
              >
                Sign in
              </button>
              <button
                type="button"
                aria-pressed={!isLogin}
                className={tab(!isLogin)}
                onClick={() => setMode("signup")}
              >
                Create account
              </button>
            </div>

            <form
              className="mt-6 space-y-4"
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
                    className="h-12 rounded-xl"
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
                  className="h-12 rounded-xl"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    className="h-12 rounded-xl pr-12"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete={isLogin ? "current-password" : "new-password"}
                    minLength={6}
                    required
                    aria-describedby={!isLogin ? "password-hint" : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                    className="absolute right-1.5 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-primary/60 transition-colors hover:bg-primary/5 hover:text-primary"
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" aria-hidden="true" />
                    ) : (
                      <Eye className="size-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
                {!isLogin ? (
                  <p id="password-hint" className="text-xs text-primary/60">
                    At least 6 characters.
                  </p>
                ) : null}
              </div>

              <Button
                type="submit"
                disabled={busy}
                className="h-12 w-full rounded-full bg-accent text-base text-accent-foreground hover:bg-accent/90"
              >
                {submit.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    Please wait…
                  </>
                ) : isLogin ? (
                  "Sign in"
                ) : (
                  "Create account"
                )}
              </Button>
            </form>

            <div className="my-5 flex items-center gap-3">
              <span className="h-px flex-1 bg-primary/10" />
              <span className="text-sm text-primary/60">or</span>
              <span className="h-px flex-1 bg-primary/10" />
            </div>

            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => google.mutate()}
              className="h-12 w-full gap-2.5 rounded-full border-primary/20 bg-transparent text-base hover:bg-primary/5"
            >
              {googleBusy ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Opening Google…
                </>
              ) : (
                <>
                  <GoogleIcon />
                  Continue with Google
                </>
              )}
            </Button>
          </div>

          <p className="mt-5 flex items-start gap-2 px-2 text-xs leading-relaxed text-primary/60">
            <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            Official and course-rep badges can't be claimed here. They're granted by campus admins
            only.
          </p>
        </div>
      </main>
    </div>
  );
}