import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Swal from "sweetalert2";
import { FaFileSignature, FaChevronDown, FaPlus } from "react-icons/fa";
import { createLoanRequest } from "./api";
import CustomerPickerModal from "../LoanCases/lib/CustomerPickerModal";
import EntryPickerModal from "../../Accounts/BatchProcedures/lib/EntryPickerModal";
import QuickCreateModal from "../lib/QuickCreateModal";
import { createLoanPurpose } from "../lib/loanMastersApi";

const FIN_BASE = `${import.meta.env.VITE_APP_FIN_URL}`;

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

function PickerFieldWithCreate({ label, value, placeholder, onClick, onCreateNew }) {
  return (
    <div>
      <Label className="text-sm font-semibold text-gray-700 mb-1 block">{label}</Label>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onClick}
          className="flex-1 flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md bg-white text-sm hover:border-indigo-400 transition-colors text-left"
        >
          <span className={value ? "text-gray-800 truncate" : "text-gray-400"}>{value || placeholder}</span>
          <FaChevronDown className="text-gray-400 text-xs flex-shrink-0 ml-2" />
        </button>
        <Button type="button" variant="outline" size="icon" onClick={onCreateNew} title={`New ${label}`}>
          <FaPlus className="text-xs" />
        </Button>
      </div>
    </div>
  );
}

const emptyForm = {
  CustomerId: "", CustomerLabel: "",
  LoanProductId: "", LoanProductLabel: "",
  LoanPurposeId: "", LoanPurposeLabel: "",
  AmountApplied: "", ReceivedDate: new Date().toISOString().split("T")[0],
  Reference: "",
};

// api/backoffice/loanrequests — docs/api/loan-request-api-spec.md. Only 6
// fields are ever persisted by Create (confirmed against
// LoanRequestFactory.CreateLoanRequest): CustomerId, LoanProductId,
// LoanPurposeId, AmountApplied, ReceivedDate, Reference.
export default function CreateLoanRequest() {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [picker, setPicker] = useState(null);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.CustomerId || !form.LoanProductId || !form.LoanPurposeId || !(Number(form.AmountApplied) > 0)) {
      Swal.fire("Missing Fields", "Customer, loan product, loan purpose, and a positive amount applied are all required.", "warning");
      return;
    }
    setLoading(true);
    try {
      await createLoanRequest({
        CustomerId: form.CustomerId,
        LoanProductId: form.LoanProductId,
        LoanPurposeId: form.LoanPurposeId,
        AmountApplied: Number(form.AmountApplied),
        ReceivedDate: form.ReceivedDate,
        Reference: form.Reference,
      });
      Swal.fire("Success", "Loan request recorded.", "success");
      navigate("/Loaning/LoanRequests");
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
          <FaFileSignature /> New Loan Request
        </h2>
        <Button variant="outline" onClick={() => navigate("/Loaning/LoanRequests")}>Cancel</Button>
      </div>

      <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
        <PickerField label="Customer" value={form.CustomerLabel} placeholder="Search & select customer..." onClick={() => setPicker("customer")} />
        <PickerField label="Loan Product" value={form.LoanProductLabel} placeholder="Select loan product..." onClick={() => setPicker("loanProduct")} />
        <PickerFieldWithCreate label="Loan Purpose" value={form.LoanPurposeLabel} placeholder="Select loan purpose..." onClick={() => setPicker("loanPurpose")} onCreateNew={() => setCreating(true)} />

        <div className="grid grid-cols-2 gap-3">
          <FieldGroup label="Amount Applied">
            <Input type="number" min="0" value={form.AmountApplied} onChange={(e) => setForm((p) => ({ ...p, AmountApplied: e.target.value }))} required />
          </FieldGroup>
          <FieldGroup label="Received Date">
            <Input type="date" value={form.ReceivedDate} onChange={(e) => setForm((p) => ({ ...p, ReceivedDate: e.target.value }))} required />
          </FieldGroup>
        </div>

        <FieldGroup label="Reference">
          <Input value={form.Reference} onChange={(e) => setForm((p) => ({ ...p, Reference: e.target.value }))} />
        </FieldGroup>

        <Button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700">
          {loading ? "Saving..." : "Save Loan Request"}
        </Button>
      </form>

      {picker === "customer" && (
        <CustomerPickerModal
          title="Select Customer"
          onSelect={(c) => setForm((p) => ({ ...p, CustomerId: c.Id, CustomerLabel: c.FullName }))}
          onClose={() => setPicker(null)}
        />
      )}
      {picker === "loanProduct" && (
        <EntryPickerModal
          title="Select Loan Product"
          fetchUrl={`${FIN_BASE}/api/accounts/loanproducts`}
          getLabel={(i) => i.Description}
          onSelect={(i) => setForm((p) => ({ ...p, LoanProductId: i.Id, LoanProductLabel: i.Description }))}
          onClose={() => setPicker(null)}
        />
      )}
      {picker === "loanPurpose" && (
        <EntryPickerModal
          title="Select Loan Purpose"
          fetchUrl={`${FIN_BASE}/api/backoffice/loanpurposes`}
          getLabel={(i) => i.Description}
          onSelect={(i) => setForm((p) => ({ ...p, LoanPurposeId: i.Id, LoanPurposeLabel: i.Description }))}
          onClose={() => setPicker(null)}
        />
      )}
      {creating && (
        <QuickCreateModal
          title="New Loan Purpose"
          onCreate={createLoanPurpose}
          onCreated={(created) => setForm((p) => ({ ...p, LoanPurposeId: created.Id, LoanPurposeLabel: created.Description }))}
          onClose={() => setCreating(false)}
        />
      )}
    </div>
  );
}
