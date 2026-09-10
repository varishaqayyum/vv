import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SELECTED_PLAN_KEY } from "@/lib/session-storage";

const title = "Log in or sign up — Statement Clinic";
const description =
  "Create your Statement Clinic account to draft and save your UCAS personal statement.";

export const Route = createFileRoute("/auth")({
  validateSearch: z.object({
    mode: z.enum(["login", "signup"]).optional(),
    // Present when arriving from a paid-plan selection on the Pricing page,
    // so we know to send the student to checkout instead of the free
    // checker once they've logged in. sessionStorage (written on the
    // Pricing page before navigating here) is the durable source of truth
    // for this — this query param is just a same-tab convenience.
    plan: z.enum(["weekly", "season"]).optional(),
  }),
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { mode, plan } = Route.useSearch();
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [isSignup, setIsSignup] = useState(mode === "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);

  // A plan arriving via the URL is the freshest signal, so keep sessionStorage
  // in sync with it in case the student landed here directly (e.g. a saved
  // link) rather than via the Pricing page's own click handler.
  useEffect(() => {
    if (plan) window.sessionStorage.setItem(SELECTED_PLAN_KEY, plan);
  }, [plan]);

  function destinationAfterAuth() {
    const hasSelectedPlan = plan ?? window.sessionStorage.getItem(SELECTED_PLAN_KEY);
    return hasSelectedPlan ? "/checkout" : "/check";
  }

  useEffect(() => {
    if (!loading && session) navigate({ to: destinationAfterAuth(), replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, session, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (isSignup) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        toast.success("Account created");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate({ to: destinationAfterAuth(), replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <SiteLayout>
      <div className="mx-auto w-full max-w-md px-5 py-16">
        <h1 className="text-3xl">{isSignup ? "Create your account" : "Welcome back"}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {plan
            ? "You're creating an account to continue to payment for your selected plan."
            : isSignup
              ? "You don't need an account to use the free checker — accounts are only needed for paid plans or the human review."
              : "Log in to manage your plan or your human review."}
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          {isSignup && (
            <div className="space-y-1.5">
              <Label htmlFor="fullName">Full name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoComplete="name"
                required
              />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={isSignup ? "new-password" : "current-password"}
              minLength={6}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {isSignup ? "Create account" : "Log in"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {isSignup ? "Already have an account?" : "New here?"}{" "}
          <button
            type="button"
            className="font-semibold text-foreground underline underline-offset-4"
            onClick={() => setIsSignup((v) => !v)}
          >
            {isSignup ? "Log in" : "Create an account"}
          </button>
        </p>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          <Link to="/how-it-works">How Statement Clinic works</Link>
        </p>
      </div>
    </SiteLayout>
  );
}
