# Defaulter Notices

Open **Back Office > Operations > Loaning > Defaulter Notices** (module 70025).

1. Choose an arrears **as-at date** and click **Find eligible notices**.
2. Review the loan, recipient, stage, channel and arrears. Review messages explain unresolved ageing, missing company links or missing guarantors.
3. Click **Generate draft** to save the rendered message and its supporting snapshot. **View existing** opens a previously saved notice instead of creating a duplicate.
4. Read the message in the preview drawer. If required by the saved policy, another user must approve it.
5. Download the printable HTML file, open it in a browser, and use Print or Save as PDF. Unapproved drafts are labelled; email/SMS copies are previews, not sent messages.

Saved notices remain in history, including cancelled ones. Their message, policy revision and arrears do not change when company settings or payments change. A response deadline starts from draft preparation, not the historical as-at date. Cancel an outdated notice before preparing a replacement for a later as-at date. This first phase does not record delivery.

Each stage whose thresholds are met is shown for explicit selection; stages are not automatically escalated. Guarantors are resolved from currently attached guarantors on the loan case. Missing or unresolved ageing is not treated as zero. Active notices for the same loan, stage and recipient are reused across dates. A unique database key also prevents duplicate same-date notices, including after cancellation or policy changes.

Rollout uses the updated Utility automatic migration and navigation seed, followed by an API restart and navigation refresh. Assign module 70025 to the intended roles using the existing role administration. The table is `swiftFin_LoanNotices`; no manual SQL creation is needed.
