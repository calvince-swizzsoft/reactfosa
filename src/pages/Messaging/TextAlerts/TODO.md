# Messaging/TextAlerts module — remaining work

Covers `TextAlertController` at `Messaging/TextAlerts` (`/Messaging/TextAlerts`
route), against `SwiftFinancialz/docs/api/textalert-api-spec.md`. First
frontend area in this app for the `Areas/Messaging` backend area — folder
name mirrors the backend Area, same convention as `Administration`/`FOSA`.

Built:
- **List page** (`index.jsx`) — paged, with a DLR status filter and text
  search. Text search is disabled (grayed out, with a tooltip explaining
  why) unless a DLR status is also selected — the backend's unfiltered `GET
  /` overload takes no text param at all, so `text` is silently ignored
  without a status filter; the UI reflects that constraint instead of
  implying a no-op search works.
- **Create drawer** (`CreateTextAlertDrawer.jsx`) — Branch, Category,
  Recipient, Message, and an "append signature" checkbox. Deliberately no
  inputs for `textMessageSecurityCritical`/`textMessagePriority`/
  `textMessageDLRStatus`/`textMessageOrigin`/`textMessageSendRetry` — the
  spec confirms all five are server-assigned and overwritten before
  validation, so any UI for them would be pure theater.
- **Client-side SMS recipient validation** — if `messageCategory` is
  `SMSAlert` and the recipient doesn't match the E.164-ish pattern the app
  service requires, this fails server-side as a raw `500` ("Failed to
  create text alert"), not a clean `400` — the spec calls this out
  explicitly as an app-service short-circuit, not a `ValidateAll()`
  failure. Validated client-side first (`SMS_RECIPIENT_PATTERN` in
  `api.js`) so the user gets a real warning instead of the generic 500 message.
- List columns pulled directly from `TextAlertDTO.cs` (not guessed):
  `TextMessageRecipient`, `MaskedTextMessageBody` (falls back to
  `TextMessageBody` if absent), `BranchCompanyDescription` (the DTO only
  denormalizes the *company*, not the branch's own description — see gap
  below), `TextMessageDLRStatusDescription`, `CreatedDate`.

Not done / known gaps:
- **`moduleRouteMap.js` uses the legacy hex-sum code (`26008`, i.e.
  `0x00006590 + 8`), per explicit user instruction** — the spec itself warns
  against this: that code belongs to a *different*, read-only reference
  controller (`Areas/Dashboard`, plural `TextAlertsController`) than the
  create-capable one this route serves (`Areas/Messaging`, singular
  `TextAlertController`); there's no seeded nav entry for the latter in the
  new system. If `26008` turns out to already be assigned to something else
  in `GET /api/administration/modules`, or the gate doesn't work as
  expected, that's why — swap in the real code once one exists.
- **No branch name column** — `TextAlertDTO` denormalizes
  `BranchCompanyId`/`BranchCompanyDescription` (the *company*) but not the
  branch's own description, so the list can't show which branch without an
  extra lookup against `branchId`. Not built; would need a client-side join
  against `/api/administration/branches` if wanted.
- **No date-range filter** — the app service supports one
  (`FindTextAlerts(dlrStatus, startDate, endDate, text, ...)`) but it isn't
  exposed on `GET /` per the spec ("ask if you need it surfaced") — not
  asked for, not built.
- **`GET /{id}`** (`getTextAlert` in `api.js`) — implemented but unused; no
  detail view exists since the list already shows every field this DTO
  exposes.
- **No update/delete** — spec confirms neither is exposed on this
  controller (closer to an audit/message-log entry than an editable
  record), even though the app-service interface has an `UpdateTextAlert`.
- **`MessageCategory`** only covers the 5 values the spec enumerates — it
  says more exist beyond `CreditBatchEntry`; not guessed.
