import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import {
  UCAS_QUESTIONS,
  TOTAL_CHARACTER_LIMIT,
  totalCharacters,
  sanitizeAnswer,
  characterCount,
} from "@/lib/statement";
import type { StatementAnswers } from "@/lib/statement";
import { generateReview } from "@/lib/review";
import {
  DRAFT_STORAGE_KEY,
  checkStorageKey,
  FREE_CHECKS_USED_KEY,
  MAX_FREE_CHECKS,
} from "@/lib/session-storage";
import { trackEvent } from "@/lib/analytics";

const CHECKER_STARTED_KEY = "statementClinic:analytics:checkerStartedFired";

const title = "Get your personal statement checked — Statement Clinic";
const description = "Paste your three UCAS answers and see what's missing — no account needed.";

export const Route = createFileRoute("/check")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: CheckPage,
});

const EMPTY_ANSWERS: StatementAnswers = { answer_one: "", answer_two: "", answer_three: "" };

function loadDraft(): StatementAnswers {
  if (typeof window === "undefined") return EMPTY_ANSWERS;
  try {
    const raw = window.sessionStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return EMPTY_ANSWERS;
    const parsed = JSON.parse(raw) as Partial<StatementAnswers>;
    return {
      answer_one: sanitizeAnswer(parsed.answer_one ?? ""),
      answer_two: sanitizeAnswer(parsed.answer_two ?? ""),
      answer_three: sanitizeAnswer(parsed.answer_three ?? ""),
    };
  } catch {
    return EMPTY_ANSWERS;
  }
}

function loadFreeChecksUsed(): number {
  if (typeof window === "undefined") return 0;
  const raw = window.sessionStorage.getItem(FREE_CHECKS_USED_KEY);
  const parsed = raw ? Number.parseInt(raw, 10) : 0;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function CheckPage() {
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<StatementAnswers>(EMPTY_ANSWERS);
  const [checking, setChecking] = useState(false);
  const [freeChecksUsed, setFreeChecksUsed] = useState<number | null>(null);

  // Restore any in-progress draft from this browser session (guest, no account needed).
  useEffect(() => {
    setAnswers(loadDraft());
    setFreeChecksUsed(loadFreeChecksUsed());

    // Fire "checker_started" once per browser session (tab) — matches the
    // same session-scoped lifetime as the free-check counter itself, so a
    // refresh or revisit within the same session doesn't double-count.
    if (!window.sessionStorage.getItem(CHECKER_STARTED_KEY)) {
      window.sessionStorage.setItem(CHECKER_STARTED_KEY, "1");
      trackEvent("checker_started");
    }
  }, []);

  function handleChange(key: keyof StatementAnswers, value: string) {
    setAnswers((prev) => {
      // No truncation: students may be pasting a rough draft that's
      // currently over the limit and want it reviewed as-is. We do strip
      // invisible/zero-width characters so a genuinely empty box always
      // counts as exactly 0 — see sanitizeAnswer for why.
      const next = { ...prev, [key]: sanitizeAnswer(value) };
      window.sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }

  const total = totalCharacters(answers);
  const percentUsed = Math.min(100, Math.round((total / TOTAL_CHARACTER_LIMIT) * 100));
  const overBy = Math.max(0, total - TOTAL_CHARACTER_LIMIT);
  const hasAnyAnswer = UCAS_QUESTIONS.some((q) => answers[q.key].trim().length > 0);
  const checksRemaining =
    freeChecksUsed === null ? MAX_FREE_CHECKS : MAX_FREE_CHECKS - freeChecksUsed;
  const upgradeRequired = freeChecksUsed !== null && freeChecksUsed >= MAX_FREE_CHECKS;
  const isLastFreeCheck = checksRemaining === 1;

  async function handleCheck() {
    if (upgradeRequired) return;
    if (!hasAnyAnswer) {
      toast.error(
        "Please enter some writing in at least one question before checking your statement.",
      );
      return;
    }
    setChecking(true);
    try {
      const review = generateReview(answers);
      const checkId =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      window.sessionStorage.setItem(
        checkStorageKey(checkId),
        JSON.stringify({ answers, review, createdAt: Date.now() }),
      );
      const nextUsed = (freeChecksUsed ?? 0) + 1;
      window.sessionStorage.setItem(FREE_CHECKS_USED_KEY, String(nextUsed));

      trackEvent("check_completed");
      if (nextUsed === 1) trackEvent("check_1_used");
      else if (nextUsed === 2) trackEvent("check_2_used");
      else if (nextUsed === 3) trackEvent("check_3_used");

      // If a student is signed in (e.g. for the paid plans/Human Review
      // flow), also save this check to their account so it shows up in
      // their history — the free checker itself still needs no account and
      // behaves identically either way. Never blocks or fails the check
      // shown to the student even if this save doesn't succeed.
      try {
        const { data: auth } = await supabase.auth.getUser();
        if (auth.user) {
          await supabase.from("statement_checks").insert({
            user_id: auth.user.id,
            check_type: "free",
            status: "complete",
            feedback: JSON.stringify(review),
            answer_one: answers.answer_one,
            answer_two: answers.answer_two,
            answer_three: answers.answer_three,
          });
        }
      } catch {
        // Saving to account history is a bonus for signed-in users, not a
        // requirement for the check itself to work.
      }

      navigate({ to: "/review/$checkId", params: { checkId } });
    } catch {
      toast.error("Your check could not be completed. Please try again.");
      setChecking(false);
    }
  }

  return (
    <SiteLayout>
      <div className="mx-auto w-full max-w-3xl px-5 py-12">
        <h1 className="text-3xl">Your personal statement</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Write your own answers to the three UCAS questions below, then get them checked. No
          account needed — your answers stay in this browser session.
        </p>

        <div className="mt-8">
          <div className="rounded-lg border border-rule/70 bg-card/95 p-4 shadow-sm backdrop-blur">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-semibold">
                {total.toLocaleString()} / {TOTAL_CHARACTER_LIMIT.toLocaleString()} characters total
              </span>
            </div>
            <Progress
              value={percentUsed}
              className="mt-2"
              {...(overBy > 0 ? { indicatorClassName: "bg-destructive" } : {})}
            />
            {overBy > 0 ? (
              <p className="mt-2 text-xs font-medium text-destructive">
                ⚠️ {overBy.toLocaleString()} characters over the 4,000-character limit
              </p>
            ) : (
              <p className="mt-2 text-xs font-medium text-primary">
                ✓ Within the 4,000-character limit
              </p>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              {UCAS_QUESTIONS.map((q, i) => (
                <span key={q.key}>
                  {i > 0 && " · "}
                  Question {q.number}: {characterCount(answers[q.key]).toLocaleString()} characters
                </span>
              ))}
            </p>
          </div>
        </div>

        <div className="mt-8 space-y-8">
          {UCAS_QUESTIONS.map((q) => (
            <div key={q.key} className="rounded-lg border border-rule/70 bg-card p-6">
              <span className="font-display text-2xl text-primary">0{q.number}</span>
              <h2 className="mt-1 text-lg leading-snug">{q.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{q.hint}</p>
              <Textarea
                value={answers[q.key]}
                onChange={(e) => handleChange(q.key, e.target.value)}
                rows={7}
                className="mt-4"
                placeholder="Write in your own words..."
              />
              <p className="mt-1 text-right text-xs text-muted-foreground">
                {characterCount(answers[q.key]).toLocaleString()} characters
              </p>
            </div>
          ))}
        </div>

        {upgradeRequired ? (
          <div className="mt-8 rounded-lg border border-primary/40 bg-card p-5">
            <p className="text-base font-semibold">You've used all 3 free checks</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Your 3 free checks are now used. Upgrade to continue checking and improving your
              statement.
            </p>
            <Button asChild size="lg" className="mt-4">
              <Link to="/pricing" onClick={() => trackEvent("upgrade_clicked")}>
                See upgrade options
              </Link>
            </Button>
          </div>
        ) : (
          <>
            {isLastFreeCheck && (
              <div className="mt-8 rounded-lg border border-primary/40 bg-card p-5">
                <p className="text-base font-semibold">This is your last free check</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  You have 1 free check remaining. After this check, you can continue with a paid
                  plan.
                </p>
              </div>
            )}
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button size="lg" onClick={handleCheck} disabled={checking}>
                {checking ? "Checking..." : "Check my statement"}
              </Button>
            </div>
          </>
        )}
      </div>
    </SiteLayout>
  );
}
