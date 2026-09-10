// Guest personal-statement checker: answers and check results are kept in
// sessionStorage for the current browser session only. No account/user id is
// involved, so the free checker works without authentication.

export const DRAFT_STORAGE_KEY = "statementClinic:draft";
export const SELECTED_PLAN_KEY = "statementClinic:selectedPlan";
export const FREE_CHECKS_USED_KEY = "statementClinic:freeChecksUsed";
export const MAX_FREE_CHECKS = 3;

export type PlanId = "weekly" | "season";

export function checkStorageKey(checkId: string) {
  return `statementClinic:check:${checkId}`;
}
