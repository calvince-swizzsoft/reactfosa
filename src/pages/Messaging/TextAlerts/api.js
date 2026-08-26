import { apiJson as apiFetch } from "@/lib/api";

// Client functions for WebApplication1's TextAlertController.
// Spec: SwiftFinancialz/docs/api/textalert-api-spec.md

const FIN_BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
const TEXT_ALERT_BASE = `${FIN_BASE}/api/messaging/textalert`;

export const DLRStatus = {
  UnKnown: 1,
  Failed: 2,
  Pending: 4,
  Delivered: 8,
  NotApplicable: 16,
  Submitted: 32,
};

// Forced to 1 (Within) on create — listed for completeness when reading
// existing records, not used as a create-time input.
export const MessageOrigin = {
  Within: 1,
  Without: 2,
  Other: 4,
};

// Only the values the spec enumerates ("a few more exist beyond
// CreditBatchEntry" — not guessing the rest).
export const MessageCategory = {
  SMSAlert: 1,
  USSDQuery: 2,
  EmailAlert: 4,
  PluginAlert: 8,
  CreditBatchEntry: 16,
};

// Forced to 5 (High) on create — listed for completeness only.
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

async function unwrap(responsePromise) {
  const body = await responsePromise;
  return body.data;
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

/**
 * GET / — paged list. Omitting dlrStatus returns the plain unfiltered
 * listing and `text` is ignored in that case (the unfiltered app-service
 * overload takes no text param) — ONLY pass `text` together with a
 * `dlrStatus`, per the spec. Returns PageCollectionInfo<TextAlertDTO>.
 */
export function listTextAlerts({ pageIndex = 0, pageSize = 20, dlrStatus, text } = {}) {
  return unwrap(
    apiFetch(`${TEXT_ALERT_BASE}${buildQuery({ pageIndex, pageSize, dlrStatus, text: dlrStatus !== undefined ? text : undefined })}`)
  );
}

/** GET /{id} — single text alert. */
export function getTextAlert(id) {
  return unwrap(apiFetch(`${TEXT_ALERT_BASE}/${id}`));
}

/**
 * POST / — create. `textAlert` needs branchId, textMessageRecipient,
 * textMessageBody, and messageCategory (not defaulted server-side, unlike
 * every other field below). textMessageSecurityCritical/textMessagePriority/
 * textMessageDLRStatus/textMessageOrigin/textMessageSendRetry are all
 * server-assigned — sending them is pointless, the server overwrites them
 * before validation runs, so don't bother building UI for them.
 *
 * If messageCategory is SMSAlert (1) and textMessageRecipient doesn't match
 * the E.164-ish pattern the app service requires, the create fails as a
 * *500* ("Failed to create text alert") rather than a clean 400 — that's an
 * app-service short-circuit, not a ValidateAll() failure, so validate the
 * recipient format client-side first when category is SMSAlert to avoid
 * surfacing that confusing 500 to the user.
 */
export function createTextAlert(textAlert) {
  return unwrap(
    apiFetch(TEXT_ALERT_BASE, {
      method: "POST",
      body: JSON.stringify(textAlert),
    })
  );
}

// Same pattern required server-side for SMSAlert recipients — validate
// client-side first so a bad number surfaces as a clean warning instead of
// the app-service's 500 short-circuit.
export const SMS_RECIPIENT_PATTERN = /^\+(?:[0-9]??){6,14}[0-9]$/;
