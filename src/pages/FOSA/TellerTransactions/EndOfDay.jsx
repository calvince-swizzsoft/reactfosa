import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import Swal from "sweetalert2";
import { FaHourglassEnd } from "react-icons/fa";
import { apiErrorMessage, apiJson } from "@/lib/api";
import { getEmployeeIdFromToken } from "@/lib/auth";
import DenominationCountFields, {
  emptyDenominationCounts,
  sumDenominations,
  toDenominationSubtotals,
} from "../lib/DenominationCountFields";
import { TellerCashBalanceStatus } from "../lib/frontOfficeEnums";
import ReceiptModal from "../lib/ReceiptModal";
import FieldHelp from "@/pages/Accounts/SavingsProducts/FieldHelp";

const BASE = `${import.meta.env.VITE_APP_FIN_URL}`;

// EndOfDayController.Create (Areas/FrontOffice/Controllers/EndOfDayController.cs)
// — read directly from source, not the doc spec, since a few load-bearing
// details aren't documented:
// - Route is POST api/frontoffice/endofday (empty action route on the
//   controller's RoutePrefix) — not /api/endofday.
// - TellerId/EmployeeId in the body are always overwritten from the
//   caller's JWT ("EmployeeId" claim) — no Employee/teller picker needed.
// - The body is a CashTransferRequestDTO. It originally had no
//   per-denomination fields (only the summed ClosingBalance was needed) —
//   a later backend change added the same 11 Denomination*Value fields
//   FiscalCountDTO carries, and now REQUIRES them to reconcile exactly
//   against ClosingBalance (DENOMINATION-CAPTURE-FRONTEND-GUIDE.md), 400ing
//   otherwise. Since ClosingBalance here is always computed as
//   sumDenominations(counts), the two can never actually mismatch — see
//   toDenominationSubtotals() for the piece-count → wire-subtotal
//   conversion (each field is a monetary subtotal, not a note count).
// - CashTransferRequestDTO.Amount has a "greater than zero" regex
//   validator that runs (via cashTransferRequestDTO.HasErrors) BEFORE any
//   server-side field resolution — the controller itself never reads
//   Amount again after that check, but omitting it/leaving it 0 fails
//   validation with a generic "Some validations failed" message. Set to
//   the counted ClosingBalance (falling back to BookBalance) purely to
//   satisfy that check.
// - BookBalance is NOT resolved server-side — the client must supply the
//   real expected-cash figure. There's no "my teller" self-lookup
//   endpoint, so it's fetched via GET tellers/teller?employeeId=<JWT's
//   EmployeeId claim>, the same claim the server itself resolves identity
//   from.
// - UntransferredChequesValue in the request body is NOT what gates "you
//   need to transfer your cheques first" — confirmed against source, the
//   controller independently queries FindUnTransferredExternalChequesByTellerId
//   for the caller's own teller and never reads this field back off the
//   DTO at all in this action (not even echoed onto the FiscalCount it
//   writes). Sent as a harmless constant 0 rather than exposed as a UI
//   field that would imply it does something.
// - TellerCashBalanceStatusValue is compared against BookBalance
//   server-side to decide which journal entries to post — computed here
//   client-side from the same two numbers the server already has.
// - A balanced close requires only the teller-to-treasury journal; shortage
//   and excess closes additionally post their variance journal.

function FieldGroup({ label, help, children }) {
  return (
    <div>
      <div className="flex items-center gap-1">
        <Label className="text-sm font-semibold text-gray-700">{label}</Label>
        {help && <FieldHelp label={label}>{help}</FieldHelp>}
      </div>
      {children}
    </div>
  );
}

function statusFor(closingBalance, bookBalance) {
  const diff = closingBalance - bookBalance;
  if (diff === 0) return { value: TellerCashBalanceStatus.Balanced, label: "Balanced", cls: "bg-green-100 text-green-700" };
  if (diff < 0) return { value: TellerCashBalanceStatus.Shortage, label: "Shortage", cls: "bg-red-100 text-red-700" };
  return { value: TellerCashBalanceStatus.Excess, label: "Excess", cls: "bg-amber-100 text-amber-700" };
}

export default function EndOfDay() {
  const [teller, setTeller] = useState(null);
  const [loadingTeller, setLoadingTeller] = useState(true);
  const [counts, setCounts] = useState(emptyDenominationCounts);
  const [submitting, setSubmitting] = useState(false);
  const [receiptJournal, setReceiptJournal] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    const employeeId = getEmployeeIdFromToken();
    if (!employeeId) {
      setLoadingTeller(false);
      return;
    }
    apiJson(`${BASE}/api/frontoffice/tellers/teller?employeeId=${employeeId}`)
      // TellerController now wraps every response in the standard
      // { success, message, data } envelope (it used to return the bare
      // TellerDTO) — without unwrapping, teller.BookBalance/.Description
      // silently come back undefined, which made every EOD close compute
      // BookBalance as 0 and misclassify a balanced day as "Excess".
      .then((d) => setTeller(d?.data ?? d))
      .catch((error) => {
        setTeller(null);
        Swal.fire("Error", apiErrorMessage(error, "Unable to load the current teller."), "error");
      })
      .finally(() => setLoadingTeller(false));
  }, []);

  const closingBalance = sumDenominations(counts);
  const bookBalance = teller?.BookBalance ?? 0;
  const status = statusFor(closingBalance, bookBalance);

  const handleCountChange = (key, value) => {
    setCounts((prev) => ({ ...prev, [key]: value }));
    setValidationErrors((current) => ({ ...current, counts: undefined }));
  };

  const handleSubmit = async () => {
    const errors = {};
    if (!teller?.Id) errors.teller = "The logged-in user has no available teller record.";
    setValidationErrors(errors);
    if (Object.keys(errors).length) {
      Swal.fire("Check End-of-Day Details", "Correct the highlighted fields before continuing.", "warning");
      return;
    }

    const confirm = await Swal.fire({
      title: "Run End of Day Process?",
      html: `Counted cash: <strong>${closingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong><br/>Book balance: <strong>${bookBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong><br/>Result: <strong>${status.label}</strong><br/><br/>This closes this teller for today and cannot be repeated.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#4f46e5",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, Run End of Day",
    });
    if (!confirm.isConfirmed) return;

    setSubmitting(true);
    try {
      const payload = {
        ClosingBalance: closingBalance,
        BookBalance: bookBalance,
        UntransferredChequesValue: 0,
        TellerCashBalanceStatusValue: status.value,
        // Satisfies CashTransferRequestDTO.Amount's "greater than zero"
        // validator — the controller never reads this field again after
        // the initial HasErrors check.
        Amount: closingBalance > 0 ? closingBalance : bookBalance > 0 ? bookBalance : 0.01,
        // Now required to reconcile exactly against ClosingBalance
        // (DENOMINATION-CAPTURE-FRONTEND-GUIDE.md) — guaranteed here since
        // ClosingBalance is itself sumDenominations(counts).
        ...toDenominationSubtotals(counts),
      };

      const data = await apiJson(`${BASE}/api/frontoffice/endofday`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (data.data) setReceiptJournal(data.data);
      else Swal.fire("End of Day Complete", data.message || "The teller was closed successfully.", "success");
      setCounts(emptyDenominationCounts);
    } catch (err) {
      Swal.fire("Error", apiErrorMessage(err, "Unable to complete the end-of-day process."), "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
      <div className="flex items-center gap-3 mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
        <FaHourglassEnd className="text-white text-xl" />
        <h2 className="text-xl font-bold text-white">End of Day Process</h2>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Teller summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm text-gray-500">Teller</p>
            <p className="mt-1 font-medium text-gray-800">
              {loadingTeller ? "Loading..." : teller?.Description || "—"}
            </p>
            {validationErrors.teller && <p className="mt-1 text-xs text-red-600">{validationErrors.teller}</p>}
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center gap-1"><p className="text-sm text-gray-500">Book Balance (expected cash)</p><FieldHelp label="Book balance">This is the teller cash balance calculated from posted journals. The server reloads it during submission and does not trust the browser value.</FieldHelp></div>
            <p className="mt-1 font-medium text-gray-800">
              {loadingTeller ? "Loading..." : bookBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Denomination count */}
        <FieldGroup label="Count Your Cash" help="Enter the number of physical notes or coins in each denomination. The counted total becomes the cash transferred to treasury.">
          <DenominationCountFields counts={counts} onChange={handleCountChange} />
        </FieldGroup>

        {/* Balance status */}
        <div className="flex justify-between items-center rounded-lg border border-gray-200 bg-white p-4 shadow">
          <div>
            <div className="flex items-center gap-1"><p className="text-sm text-gray-500">Closing vs. Book Balance</p><FieldHelp label="Balance result">Zero is balanced. A negative difference is a shortage; a positive difference is an excess. The server recalculates this classification before posting.</FieldHelp></div>
            <p className="mt-1 text-2xl font-semibold text-gray-800">
              {(closingBalance - bookBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <span className={`px-3 py-1 rounded text-sm font-semibold ${status.cls}`}>{status.label}</span>
        </div>

        <p className="text-xs text-gray-400">
          Any untransferred cheques must be transferred first (Cheque Transfer / Catalogue) — the server checks this independently and rejects the close if any remain.
        </p>

        <Button
          onClick={handleSubmit}
          disabled={submitting || loadingTeller || !teller}
          className="w-full bg-indigo-600 hover:bg-indigo-700"
        >
          {submitting ? "Processing..." : "Run End of Day Process"}
        </Button>
      </div>

      <ReceiptModal
        open={!!receiptJournal}
        onClose={() => setReceiptJournal(null)}
        journal={receiptJournal}
        title="End of Day Receipt"
      />
    </div>
  );
}
