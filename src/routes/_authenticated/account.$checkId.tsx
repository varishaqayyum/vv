import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { ReviewContent } from "@/components/ReviewContent";
import { supabase } from "@/integrations/supabase/client";
import type { StatementAnswers } from "@/lib/statement";
import type { ReviewResult } from "@/lib/review";

const title = "Your check — My Account — Statement Clinic";
const description = "The saved feedback from this personal statement check.";

export const Route = createFileRoute("/_authenticated/account/$checkId")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: AccountCheckDetail,
});

type LoadState = "loading" | "ready" | "error";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function AccountCheckDetail() {
  const { checkId } = Route.useParams();
  const [state, setState] = useState<LoadState>("loading");
  const [answers, setAnswers] = useState<StatementAnswers | null>(null);
  const [review, setReview] = useState<ReviewResult | null>(null);
  const [checkedOn, setCheckedOn] = useState("");
  const [checkNumber, setCheckNumber] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;

      // RLS already restricts this to rows owned by the signed-in user, but
      // we still filter by user_id explicitly — belt and braces, and it also
      // gives us the data we need to compute this check's chronological
      // number (e.g. "Check 3") among this user's own checks only.
      const { data: allChecks, error } = await supabase
        .from("statement_checks")
        .select("id, created_at, feedback, answer_one, answer_two, answer_three")
        .eq("user_id", auth.user.id)
        .order("created_at", { ascending: true });

      if (!active) return;
      if (error || !allChecks) {
        setState("error");
        return;
      }

      const index = allChecks.findIndex((c) => c.id === checkId);
      const row = index === -1 ? null : allChecks[index];
      if (!row || !row.feedback) {
        setState("error");
        return;
      }

      try {
        const parsedReview = JSON.parse(row.feedback) as ReviewResult;
        setAnswers({
          answer_one: row.answer_one ?? "",
          answer_two: row.answer_two ?? "",
          answer_three: row.answer_three ?? "",
        });
        setReview(parsedReview);
        setCheckedOn(formatDate(row.created_at));
        setCheckNumber(index + 1);
        setState("ready");
      } catch {
        setState("error");
      }
    })();
    return () => {
      active = false;
    };
  }, [checkId]);

  if (state === "loading") {
    return (
      <SiteLayout>
        <div className="mx-auto w-full max-w-3xl px-5 py-16">
          <p className="text-sm text-muted-foreground">Loading your feedback...</p>
        </div>
      </SiteLayout>
    );
  }

  if (state === "error" || !answers || !review) {
    return (
      <SiteLayout>
        <div className="mx-auto w-full max-w-3xl px-5 py-16">
          <p className="text-muted-foreground">We couldn't find this check.</p>
          <Button asChild className="mt-4">
            <Link to="/account">Back to My Account</Link>
          </Button>
        </div>
      </SiteLayout>
    );
  }

  return (
    <ReviewContent
      answers={answers}
      review={review}
      historyContext={{
        label: `Medicine Personal Statement — Check ${checkNumber}`,
        checkedOn: `Checked: ${checkedOn}`,
      }}
    />
  );
}
