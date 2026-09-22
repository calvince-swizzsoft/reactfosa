# Intra Account Transfer

Navigation code 23049 routes to `/Accounts/IntraAccountTransfer`.

## Existing backend support

This page uses `WebApplication1/Areas/Accounts/Controllers/InterAccountTransferBatchController.cs`
(`/api/accounts/interaccounttransferbatches`), `IInterAccountTransferBatchAppService` /
`InterAccountTransferBatchAppService`, and the `InterAccountTransferBatch`,
`InterAccountTransferBatchEntry` and `InterAccountTransferBatchDynamicCharge` domain aggregates.
Posting uses `IJournalAppService` and the Journal/JournalEntry domain.
No new API, database table or direct database access was needed.

The reference MVC `IntraAccountTransferController` uses these same transfer-batch
operations for Create, Verify and Authorize. It does not define a separate persisted
intra-transfer type. Accordingly, this page shows the shared transfer register and
keeps verification/authorization on the existing permission-gated batch routes.
Saving a batch or allocation is not posting money.

## Supported flow

1. Select a source customer through the shared server-paged lookup, then a savings
   or investment account. Current balances come from the AppService balance endpoint.
2. Create the batch and open its details immediately.
3. Add destination accounts restricted to the same customer, excluding the source.
   Add principal/amount, interest for loans, both descriptions and a reference.
4. Add multiple allocations and save any selected dynamic charges.
5. Verify and authorize from Batch Procedures → Inter Account Transfer. Transfers
   post at authorization, using the existing service and transaction-authority rules.

New allocations on this page do not offer G/L destinations. Existing shared batches
containing G/L rows are read-only here and remain editable in Batch Origination.
Client validation checks cumulative source balance and loan principal/interest limits.
The AppService independently validates same-customer and cumulative loan limits when
saving entries and authorizing. Displayed source balances do not reserve funds or
include a quotation of all charges; review current funds and charges before posting.

## Guide differences

The supplied `WebApplication1/Areas/Accounts/Intra Account Transfer.md` mentions
carry-forward recovery. The current transfer-batch entry DTO/domain/posting path has
no persisted recovery flag, and the reference MVC controller does not implement one.
No nonfunctional checkbox was added. Journal apportionment supports recovery in other
flows, but adding it to transfer batches requires a separate backend contract/domain
change and verification through authorization.

The reference MVC controller also compares full account numbers to establish customer
ownership and requires transfers to equal the entire displayed source balance. These
checks were not copied: distinct account IDs must belong to the same customer, and
partial transfers are allowed up to the available displayed balance.

## Verification

- `node scripts/test-intra-account-transfer.mjs`
- `node scripts/test-transfer-validation.mjs`
- Development frontend build (never a Release deployment).
