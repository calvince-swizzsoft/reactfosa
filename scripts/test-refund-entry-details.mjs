import assert from "node:assert/strict";
import { refundAccountDetails, refundEntryStatus, refundAmount, refundPageSummary } from "../src/pages/Accounts/BatchProcedures/lib/refundEntryDetails.js";

const entry = {
  DebitCustomerFullName: "Jane Member",
  DebitFullAccountNumber: "001-0000042-002-001",
  DebitProductDescription: "Development loan",
  CreditCustomerFullName: "Jane Member",
  CreditFullAccountNumber: "001-0000042-001-001",
  CreditProductDescription: "Savings",
  Principal: "1000.25", Interest: "25.50", Status: 0,
};
assert.deepEqual(refundAccountDetails(entry, "Debit"), { name: "Jane Member", number: "001-0000042-002-001", product: "Development loan" });
assert.deepEqual(refundAccountDetails(entry, "Credit"), { name: "Jane Member", number: "001-0000042-001-001", product: "Savings" });
assert.equal(refundAmount(entry), 1025.75, "Decimal strings must add numerically");
assert.equal(refundEntryStatus(0).label, "Not posted", "New refund entries have an unset status of zero");
assert.equal(refundEntryStatus("2").label, "Posted");
assert.equal(refundEntryStatus(4).label, "Rejected");
assert.equal(refundEntryStatus(undefined).label, "Status unavailable", "Missing status must not imply successful posting");
assert.equal(refundAccountDetails({}, "Debit").name, "Account holder unavailable");
assert.equal(refundAccountDetails({ DebitCustomerAccountCustomerIndividualFirstName: "Jane", DebitCustomerAccountCustomerIndividualLastName: "Member" }, "Debit").name, "Jane Member");
assert.equal(refundPageSummary({ PageCollection: [entry], ItemsCount: 80, TotalApportioned: "15000.75" }).total, 15000.75, "Use the full server total across all pages");
assert.equal(refundPageSummary({ PageCollection: [entry], ItemsCount: 80 }).total, null, "Do not present a single page subtotal as the batch total");
assert.equal(refundPageSummary({ pageCollection: [entry], itemsCount: 1 }).total, 1025.75);
assert.deepEqual(refundPageSummary({ PageCollection: [], ItemsCount: 0, TotalApportioned: 0 }), { entries: [], count: 0, total: 0 });
console.log("Refund entry account mapping, statuses, amounts and paged totals: 13 checks passed.");
