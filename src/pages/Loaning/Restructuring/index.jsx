import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Swal from "sweetalert2";
import { FaSyncAlt, FaChevronDown } from "react-icons/fa";
import { restructureLoan } from "./api";
import EntryPickerModal from "../../Accounts/BatchProcedures/lib/EntryPickerModal";

const FIN_BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
const MODULE_NAVIGATION_ITEM_CODE = 70013;

function FieldGroup({ label, children }) {
  return (
    <div>
      <Label className="text-sm font-semibold text-gray-700">{label}</Label>
      {children}
    </div>
  );
}

function PickerField({ label, value, placeholder, onClick }) {
  return (
    <div>
      <Label className="text-sm font-semibold text-gray-700 mb-1 block">{label}</Label>
      <button
        type="button"
        onClick={onClick}
        className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md bg-white text-sm hover:border-indigo-400 transition-colors text-left"
      >
        <span className={value ? "text-gray-800 truncate" : "text-gray-400"}>{value || placeholder}</span>
        <FaChevronDown className="text-gray-400 text-xs flex-shrink-0 ml-2" />
      </button>
    </div>
  );
}

const emptyForm = {
  BranchId: "", BranchLabel: "",
  CustomerAccountId: "", CustomerAccountLabel: "",
  NPer: "", Pmt: "", Reference: "",
};

// api/backoffice/loanrestructuring — docs/api/loan-restructuring-api-spec.md.
// NavigationMenu code 70013 ("Restructuring"). Keyed by the loan's own
// CustomerAccountId, not a LoanCaseId. There's no endpoint that returns a
// trustworthy loan-account balance for this app (the customer-accounts list
// projection deliberately skips balance), so this doesn't try to preview
// eligibility client-side — the server's 409 message says why it failed.
export default function Restructuring() {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [picker, setPicker] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.BranchId || !form.CustomerAccountId || !(Number(form.NPer) > 0) || !(Number(form.Pmt) > 0) || !form.Reference) {
      Swal.fire("Missing Fields", "Branch, loan account, number of periods, payment note and reference are all required.", "warning");
      return;
    }
    setLoading(true);
    try {
      await restructureLoan({
        BranchId: form.BranchId,
        CustomerAccountId: form.CustomerAccountId,
        NPer: Number(form.NPer),
        Pmt: Number(form.Pmt),
        Reference: form.Reference,
        ModuleNavigationItemCode: MODULE_NAVIGATION_ITEM_CODE,
      });
      Swal.fire("Success", "Loan restructured — a new term has been applied and the repayment standing order updated.", "success");
      setForm(emptyForm);
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
      <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FaSyncAlt /> Loan Restructuring
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
        <p className="text-xs text-gray-400">
          Eligible only for a loan account with an outstanding principal balance and no outstanding interest — the server checks this, there's no reliable balance figure to preview here first.
        </p>

        <PickerField label="Branch" value={form.BranchLabel} placeholder="Select branch..." onClick={() => setPicker("branch")} />
        <PickerField label="Loan Account" value={form.CustomerAccountLabel} placeholder="Search & select the loan customer account..." onClick={() => setPicker("customerAccount")} />

        <FieldGroup label="New Number of Periods">
          <Input type="number" min="1" value={form.NPer} onChange={(e) => setForm((p) => ({ ...p, NPer: e.target.value }))} required />
        </FieldGroup>

        <FieldGroup label="Payment Note">
          <Input type="number" min="0" value={form.Pmt} onChange={(e) => setForm((p) => ({ ...p, Pmt: e.target.value }))} required />
          <p className="text-xs text-gray-400 mt-1">
            Required by the server (must be &gt; 0) but has no effect on the actual new payment — the real schedule is computed entirely from the number of periods above and the loan product's own terms. This value is only recorded as a reference note.
          </p>
        </FieldGroup>

        <FieldGroup label="Reference">
          <Input value={form.Reference} onChange={(e) => setForm((p) => ({ ...p, Reference: e.target.value }))} required />
        </FieldGroup>

        <Button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700">
          {loading ? "Restructuring..." : "Restructure Loan"}
        </Button>
      </form>

      {picker === "branch" && (
        <EntryPickerModal
          title="Select Branch"
          fetchUrl={`${FIN_BASE}/api/administration/branches/all`}
          getLabel={(i) => i.Description}
          onSelect={(i) => setForm((p) => ({ ...p, BranchId: i.Id, BranchLabel: i.Description }))}
          onClose={() => setPicker(null)}
        />
      )}
      {picker === "customerAccount" && (
        <EntryPickerModal
          title="Select Loan Account"
          fetchUrl={`${FIN_BASE}/api/accounts/customer-accounts?pageSize=1000`}
          getLabel={(i) => i.CustomerFullName || [i.CustomerIndividualFirstName, i.CustomerIndividualLastName].filter(Boolean).join(" ") || i.FullAccountNumber}
          getSublabel={(i) => [i.FullAccountNumber, i.CustomerAccountTypeTargetProductDescription].filter(Boolean).join(" — ")}
          onSelect={(i) => setForm((p) => ({ ...p, CustomerAccountId: i.Id, CustomerAccountLabel: `${i.CustomerFullName || i.FullAccountNumber} — ${i.CustomerAccountTypeTargetProductDescription || ""}` }))}
          onClose={() => setPicker(null)}
        />
      )}
    </div>
  );
}
