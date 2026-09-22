# Defaulter Notices

Open **Back Office > Operations > Loaning > Defaulter Notices** (module 70025).

The first four tabs are exclusive workflow queues per loan:

1. **First notice** lists defaulters awaiting the first notice, including loans waiting for company thresholds or policy setup.
2. **Second notice** receives a loan once the first notice has been recorded as sent to all required recipients.
3. **Third notice** receives it after second-notice dispatch. This uses the existing **Final demand** company policy type.
4. **Recovery** receives it after third-notice dispatch. It becomes eligible for recovery review once the final response deadline has expired and arrears remain. This list does not initiate recovery or post transactions.

Each sent recipient leaves the previous queue immediately. Where a stage includes multiple recipients, the loan advances only after all recipients captured for that stage have been sent their notices. Drafting, approval and downloading never count as sending.

Choose an arrears **as-at date** and refresh. Stage placement reflects recorded dispatch history; the date controls arrears calculations and response-period checks. Waiting loans remain in their current tab with an explanation. Unknown ageing excludes a loan with a review message; loans without arrears are excluded. Counts and pagination apply to the selected queue.

For an eligible recipient, **Generate draft**, review the saved message and obtain independent approval if required. Email and SMS notices show the recipient's customer-record contact: choose **Send Email** or **Send SMS** and confirm the destination. The saved message is queued atomically with its notice link. Existing email/SMS dispatcher jobs pick up the Pending alert. The notice stays in its current stage while queued and advances only when SMTP accepts the email or the SMS provider accepts the message. The drawer refreshes queued status every five seconds. Provider acceptance is not proof that the recipient has read the notice.

For Print notices, download the printable copy, deliver it outside the system, then choose **Record as sent** and enter a dispatch reference. Electronic notices cannot use manual dispatch to bypass sending. A notice whose response deadline is today or earlier cannot be newly sent; cancel an unsent notice and prepare a fresh one first.

Failed submissions remain in the same stage. Review the alert in Messaging and use **Retry Email/SMS** explicitly after resolving the failure. A retry creates a new alert and preserves the previous attempt's ID, destination, status, actor and time. Queued, sent and failed electronic notices cannot be cancelled; this prevents an in-flight send from being hidden. Repeated clicks while queued or sent reuse the current alert.

**Other notices** retains reminders and guarantor notices independently of the three-stage sequence. **Saved notices** retains the full history, including sent and cancelled notices. Sent notices cannot be cancelled or resent through this workflow. Existing drafts and approved notices are not assumed to have been sent.

Company settings must configure First notice, Second notice and Final demand. No stages are skipped because a setting is missing. Days overdue, minimum arrears and previous response deadlines continue to apply. The saved response deadline still starts at draft preparation and is not rewritten at dispatch. Saved messages and policy snapshots remain unchanged.

Rollout requires the updated API and dispatcher Application/Domain/DTO/Infrastructure assemblies, and the normal Utility automatic migration for the new nullable audit and delivery fields on swiftFin_LoanNotices, followed by API and messaging-service restarts. The SwiftFinancialsService email and SMS queueing jobs and receivers must be enabled for the same application domain and database as the API. Pending alerts cannot leave the database if the dispatcher service is stopped. No manual table creation is required. Builds alone do not migrate the database.

Older drafts without captured recipients preserve their original snapshot; dispatch captures the required recipient IDs in StageRecipientIdsJson. This prevents partial dispatch from skipping other required recipients.

Delivery verification: development provider tests on 21 September 2026 were accepted by SMTP and by the SMS endpoint (HTTP 204). The user confirmed receipt of both labelled test messages. These were targeted provider tests; they did not start the background service or process other queued messages. Automated service tests cover queue creation, recipient validation, duplicate suppression, failure, retry and stage progression.


## Loan-level notice stages
The notice screen exposes First notice, Second notice, Third notice and Recovery only. Other/Saved notice tabs and recipient drawers are removed. GET `loan-notices/loans` groups before pagination and counts each loan once. POST `loan-notices/loans/action` performs prepare, approve, send, printed dispatch or reset for the stage’s required recipients. Email/SMS sending validates all contacts before writes and stages all new messages in one transaction. Existing queued/sent messages are not duplicated; explicit retries cover failures only. Existing per-recipient records remain for delivery tracking and audit. Print produces one bundled document. Current eligibility is rechecked at dispatch; recovery itself sends no messages.


## Deposit recovery from the Recovery tab

Each loan has a **Recover** action which opens a preview with a **Recover deposits from** checkbox list for the borrower and each guarantor. No accounts are selected initially. Selecting accounts recalculates the preview on the server; unselected accounts never contribute funds. It uses today's balances even if the list was viewed at a historical date. **Recover deposits** posts only after the operator confirms the displayed debit total. The existing Guarantor Attachment debt-transfer screen is unchanged.

- Target: overdue principal plus overdue interest already posted to interest receivable; no full-loan recall and no implicit interest accrual. Interest is settled before principal.
- Borrower deposits first, then capped proportional allocation among the loan's active guarantors. Capped amounts are redistributed within remaining guarantee capacity. The drawer shows uncovered shortfall.
- Sources: normal, approved accounts of approved/unlocked members, unlocked savings or investment/deposit products, and unlocked liability-classified control accounts. Equity/share capital is excluded by GL classification. The investment product’s Refundable flag does not control recovery eligibility. Investment credits must have matured; debits count immediately. Product/branch minimum balances are retained; accounts with running/pending fixed deposits are excluded. Only cleared balances on the product control account count, never absolute values of debit balances.
- Other active guarantees are conservatively reserved at their full recorded amount. This loan's own guarantee is not deducted twice. Remaining guarantee subtracts both previous deposit recoveries and legacy attachment-history amounts. The original guarantee contract and status are retained; this flow does not automatically release a guarantee or rewrite the original amount guaranteed. Prior recoveries/attachments remain conservatively deducted after a reversal until reviewed.
- An unresolved ageing report, shared loan account, duplicate active guarantors, invalid ledger mapping, or missing current posting period prevents posting. Notice response deadlines do not add a recovery waiting period.
- The server rebuilds the preview inside a serializable transaction; a changed preview returns 409. Journal debits/credits and the immutable recovery snapshot commit together. A persisted unique request ID makes retries idempotent.

Persistence adds the EF-mapped LoanRecoveries table through the existing additive automatic migration. Restart the API on the updated Debug build so the current EF model initializes; deployments using Utility must run its updated automatic migration before recovery. No recovery is posted by migration.
