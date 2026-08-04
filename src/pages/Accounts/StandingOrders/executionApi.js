import { apiFetch } from "@/lib/api";

// Client functions for WebApplication1's StandingOrderExecutionController —
// a separate controller from api.js's StandingOrderController.
// Spec: SwiftFinancialz/docs/api/standing-order-execution-api-spec.md
//
// Not customer-facing — every endpoint here runs a potentially large batch
// operation across many accounts (the same runs a Quartz-scheduled Windows
// Service fires on a cron; these let admin/ops re-trigger them on demand).
// Gate whatever screen calls these behind an admin/ops role.

const FIN_BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
const EXECUTION_BASE = `${FIN_BASE}/api/accounts/standingorders/execution`;

// Used as `priority` on every endpoint below.
export const QueuePriority = {
  Lowest: 0,
  VeryLow: 1,
  Low: 2,
  Normal: 3,
  AboveNormal: 4,
  High: 5,
  VeryHigh: 6,
  Highest: 7,
};

// Every endpoint returns { success, message, data: boolean }. `data: false`
// means "ran, but nothing matched" (e.g. no due orders) — not a failure.
// Callers get both `ran` (the boolean) and `message` (the server's own
// "X executed successfully" / "No X were executed" text) so the UI can show
// the real outcome instead of a generic "done". A 500 partway through a
// batch may mean some orders executed and others didn't — check
// getSkippedStandingOrders() (api.js) afterward rather than assuming
// all-or-nothing.
async function unwrap(responsePromise) {
  const res = await responsePromise;
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.success === false) {
    throw new Error(body.message || "Request failed");
  }
  return { ran: body.data, message: body.message };
}

/**
 * POST /execute — run standing orders due as of targetDate, retrying up to
 * maximumStandingOrderExecuteAttemptCount times each before an order counts
 * as skipped. Mirrors the scheduled Dispatcher job (StandingOrderJob).
 */
export function executeDueStandingOrders({
  targetDate,
  targetDateOption,
  priority,
  maximumStandingOrderExecuteAttemptCount,
  pageSize = 100,
}) {
  return unwrap(
    apiFetch(`${EXECUTION_BASE}/execute`, {
      method: "POST",
      body: JSON.stringify({ targetDate, targetDateOption, priority, maximumStandingOrderExecuteAttemptCount, pageSize }),
    })
  );
}

/**
 * POST /fix-skipped — resets the execute-attempt count to 0 for standing
 * orders skipped on/before targetDate, so the next /execute run retries
 * them. Mirrors the scheduled Fixer job (SkippedStandingOrderJob).
 */
export function fixSkippedStandingOrders({ targetDate, pageSize = 100 } = {}) {
  return unwrap(
    apiFetch(`${EXECUTION_BASE}/fix-skipped`, {
      method: "POST",
      body: JSON.stringify({ targetDate, pageSize }),
    })
  );
}

/**
 * POST /sweep — processes every standing order with Trigger = Sweep (moves
 * an account's full balance, not a fixed amount). Mirrors the scheduled
 * Sweeper job (SweepingStandingOrderJob).
 */
export function sweepStandingOrders({ priority, pageSize = 100 }) {
  return unwrap(
    apiFetch(`${EXECUTION_BASE}/sweep`, {
      method: "POST",
      body: JSON.stringify({ priority, pageSize }),
    })
  );
}

/**
 * POST /payout — runs a single benefactor account's payout on demand (e.g.
 * "run this member's dividend payout now"). No scheduled job triggers this
 * one today.
 */
export function payoutStandingOrder({ benefactorCustomerAccountId, month, priority }) {
  return unwrap(
    apiFetch(`${EXECUTION_BASE}/payout`, {
      method: "POST",
      body: JSON.stringify({ benefactorCustomerAccountId, month, priority }),
    })
  );
}
