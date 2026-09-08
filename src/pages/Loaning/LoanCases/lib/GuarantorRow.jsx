import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FaChevronDown, FaTrash } from "react-icons/fa";
import Swal from "sweetalert2";
import CustomerLookupModal from "../../../Registry/Customers/Documents/CustomerLookupModal";
import { lookupGuarantorEligibility } from "./loanCaseApi";

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

export default function GuarantorRow({ row, index, loanProductId, loanCaseId, onChange, onRemove }) {
  const [picker, setPicker] = useState(false);
  const [loadingLookup, setLoadingLookup] = useState(false);
  const lookupRequest = useRef(0);
  useEffect(() => () => { lookupRequest.current += 1; }, [loanProductId, loanCaseId]);

  const handlePick = async (customer) => {
    const requestId = ++lookupRequest.current;
    setPicker(false);
    const label = customer.FullName || [customer.IndividualFirstName, customer.IndividualLastName].filter(Boolean).join(" ") || customer.NonIndividualDescription || customer.Id;
    onChange(row.clientId, { GuarantorId: customer.Id, label, customer, lookup: null });
    setLoadingLookup(true);
    try {
      const lookup = await lookupGuarantorEligibility(customer.Id, loanProductId, loanCaseId);
      if (requestId === lookupRequest.current) onChange(row.clientId, { lookup });
    } catch (err) {
      if (requestId === lookupRequest.current) Swal.fire("Error", err.message, "error");
    } finally {
      if (requestId === lookupRequest.current) setLoadingLookup(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border p-3 space-y-2">
      <div className="flex items-center justify-between">
        <PickerField label={`Guarantor ${index + 1}`} value={row.label} placeholder="Pick a customer..." onClick={() => setPicker(true)} />
        <button type="button" aria-label={`Remove guarantor ${index + 1}`} onClick={() => onRemove(row.clientId)} className="text-red-400 hover:text-red-600 ml-2 mt-6">
          <FaTrash className="text-xs" />
        </button>
      </div>
      {loadingLookup && <p className="text-xs text-gray-400">Checking eligibility...</p>}
      {row.lookup && (
        <div className="grid grid-cols-2 gap-2 rounded-lg bg-gray-50 p-2 text-xs md:grid-cols-4">
          <div><span className="block text-gray-400">Identification</span><strong className="text-gray-700">{row.lookup.identificationNumber || row.customer?.IdentificationNumber || row.customer?.IndividualIdentificationNumber || "—"}</strong></div>
          {Number(row.lookup.securityMode) === 1 && <>
          <div><span className="block text-gray-400">Appraisal factor</span><strong className="text-gray-700">{row.lookup.appraisalFactor ?? 0}</strong></div>
          <div><span className="block text-gray-400">Total shares</span><strong className="text-gray-700">{Number(row.lookup.totalShares || 0).toLocaleString()}</strong></div>
          <div><span className="block text-gray-400">Committed shares</span><strong className="text-gray-700">{Number(row.lookup.committedShares || 0).toLocaleString()}</strong></div>
          <div><span className="block text-gray-400">Available</span><strong className="text-gray-700">{Number(row.lookup.availableToGuarantee || 0).toLocaleString()}</strong></div>
          </>}
          {Number(row.lookup.securityMode) === 0 && <p className="col-span-2 text-gray-600">Income-based guarantee: income assessment is completed during appraisal.</p>}
        </div>
      )}
      <FieldGroup label="Amount Guaranteed">
        <Input type="number" min="0.01" step="0.01" value={row.AmountGuaranteed} onChange={(e) => onChange(row.clientId, { AmountGuaranteed: e.target.value })} />
      </FieldGroup>
      {picker && createPortal(<CustomerLookupModal onSelect={handlePick} onClose={() => setPicker(false)} />, document.body)}
    </div>
  );
}

