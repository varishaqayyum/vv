import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { FREE_CHECKS_USED_KEY, MAX_FREE_CHECKS } from "@/lib/session-storage";

const title = "My Account — Statement Clinic";
const description = "Your account, free checks remaining, and your previous statement checks.";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: AccountPage,
});

type CheckRow = {
  id: string;
  created_at: string;
  status: string;
  answer_one: string | null;
  answer_two: string | null;
  answer_three: string | null;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function AccountPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState<string | null>(null);
  const [checks, setChecks] = useState<CheckRow[] | null>(null);
  const [loadError, setLoadError] = useState(false);

  // The free-check count is read from the exact same sessionStorage key the
  // checker itself uses — this is deliberately not a second counter. Since
  // that counter is scoped to the current browser session (not the account),
  // it reflects this session's usage, consistent with how the checker itself
  // already behaves.
  const [freeChecksUsed] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    const raw = window.sessionStorage.getItem(FREE_CHECKS_USED_KEY);
    const parsed = raw ? Number.parseInt(raw, 10) : 0;
    return Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, MAX_FREE_CHECKS) : 0;
  });
  const checksRemaining = MAX_FREE_CHECKS - freeChecksUsed;

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;
      setEmail(auth.user.email ?? null);

      const { data, error } = await supabase
        .from("statement_checks")
        .select("id, created_at, status, answer_one, answer_two, answer_three")
        .eq("user_id", auth.user.id)
        .order("created_at", { ascending: true });

      if (!active) return;
      if (error) {
        setLoadError(true);
        return;
      }
      setChecks(data ?? []);
    })();
    return () => {
      active = false;
    };
  }, []);

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <SiteLayout>
      <div className="mx-auto w-full max-w-3xl px-5 py-12">
        <h1 className="text-3xl">My Account</h1>

        {/* ACCOUNT */}
        <section className="mt-8 rounded-lg border border-rule/70 bg-card p-6">
          <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
            Account
          </h2>
          <p className="mt-2 text-base">{email ?? "..."}</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={handleSignOut}>
            Log out
          </Button>
        </section>

        {/* FREE CHECKS REMAINING */}
        <section className="mt-6 rounded-lg border border-rule/70 bg-card p-6">
          <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
            Free checks remaining
          </h2>
          <p className="mt-2 font-display text-3xl text-primary">
            {checksRemaining} of {MAX_FREE_CHECKS}
          </p>
          {checksRemaining === 0 && (
            <p className="mt-2 text-sm text-muted-foreground">
              You've used all your free checks for this session.{" "}
              <Link to="/pricing" className="text-primary underline underline-offset-2">
                See upgrade options
              </Link>
              .
            </p>
          )}
        </section>

        {/* PREVIOUS CHECKS */}
        <section className="mt-6">
          <h2 className="text-xl">Your previous checks</h2>

          {loadError && (
            <p className="mt-3 text-sm text-muted-foreground">
              We couldn't load your check history right now. Please try again shortly.
            </p>
          )}

          {!loadError && checks === null && (
            <p className="mt-3 text-sm text-muted-foreground">Loading...</p>
          )}

          {!loadError && checks !== null && checks.length === 0 && (
            <div className="mt-3 rounded-lg border border-rule/70 bg-card p-6">
              <p className="text-base font-semibold">No checks yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Your previous personal statement checks will appear here once you complete your
                first check.
              </p>
              <Button asChild className="mt-4">
                <Link to="/check">Check my statement</Link>
              </Button>
            </div>
          )}

          {!loadError && checks !== null && checks.length > 0 && (
            <ul className="mt-3 space-y-3">
              {checks.map((check, i) => {
                const questionsSubmitted = [
                  check.answer_one?.trim() ? "Q1" : null,
                  check.answer_two?.trim() ? "Q2" : null,
                  check.answer_three?.trim() ? "Q3" : null,
                ].filter(Boolean);
                return (
                  <li key={check.id}>
                    <Link
                      to="/account/$checkId"
                      params={{ checkId: check.id }}
                      className="block rounded-lg border border-rule/70 bg-card p-5 transition-colors hover:border-primary/50"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold">Medicine Personal Statement</p>
                        <span className="text-xs text-muted-foreground">
                          {check.status === "complete" ? "Completed" : check.status}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Check {i + 1} · {formatDate(check.created_at)}
                        {questionsSubmitted.length > 0 && ` · ${questionsSubmitted.join(", ")}`}
                      </p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <div className="mt-8">
          <Button asChild variant="outline">
            <Link to="/check">Start a new check</Link>
          </Button>
        </div>
      </div>
    </SiteLayout>
  );
}
