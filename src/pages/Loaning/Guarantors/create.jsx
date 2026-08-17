import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import Swal from "sweetalert2";
import { FaUserShield, FaChevronDown } from "react-icons/fa";
import { createLoanGuarantor } from "./api";
import { checkInProcess, lookupGuarantorEligibility, normalizeList } from "../LoanCases/lib/loanCaseApi";
import CustomerPickerModal from "../LoanCases/lib/CustomerPickerModal";

function FieldGroup({ label, children }) {
  return (
    <div>
      <Label className="text-sm font-semibold text-gray-700">{label}</Label>
      {children}
    </div>
  );
}

function PickerField({ label, value, placeholder, onClick, disabled }) {
  return (
    <div>
      <Label className="text-sm font-semibold text-gray-700 mb-1 block">{label}</Label>
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md bg-white text-sm hover:border-indigo-400 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className={value ? "text-gray-800 truncate" : "text-gray-400"}>{value || placeholder}</span>
        <FaChevronDown className="text-gray-400 text-xs flex-shrink-0 ml-2" />
      </button>
    </div>
  );
}

const emptyForm = {
  LoaneeCustomerId: "", LoaneeLabel: "",
  LoanCaseId: "", GuarantorCustomerId: "", GuarantorLabel: "",
  AmountGuaranteed: "", AmountPledged: "",
};

// api/backoffice/loanguarantors — docs/api/loan-guarantor-api-spec.md.
// Adds one more guarantor to an already-registered case (before
// appraisal) — a different flow from Registration's own inline guarantor
// rows, which only run at case-creation time.
export default function CreateLoanGuarantor() {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [cases, setCases] = useState([]);
  const [loadingCases, setLoadingCases] = useState(false);
  const [lookup, setLookup] = useState(null);
  const [loadingLookup, setLoadingLookup] = useState(false);
  const [picker, setPicker] = useState(null);
  const [loading, setLoading] = useState(false);

  const selectedCase = cases.find((c) => c.Id === form.LoanCaseId);

  const handlePickLoanee = async (customer) => {
    setForm((p) => ({ ...emptyForm, LoaneeCustomerId: customer.Id, LoaneeLabel: customer.FullName }));
    setLookup(null);
    setLoadingCases(true);
    try {
      const inProcess = await checkInProcess(customer.Id);
      setCases(normalizeList(inProcess) || inProcess || []);
    } catch (err) {
      Swal.fire("Error", err.message, "error");
      setCases([]);
    } finally {
      setLoadingCases(false);
    }
  };

  const handlePickGuarantor = async (customer) => {
    setForm((p) => ({ ...p, GuarantorCustomerId: customer.Id, GuarantorLabel: customer.FullName }));
    if (!selectedCase) return;
    setLoadingLookup(true);
    try {
      const result = await lookupGuarantorEligibility(customer.Id, selectedCase.LoanProductId);
      setLookup(result);
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setLoadingLookup(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.LoaneeCustomerId || !form.LoanCaseId || !form.GuarantorCustomerId || !lookup) {
      Swal.fire("Missing Fields", "Loanee, loan case, and a guarantor with resolved eligibility are all required.", "warning");
      return;
    }
    if (!(Number(form.AmountGuaranteed) > 0)) {
      Swal.fire("Missing Fields", "Amount guaranteed must be greater than zero.", "warning");
      return;
    }
    setLoading(true);
    try {
      const result = await createLoanGuarantor({
        CustomerId: form.GuarantorCustomerId,
        LoaneeCustomerId: form.LoaneeCustomerId,
        LoanProductId: selectedCase.LoanProductId,
        LoanCaseId: form.LoanCaseId,
        TotalShares: lookup.totalShares,
        CommittedShares: lookup.committedShares,
        AppraisalFactor: lookup.appraisalFactor,
        AmountGuaranteed: Number(form.AmountGuaranteed),
        AmountPledged: Number(form.AmountPledged) || 0,
      });
      // Duplicate-guarantor rejection comes back as success:true with
      // nothing persisted — ErrorMsgResult is set instead of a thrown error.
      if (result?.ErrorMsgResult) {
        Swal.fire("Not Attached", result.ErrorMsgResult, "warning");
        return;
      }
      Swal.fire("Success", "Guarantor attached to the loan case.", "success");
      navigate("/Loaning/Guarantors");
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
          <FaUserShield /> Attach Guarantor
        </h2>
        <Button variant="outline" onClick={() => navigate("/Loaning/Guarantors")}>Cancel</Button>
      </div>

      <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
        <PickerField label="Loanee" value={form.LoaneeLabel} placeholder="Search & select the loanee..." onClick={() => setPicker("loanee")} />

        <FieldGroup label="Loan Case">
          <Select
            value={form.LoanCaseId}
            onValueChange={(v) => { setForm((p) => ({ ...p, LoanCaseId: v, GuarantorCustomerId: "", GuarantorLabel: "" })); setLookup(null); }}
            disabled={!form.LoaneeCustomerId || loadingCases}
          >
            <SelectTrigger><SelectValue placeholder={loadingCases ? "Loading..." : cases.length === 0 && form.LoaneeCustomerId ? "No in-process cases for this customer" : "Select a case..."} /></SelectTrigger>
            <SelectContent>
              {cases.map((c) => <SelectItem key={c.Id} value={c.Id}>#{c.PaddedCaseNumber} — {c.LoanProductDescription} ({c.StatusDescription})</SelectItem>)}
            </SelectContent>
          </Select>
        </FieldGroup>

        <PickerField label="Guarantor" value={form.GuarantorLabel} placeholder="Search & select the guarantor..." onClick={() => setPicker("guarantor")} disabled={!form.LoanCaseId} />

        {loadingLookup && <p className="text-xs text-gray-400">Checking eligibility...</p>}
        {lookup && (
          <p className="text-xs text-gray-500 bg-gray-50 border rounded-lg px-3 py-2">
            Total shares: {lookup.totalShares?.toLocaleString()} · Committed: {lookup.committedShares?.toLocaleString()} ·
            Available to guarantee: <span className="font-semibold text-gray-700">{lookup.availableToGuarantee?.toLocaleString()}</span>
          </p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <FieldGroup label="Amount Guaranteed">
            <Input type="number" min="0" value={form.AmountGuaranteed} onChange={(e) => setForm((p) => ({ ...p, AmountGuaranteed: e.target.value }))} required />
          </FieldGroup>
          <FieldGroup label="Amount Pledged">
            <Input type="number" min="0" value={form.AmountPledged} onChange={(e) => setForm((p) => ({ ...p, AmountPledged: e.target.value }))} />
          </FieldGroup>
        </div>

        <Button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700">
          {loading ? "Attaching..." : "Attach Guarantor"}
        </Button>
      </form>

      {picker === "loanee" && (
        <CustomerPickerModal title="Select Loanee" onSelect={handlePickLoanee} onClose={() => setPicker(null)} />
      )}
      {picker === "guarantor" && (
        <CustomerPickerModal title="Select Guarantor" onSelect={handlePickGuarantor} onClose={() => setPicker(null)} />
      )}
    </div>
  );
}
