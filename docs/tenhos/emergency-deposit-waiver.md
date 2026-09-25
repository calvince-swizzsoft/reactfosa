# Emergency loan own-deposit guarantor waiver

Enabled in local development only for Tenhos Emergency Loan on 25 September 2026. The normal minimum remains four; all other products retain their prior configuration.

- Product setting: `WaiveGuarantorsBelowOwnDeposits` (nullable; unset/false preserves ordinary guarantor rules).
- Exactly one unlocked BOSA investment appraisal product must be designated. Emergency uses Deposit Contribution, excluding share capital and ordinary savings.
- Positive principal, at most two decimal places, must be strictly less than book deposits minus attached guarantee commitments and other active own-deposit reservations. No deposit multiplier applies to this comparison.
- With no guarantors, registration recomputes eligibility and reserves the principal atomically against the designated account. Client balance/reservation fields cannot establish eligibility.
- Sync/async appraisal, approval, verification and disbursement recheck availability and update the reservation for the relevant stage amount. Generic edits and restructuring cannot silently discard the security.
- Reservations reduce a member's external guarantee capacity before applying its multiplier. Normal journal writes and bulk posting reject aggregate debits that spend the reserved principal. Account locks serialize posting and reservation checks.
- Rejection stops the hold. Otherwise the full principal stays reserved until explicit release after the associated loan account has zero principal and interest. No automatic proportional release is assumed. The release endpoint requires BOSA loan approval permission.
- New DTOs expose reserved account and amount. Registration shows the server quote; later stages show the persisted reservation.

Schema uses the ordinary EF model migration/history path (four nullable columns), not independent SQL column alterations. Rates, fees, income-assessment settings and the other products were not changed by this task.

Verification: strict/equality/commitment boundaries; actual registration with zero guarantors; reservation read-back; exclusion from subsequent loans and guarantees; blocked withdrawal; blocked appraisal and approval increases. The framework uses its own transactions, so the initial outer-rollback experiment left verification case 14. It was rejected via AppService and its reservation released; no disbursement or withdrawal occurred. Grace's KES 50,000 balance and uncommitted availability were verified afterward.

`waiver-test` creates a clearly identified verification case and rejects it in `finally`; it never disburses. `waiver-enable` saves only the opt-in product flag. All utility modes are restricted to the previously authorized local database.
