import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { supabase } from "@/integrations/supabase/client";
import type { AnalyticsEventName } from "@/lib/analytics";

const title = "Analytics — Statement Clinic";
const description = "Site owner analytics dashboard.";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: AnalyticsPage,
});

type EventRow = { event_name: string; visitor_id: string };

type Metrics = {
  totalVisitors: number;
  totalPageViews: number;
  checkerStarted: number;
  checkerStartedVisitors: number;
  checkCompleted: number;
  check1Used: number;
  check2Used: number;
  check3Used: number;
  humanReviewClicked: number;
  humanReviewClickedVisitors: number;
  upgradeClicked: number;
  humanReviewPurchased: number;
};

function computeMetrics(rows: EventRow[]): Metrics {
  const allVisitors = new Set<string>();
  const countByEvent: Record<string, number> = {};
  const visitorsByEvent: Record<string, Set<string>> = {};

  for (const row of rows) {
    allVisitors.add(row.visitor_id);
    countByEvent[row.event_name] = (countByEvent[row.event_name] ?? 0) + 1;
    const set = visitorsByEvent[row.event_name] ?? new Set<string>();
    set.add(row.visitor_id);
    visitorsByEvent[row.event_name] = set;
  }

  const get = (name: AnalyticsEventName) => countByEvent[name] ?? 0;
  const visitors = (name: AnalyticsEventName) => visitorsByEvent[name]?.size ?? 0;

  return {
    totalVisitors: allVisitors.size,
    totalPageViews: get("page_view"),
    checkerStarted: get("checker_started"),
    checkerStartedVisitors: visitors("checker_started"),
    checkCompleted: get("check_completed"),
    check1Used: get("check_1_used"),
    check2Used: get("check_2_used"),
    check3Used: get("check_3_used"),
    humanReviewClicked: get("human_review_clicked"),
    humanReviewClickedVisitors: visitors("human_review_clicked"),
    upgradeClicked: get("upgrade_clicked"),
    humanReviewPurchased: get("human_review_purchased"),
  };
}

function pct(numerator: number, denominator: number): string {
  if (denominator === 0) return "—";
  return `${Math.round((numerator / denominator) * 1000) / 10}%`;
}

function AnalyticsPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [error, setError] = useState(false);
  const [rowCount, setRowCount] = useState(0);

  useEffect(() => {
    let active = true;
    (async () => {
      // Fetched and aggregated client-side for now, which is fine at this
      // stage of the site's traffic. If this table grows large, replace
      // this with a SQL view/aggregate query instead of pulling every row.
      const { data, error: fetchError } = await supabase
        .from("analytics_events")
        .select("event_name, visitor_id")
        .order("created_at", { ascending: false })
        .limit(20000);

      if (!active) return;
      if (fetchError || !data) {
        setError(true);
        return;
      }
      setRowCount(data.length);
      setMetrics(computeMetrics(data));
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <SiteLayout>
      <div className="mx-auto w-full max-w-3xl px-5 py-12">
        <h1 className="text-3xl">Analytics</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Aggregate, anonymous usage data — no statement content, names or emails are included.
        </p>

        {error && (
          <p className="mt-6 text-sm text-muted-foreground">
            Couldn't load analytics right now. Please try again shortly.
          </p>
        )}

        {!error && !metrics && <p className="mt-6 text-sm text-muted-foreground">Loading...</p>}

        {!error && metrics && (
          <>
            <p className="mt-4 text-xs text-muted-foreground">
              Based on the {rowCount.toLocaleString()} most recent recorded events.
            </p>

            <section className="mt-6 grid gap-4 sm:grid-cols-2">
              <Stat label="Total visitors" value={metrics.totalVisitors} />
              <Stat label="Total page views" value={metrics.totalPageViews} />
              <Stat label="Started the checker" value={metrics.checkerStarted} />
              <Stat label="Completed a check" value={metrics.checkCompleted} />
              <Stat label="Reached check 1" value={metrics.check1Used} />
              <Stat label="Reached check 2" value={metrics.check2Used} />
              <Stat label="Reached check 3 (final free check)" value={metrics.check3Used} />
              <Stat label="Clicked Human Review" value={metrics.humanReviewClicked} />
              <Stat label="Reached the paid/upgrade flow" value={metrics.upgradeClicked} />
              <Stat label="Completed Human Review purchases" value={metrics.humanReviewPurchased} />
            </section>

            <section className="mt-10">
              <h2 className="text-xl">Funnel conversion rates</h2>
              <div className="mt-4 space-y-3 rounded-lg border border-rule/70 bg-card p-5 text-sm">
                <ConversionRow
                  label="Visitor → started checker"
                  rate={pct(metrics.checkerStartedVisitors, metrics.totalVisitors)}
                />
                <ConversionRow
                  label="Started checker → completed a check"
                  rate={pct(metrics.checkCompleted, metrics.checkerStarted)}
                />
                <ConversionRow
                  label="Checker started → clicked Human Review"
                  rate={pct(metrics.humanReviewClickedVisitors, metrics.checkerStartedVisitors)}
                />
                <ConversionRow
                  label="Human Review click → purchase"
                  rate={pct(metrics.humanReviewPurchased, metrics.humanReviewClicked)}
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                "Human Review click → purchase" will read 0% until real payment is wired up, since
                no purchase can currently be confirmed (see checkout.tsx).
              </p>
            </section>
          </>
        )}
      </div>
    </SiteLayout>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-rule/70 bg-card p-5">
      <p className="font-display text-3xl text-primary">{value.toLocaleString()}</p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function ConversionRow({ label, rate }: { label: string; rate: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold text-foreground">{rate}</span>
    </div>
  );
}
