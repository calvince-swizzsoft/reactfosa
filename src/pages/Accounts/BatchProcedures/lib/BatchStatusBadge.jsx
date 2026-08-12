// BatchStatus — shared across all 9 batch-procedure types
// (Infrastructure.Crosscutting.Framework.Utils.Enumerations.cs):
// Pending=1, Posted=2, Rejected=4, Audited=8 ([Description] on 8 is
// "Verified", not "Audited" — used here instead). Voucher/General Ledger
// declare their own JournalVoucherStatus/GeneralLedgerStatus enums with the
// same numeric values, so this switches on the number, not an enum name.
const STATUS_META = {
  1: { label: "Pending", cls: "bg-amber-100 text-amber-600" },
  2: { label: "Posted", cls: "bg-green-100 text-green-600" },
  4: { label: "Rejected", cls: "bg-red-100 text-red-600" },
  8: { label: "Verified", cls: "bg-blue-100 text-blue-600" },
};

export default function BatchStatusBadge({ status }) {
  const meta = STATUS_META[status] || { label: "Unknown", cls: "bg-gray-100 text-gray-600" };
  return <span className={`px-2 py-1 rounded text-xs font-semibold ${meta.cls}`}>{meta.label}</span>;
}
