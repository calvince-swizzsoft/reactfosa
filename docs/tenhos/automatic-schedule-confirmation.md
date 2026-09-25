# Schedule confirmation at disbursement

New verified loans entering batch disbursement now receive a validated reporting schedule with principal and interest confirmation set. The schedule is built from the saved loan terms and effective date, includes capitalized principal charges, and applies periodic interest minimums and rounding. Upfront interest uses the same calculation as the disbursement journal and is due once on the effective date. The loan payment and standing order use the confirmed amounts. Schedule and funding journals are saved together through the existing BulkSaveLoanDisbursement operation.

Nonstandard approved payment overrides, conflicting charge/recovery modes, or ambiguous interest mappings retain explicit manual-review evidence and unconfirmed flags. Invalid principal/term/date calculations fail validation before the loan is marked disbursed. The existing multi-transaction worker design is otherwise unchanged.

Historical schedules, including Case 15, are not silently confirmed. Operations > Loaning > Repayment Schedules > View schedule now offers Review and confirm schedule for existing unconfirmed plans. Review the server-generated proposal, then Save schedule to confirm a new revision. Exceptions block saving until resolved.

No schema migration or customer data change was required. Debug backend and SASRA tests cover standard loans, fees, zero interest, upfront interest, period/date/rounding rules, and historical/exception drafts. JSX syntax and API error handling were checked. No live end-to-end loan was disbursed as part of verification.

Stop the debugging session, rebuild the API and Windows Service in Debug, restart both, and refresh the frontend to load the changes. Previously the running worker locked its DLLs; source changes alone do not update that running process.
