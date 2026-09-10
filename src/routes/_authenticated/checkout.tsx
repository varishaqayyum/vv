import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { SELECTED_PLAN_KEY } from "@/lib/session-storage";
import type { PlanId } from "@/lib/session-storage";

// NOTE for whoever wires up real payment here: once a payment is verified as
// successful (server-side — never trust the browser alone), call
// trackEvent("human_review_purchased", { plan }) from analytics.ts at that
// exact point, and nowhere else. There is currently no code path where a
// payment is ever confirmed, so this event cannot fire yet — it is not
// wired to a fake/simulated success anywhere in this file or elsewhere.

const title = "Checkout — Statement Clinic";
const description = "Complete payment for your selected Statement Clinic plan.";

export const Route = createFileRoute("/_authenticated/checkout")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: Checkout,
});

const PLAN_DETAILS: Record<PlanId, { name: string; price: string; description: string }> = {
  weekly: {
    name: "7-Day Unlimited",
    price: "£4.99",
    description: "Unlimited checks for 7 days.",
  },
  season: {
    name: "Application Season",
    price: "£9.99",
    description: "Unlimited checks until the UCAS deadline (one-off payment).",
  },
};

function Checkout() {
  const [plan, setPlan] = useState<PlanId | null | undefined>(undefined);

  useEffect(() => {
    const stored = window.sessionStorage.getItem(SELECTED_PLAN_KEY);
    setPlan(stored === "weekly" || stored === "season" ? stored : null);
  }, []);

  if (plan === undefined) {
    return (
      <SiteLayout>
        <div className="mx-auto w-full max-w-lg px-5 py-16">
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </SiteLayout>
    );
  }

  if (plan === null) {
    return (
      <SiteLayout>
        <div className="mx-auto w-full max-w-lg px-5 py-16">
          <h1 className="text-3xl">No plan selected</h1>
          <p className="mt-3 text-muted-foreground">
            Choose a plan on the pricing page to continue to checkout.
          </p>
          <Button asChild className="mt-6">
            <Link to="/pricing">Back to pricing</Link>
          </Button>
        </div>
      </SiteLayout>
    );
  }

  const details = PLAN_DETAILS[plan];

  return (
    <SiteLayout>
      <div className="mx-auto w-full max-w-lg px-5 py-16">
        <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
          Checkout
        </p>
        <h1 className="mt-2 text-3xl">{details.name}</h1>
        <p className="mt-1 font-display text-3xl text-primary">{details.price}</p>
        <p className="mt-2 text-muted-foreground">{details.description}</p>

        <div className="mt-8 rounded-lg border border-primary/40 bg-card p-6">
          <p className="text-sm font-semibold">Payment isn't set up on this site yet</p>
          <p className="mt-2 text-sm text-muted-foreground">
            We won't pretend this payment has gone through — it hasn't, and your account has not
            been charged or given any unlimited access. To actually take payment here, this site
            still needs:
          </p>
          <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
            <li>• A payment processor connected (for example, Stripe Checkout or Payment Links)</li>
            <li>
              • A server-side function that verifies the payment succeeded before granting access —
              never trusting the browser alone
            </li>
            <li>
              • A record on your account of which plan you bought and when it expires, so the
              checker can confirm your unlimited access
            </li>
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">
            None of this requires putting a secret API key in the website's frontend code — it
            belongs in a server-side function or edge function instead.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link to="/pricing">Change plan</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/check">Use the free check instead</Link>
          </Button>
        </div>
      </div>
    </SiteLayout>
  );
}
