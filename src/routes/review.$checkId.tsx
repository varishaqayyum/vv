import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { ReviewContent } from "@/components/ReviewContent";
import type { StatementAnswers } from "@/lib/statement";
import type { ReviewResult } from "@/lib/review";
import { checkStorageKey } from "@/lib/session-storage";

const title = "Your personal statement feedback — Statement Clinic";
const description = "See what your personal statement is already showing and what to strengthen.";

export const Route = createFileRoute("/review/$checkId")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: ReviewPage,
});

type LoadState = "loading" | "ready" | "error";
type StoredCheck = { answers: StatementAnswers; review: ReviewResult; createdAt: number };

function ReviewPage() {
  const { checkId } = Route.useParams();
  const [state, setState] = useState<LoadState>("loading");
  const [data, setData] = useState<StoredCheck | null>(null);

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(checkStorageKey(checkId));
      if (!raw) {
        setState("error");
        return;
      }
      const parsed = JSON.parse(raw) as StoredCheck;
      setData(parsed);
      setState("ready");
    } catch {
      setState("error");
    }
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

  if (state === "error" || !data) {
    return (
      <SiteLayout>
        <div className="mx-auto w-full max-w-3xl px-5 py-16">
          <p className="text-muted-foreground">
            We couldn't find this feedback. Results are kept for your current browser session — if
            the tab was closed or the session cleared, you'll need to check your statement again.
          </p>
          <Button asChild className="mt-4">
            <Link to="/check">Check your statement</Link>
          </Button>
        </div>
      </SiteLayout>
    );
  }

  return <ReviewContent answers={data.answers} review={data.review} />;
}
