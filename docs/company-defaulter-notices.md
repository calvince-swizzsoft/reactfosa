# Company defaulter notice settings

Company create/edit includes a Defaulter Notice Settings tab. Configure borrower reminders, first/second notices, final demands, guarantor notifications and guarantor demands. Each stage has an overdue-days threshold, minimum arrears, recipient, response period, channel, approval flag and plain-text template. Field popovers explain these values. The default policy is disabled with no stages.

These are company policy settings, not automatic sending or recovery. Loaning > Defaulter Notices now consumes the policy for eligibility, saved drafts, independent approval and printable downloads. Email/SMS delivery remains unconnected. No universal statutory notice deadlines are assumed.

The template editor provides a **Use starter message** button for the selected notice type and channel, with **Undo starter** to restore the previous wording. Insert-detail buttons place supported placeholders at the text cursor. The live preview uses fictional details and displays an approximate sample character count for SMS. Changing notice type or channel does not overwrite a custom message. Starter messages are editable message bodies; previews are not generated or sent notices.

The backend resolves ownership using **LoanCase.BranchId → Branch.CompanyId → Company**. It reads the current policy through `GET /api/backoffice/loan-notices/cases/{loanCaseId}/policy`. There is no fallback to the operator's branch or the borrower's home branch. A missing loan/company link returns a useful error. A company without configured settings resolves to a disabled policy.

The existing company POST/PUT payload carries `defaulterNoticePolicyJson` and `defaulterNoticePolicyRevision`. JSON uses `enabled` and `stages`; stage properties are `noticeType`, `daysOverdue`, `minimumArrears`, `recipient`, `responseDays`, `channel`, `requireApproval`, and `template`. The server validates settings, canonicalizes the JSON and increments the revision when it changes. Stale revisions are rejected. Older callers omitting the policy preserve existing settings.

Persistence follows the Company domain, DTO, AppService and EF mapping. `swiftFin_Companies` receives `DefaulterNoticePolicyJson` and `DefaulterNoticePolicyRevision` columns through existing automatic migrations. Build and run the updated Utility migration project before using the updated API. There is no custom schema creation or deletion script.

Validation checks cover invalid thresholds, duplicate stages, incompatible recipients, malformed settings/templates, revision conflicts and preservation by older callers. Frontend, API and Utility development builds were checked. Live database migration and an end-to-end company save have not been performed as part of this change.
