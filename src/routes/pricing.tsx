import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { SELECTED_PLAN_KEY } from "@/lib/session-storage";
import type { PlanId } from "@/lib/session-storage";
import { HUMAN_REVIEW_PRICE, HUMAN_REVIEW_POINTS } from "@/lib/human-review";
import { trackEvent } from "@/lib/analytics";

const title = "Pricing — free statement check or unlimited checking plans";
const description =
  "Start free with a structured personal statement check, or unlock unlimited checks for a week or for your whole application season.";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: Pricing,
});

const PLANS: {
  id: PlanId;
  name: string;
  price: string;
  headline: string;
  supporting: string;
}[] = [
  {
    id: "weekly",
    name: "7-Day Unlimited",
    price: "£4.99",
    headline: "Unlimited checks for 7 days",
    supporting:
      "Submit and check as many drafts as you want during the 7-day period — write, check, improve, and check again.",
  },
  {
    id: "season",
    name: "Application Season",
    price: "£9.99",
    headline: "Unlimited checks until the UCAS deadline",
    supporting:
      "A one-off payment, not a subscription. Repeatedly submit drafts, get feedback, improve your answers and check them again throughout your application process.",
  },
];

function Pricing() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<PlanId | null>(null);

  function handleSelect(planId: PlanId) {
    setSelectedPlan((prev) => (prev === planId ? null : planId));
  }

  function handleContinue(planId: PlanId) {
    trackEvent("upgrade_clicked", { plan: planId });
    window.sessionStorage.setItem(SELECTED_PLAN_KEY, planId);
    if (session) {
      navigate({ to: "/checkout" });
    } else {
      navigate({ to: "/auth", search: { mode: "signup", plan: planId } });
    }
  }

  return (
    <SiteLayout>
      <div className="mx-auto w-full max-w-5xl px-5 py-16">
        <h1 className="text-4xl">Pricing</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          The free check is always free and never needs an account. Upgrade only if you want
          unlimited checks while you redraft.
        </p>

        <div className="mt-10 grid gap-5 sm:grid-cols-3 sm:items-stretch">
          {/* Free */}
          <div className="flex h-full flex-col rounded-lg border border-rule/70 bg-card p-7">
            <h2 className="text-xl">Free</h2>
            <p className="mt-1 font-display text-4xl">£0</p>
            <p className="mt-2 text-sm text-muted-foreground">3 free checks</p>
            <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-primary">✓</span> Full medicine-focused feedback
              </li>
              <li className="flex gap-2">
                <span className="text-primary">✓</span> See what's strong and what may be missing
              </li>
              <li className="flex gap-2">
                <span className="text-primary">✓</span> Feedback on reflection, experience &
                motivation
              </li>
            </ul>
            <Button asChild className="mt-auto w-full">
              <Link to="/check">Start free</Link>
            </Button>
          </div>

          {/* Paid plans */}
          {PLANS.map((plan) => {
            const isSelected = selectedPlan === plan.id;
            return (
              <div
                key={plan.id}
                role="button"
                tabIndex={0}
                onClick={() => handleSelect(plan.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleSelect(plan.id);
                  }
                }}
                className={`relative flex h-full cursor-pointer flex-col rounded-lg border bg-card p-7 transition-colors ${
                  isSelected
                    ? "border-primary border-2 shadow-sm"
                    : "border-primary/40 hover:border-primary/70"
                }`}
              >
                {plan.id === "season" && (
                  <Badge className="absolute -top-3 right-6 bg-primary text-primary-foreground">
                    Best value
                  </Badge>
                )}
                <h2 className={isSelected ? "text-xl font-semibold" : "text-xl"}>{plan.name}</h2>
                <p className="mt-1 font-display text-4xl">{plan.price}</p>
                <p
                  className={`mt-2 text-sm ${isSelected ? "font-medium text-foreground" : "text-muted-foreground"}`}
                >
                  {plan.headline}
                </p>
                <p className="mt-3 text-sm text-muted-foreground">{plan.supporting}</p>
                <Button
                  className="mt-auto w-full"
                  variant={isSelected ? "default" : "outline"}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isSelected) {
                      handleSelect(plan.id);
                    } else {
                      handleContinue(plan.id);
                    }
                  }}
                >
                  {isSelected ? "Continue" : "Select plan"}
                </Button>
              </div>
            );
          })}
        </div>

        <p className="mt-8 text-sm text-muted-foreground">
          Write → Check → Improve → Check again. Paid plans need an account so we can attach your
          unlimited access period to it — the free check never does.
        </p>

        {/* Human Review — identical content to the homepage section, price kept in sync via the shared constant */}
        <div className="mt-12 rounded-2xl border border-primary/40 bg-card p-8 sm:p-12">
          <h2 className="text-2xl sm:text-3xl">Want a second pair of eyes?</h2>
          <p className="mt-2 font-display text-xl text-primary">
            Human Personal Statement Review — {HUMAN_REVIEW_PRICE}
          </p>
          <ul className="mt-6 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
            {HUMAN_REVIEW_POINTS.map((point) => (
              <li key={point} className="flex gap-2">
                <span className="text-primary">✓</span>
                {point}
              </li>
            ))}
          </ul>
          <div className="mt-8">
            <Button asChild size="lg">
              <Link to="/check">Start with the free check</Link>
            </Button>
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}
