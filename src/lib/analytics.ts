import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

// A random, non-personally-identifying id, persisted in localStorage (not
// sessionStorage) so it survives across tabs/visits and lets "total
// visitors" be counted distinctly from "total page views" — this is the
// only identifier analytics ever uses. It is never linked to a name, email,
// or personal statement content.
const VISITOR_ID_KEY = "statementClinic:visitorId";

export function getVisitorId(): string {
  if (typeof window === "undefined") return "server";
  try {
    let id = window.localStorage.getItem(VISITOR_ID_KEY);
    if (!id) {
      id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      window.localStorage.setItem(VISITOR_ID_KEY, id);
    }
    return id;
  } catch {
    // localStorage can throw in some private-browsing modes — analytics
    // should never break the site, so just fall back to a per-call id.
    return "unavailable";
  }
}

export type AnalyticsEventName =
  | "page_view"
  | "checker_started"
  | "check_completed"
  | "check_1_used"
  | "check_2_used"
  | "check_3_used"
  | "human_review_clicked"
  | "upgrade_clicked"
  | "human_review_purchased";

/**
 * Fire-and-forget event recording. Never throws, never awaited by callers,
 * and never sends statement content — only the event name, current path,
 * and small non-identifying metadata (e.g. { plan: "weekly" }).
 */
export function trackEvent(eventName: AnalyticsEventName, metadata?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  try {
    // supabase-js's query builder is a "thenable" — the underlying fetch
    // only actually fires once something calls .then()/await on it. `void`
    // alone does NOT trigger it (this was tested and caught: events were
    // silently never sent until this explicit .then()/.catch() was added).
    supabase
      .from("analytics_events")
      .insert({
        visitor_id: getVisitorId(),
        event_name: eventName,
        path: window.location.pathname,
        metadata: (metadata as Json) ?? null,
      })
      .then(
        () => {},
        () => {},
      );
  } catch {
    // Analytics must never interfere with the actual user experience.
  }
}

// Several pages (review results, account history, etc.) render their
// <SiteLayout> fresh across a loading -> ready state transition, which
// mounts more than one SiteLayout instance for what is really a single page
// visit — each mount would otherwise fire its own page_view for the exact
// same path (caught by testing: 4 page_view rows for one visit to a results
// page). A ref inside SiteLayout can't help, since it's destroyed along with
// each unmounted instance; a module-level guard survives across that
// remount and correctly still fires once per genuine navigation.
let lastTrackedPath: string | null = null;

export function trackPageView(pathname: string) {
  if (pathname === lastTrackedPath) return;
  lastTrackedPath = pathname;
  trackEvent("page_view");
}
