import { apiJson } from "@/lib/api";

// Client functions for WebApplication1's StandingOrderController.
// Spec: SwiftFinancialz/docs/api/standing-order-api-spec.md
// For the separate admin/ops batch-execution controller, see executionApi.js.

const FIN_BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
const STANDING_ORDER_BASE = `${FIN_BASE}/api/accounts/standingorders`;

export const StandingOrderTrigger = {
  Payout: 0,
  CheckOff: 1,
  Schedule: 2,
  Sweep: 3,
  Microloan: 4,
};

export const ScheduleFrequency = {
  Annual: 1,
  SemiAnnual: 2,
  Quarterly: 3,
  TriAnnual: 4,
  BiMonthly: 6,
  Monthly: 12,
  SemiMonthly: 24,
  BiWeekly: 26,
  Weekly: 52,
  Daily: 365,
};

export const ChargeType = {
  Percentage: 1,
  FixedAmount: 2,
};

// Loan beneficiaries only.
export const RoundingType = {
  NoRounding: 0,
  ToEven: 1,
  AwayFromZero: 2,
  Ceiling: 3,
  Floor: 4,
};

export const CustomerFilter = {
  SerialNumber: 0,
  PersonalIdentificationNumber: 1,
  FirstName: 2,
  LastName: 3,
  IdentityCardNumber: 4,
  PayrollNumbers: 5,
};

export const StandingOrderCustomerAccountFilter = {
  Beneficiary: 0,
  Benefactor: 1,
};

// Used as `productCode` in getStandingOrdersByBenefactorCustomer.
export const ProductCode = {
  Savings: 1,
  Loan: 2,
  Investment: 3,
};

// Used as `targetDateOption` in getDueStandingOrders (and executionApi.js's
// executeDueStandingOrders) — picks which schedule field targetDate is
// compared against (StandingOrderSpecifications.DueStandingOrders). 0 is
// also the fallback for any unrecognized value.
export const TargetDateOption = {
  ActualRunDate: 0, // Schedule.ActualRunDate, holiday-adjusted (default)
  ExpectedRunDate: 1, // Schedule.ExpectedRunDate, nominal pre-holiday-adjustment
};

// Every endpoint returns { success, message, data }. Callers just await +
// try/catch (matching the Swal.fire error pattern used across this app's
// forms) instead of re-checking res.ok/success at every call site. The
// thrown Error carries the HTTP status too, so createStandingOrder's duplicate
// 409 can be presented as a specific business-rule conflict.
const normalizeKeys = (value) => {
  if (Array.isArray(value)) return value.map(normalizeKeys);
  if (!value || typeof value !== "object") return value;

  return Object.fromEntries(Object.entries(value).map(([key, item]) => [
    key.length ? `${key[0].toLowerCase()}${key.slice(1)}` : key,
    normalizeKeys(item),
  ]));
};

async function unwrap(responsePromise) {
  const body = await responsePromise;
  return normalizeKeys(body.data ?? body.Data);
}

const buildQuery = (params) => {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    usp.set(key, String(value));
  });
  const qs = usp.toString();
  return qs ? `?${qs}` : "";
};

/** GET / — paged list/search. Returns PageCollectionInfo<StandingOrderDTO>. */
export function listStandingOrders({
  pageIndex = 0,
  pageSize = 20,
  text,
  customerAccountFilter,
  customerFilter,
  trigger,
} = {}) {
  return unwrap(
    apiJson(
      `${STANDING_ORDER_BASE}${buildQuery({ pageIndex, pageSize, text, customerAccountFilter, customerFilter, trigger })}`
    )
  );
}

/** GET /{id} — single standing order. */
export function getStandingOrder(id) {
  return unwrap(apiJson(`${STANDING_ORDER_BASE}/${id}`));
}

/** GET /{id}/history — paged StandingOrderHistoryDTO. */
export function getStandingOrderHistory(id, { pageIndex = 0, pageSize = 20 } = {}) {
  return unwrap(apiJson(`${STANDING_ORDER_BASE}/${id}/history${buildQuery({ pageIndex, pageSize })}`));
}

/** GET /by-benefactor-account/{id} — StandingOrderDTO[], optionally narrowed by trigger. */
export function getStandingOrdersByBenefactorAccount(benefactorCustomerAccountId, { trigger } = {}) {
  return unwrap(
    apiJson(`${STANDING_ORDER_BASE}/by-benefactor-account/${benefactorCustomerAccountId}${buildQuery({ trigger })}`)
  );
}

/** GET /by-beneficiary-account/{id} — StandingOrderDTO[], optionally narrowed by trigger. */
export function getStandingOrdersByBeneficiaryAccount(beneficiaryCustomerAccountId, { trigger } = {}) {
  return unwrap(
    apiJson(`${STANDING_ORDER_BASE}/by-beneficiary-account/${beneficiaryCustomerAccountId}${buildQuery({ trigger })}`)
  );
}

/** GET /by-benefactor-customer/{id} — StandingOrderDTO[] across all of a customer's accounts. */
export function getStandingOrdersByBenefactorCustomer(benefactorCustomerId, { productCode } = {}) {
  return unwrap(
    apiJson(`${STANDING_ORDER_BASE}/by-benefactor-customer/${benefactorCustomerId}${buildQuery({ productCode })}`)
  );
}

/**
 * GET /due — unpaged StandingOrderDTO[] due on/around targetDate.
 * Intended for operational review, not a UI listing of large result sets.
 */
export function getDueStandingOrders({
  targetDate,
  targetDateOption,
  text,
  customerAccountFilter,
  customerFilter,
} = {}) {
  return unwrap(
    apiJson(`${STANDING_ORDER_BASE}/due${buildQuery({ targetDate, targetDateOption, text, customerAccountFilter, customerFilter })}`)
  );
}

/** GET /skipped — paged StandingOrderDTO that were due on/before targetDate but didn't execute. */
export function getSkippedStandingOrders({
  targetDate,
  text,
  customerAccountFilter,
  customerFilter,
  pageIndex = 0,
  pageSize = 20,
} = {}) {
  return unwrap(
    apiJson(`${STANDING_ORDER_BASE}/skipped${buildQuery({ targetDate, text, customerAccountFilter, customerFilter, pageIndex, pageSize })}`)
  );
}

/**
 * POST / — create. `standingOrder` is a full StandingOrderDTO.
 * A duplicate benefactor/beneficiary/trigger combo isn't rejected outright —
 * the record is still created but the server responds 409 with a message
 * describing the conflict. unwrap() throws on any non-2xx, so callers that
 * want the "created, but flagged" UX (show the message, don't treat it as a
 * hard failure) need to catch this specifically rather than lump it in with
 * other errors.
 */
export function createStandingOrder(standingOrder) {
  return unwrap(
    apiJson(STANDING_ORDER_BASE, {
      method: "POST",
      body: JSON.stringify(standingOrder),
    })
  );
}

/**
 * PUT /{id} — update. `standingOrder.id` must equal `id`.
 * Don't compute ScheduleExpectedRunDate/ScheduleActualRunDate client-side —
 * the server recomputes them when the schedule's start date or frequency
 * changes after skipped runs have accrued.
 */
export function updateStandingOrder(id, standingOrder) {
  return unwrap(
    apiJson(`${STANDING_ORDER_BASE}/${id}`, {
      method: "PUT",
      body: JSON.stringify(standingOrder),
    })
  );
}

/**
 * POST /auto-create — bulk-provisions a monthly Payout standing order for
 * every customer holding both products who doesn't already have one.
 * Admin/back-office tooling, not a per-customer create flow.
 * Returns boolean — false just means nothing new was created, not an error.
 */
export function autoCreateStandingOrders({ benefactorProductId, benefactorProductCode, beneficiaryProductId }) {
  return unwrap(
    apiJson(`${STANDING_ORDER_BASE}/auto-create`, {
      method: "POST",
      body: JSON.stringify({ benefactorProductId, benefactorProductCode, beneficiaryProductId }),
    })
  );
}
