import { apiJson } from "@/lib/api";
import GuarantorEditor from "./GuarantorEditor";
import { guarantorDisplayName } from "./guarantorDisplayName";
import { LoanCaseStatus } from "./loanCaseEnums";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import Swal from "sweetalert2";
import { FaPencilAlt } from "react-icons/fa";
import LoanCaseStatusBadge from "./LoanCaseStatusBadge";
import { updateLoanCaseCollaterals } from "./loanCaseApi";
import EntryPickerModal from "../../../Accounts/BatchProcedures/lib/EntryPickerModal";

const FIN_BASE = `${import.meta.env.VITE_APP_FIN_URL}`;

// Shared read-only case header, reused across every stage's detail/action
// drawer so the case context isn't reimplemented per screen. Expects the
// shape GET /{id} returns: { loanCase, guarantors, collaterals }.
// Collateral editing is opt-in via `editableCollaterals` — every existing
// consumer keeps its current read-only behavior unless it passes that prop
// (and `onCollateralsSaved`) explicitly.
export default function LoanCaseSummary({ loanCase, guarantors = [], collaterals = [], editableCollaterals = false, onCollateralsSaved, editableGuarantors = false, onGuarantorsSaved }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(null);
  const [picker, setPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [releasedId, setReleasedId] = useState(null);

  if (!loanCase) return null;

  const startEditing = () => {
    setDraft(collaterals.map((c) => ({ Id: c.Id, CustomerDocumentFileTitle: c.CustomerDocumentFileTitle, Value: c.Value })));
    setEditing(true);
  };

  const removeDraftItem = (id) => setDraft((p) => p.filter((c) => c.Id !== id));
  const addDraftItem = (doc) => {
    if (draft.some((c) => c.Id === doc.Id)) return;
    setDraft((p) => [...p, { Id: doc.Id, CustomerDocumentFileTitle: doc.FileTitle, Value: doc.CollateralValue }]);
  };

  const saveCollaterals = async () => {
    if (draft.length === 0) {
      const confirm = await Swal.fire({
        title: "Remove all collateral?",
        text: "Saving with an empty list clears every collateral document already attached to this case — this is a full replace, not a delta.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#dc2626",
        confirmButtonText: "Clear Collateral",
      });
      if (!confirm.isConfirmed) return;
    }
    setSaving(true);
    try {
      await updateLoanCaseCollaterals(loanCase.Id, draft.map((c) => c.Id));
      Swal.fire("Success", "Collateral updated.", "success");
      setEditing(false);
      onCollateralsSaved?.();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div><span className="text-gray-400">Case No</span><p className="font-semibold text-gray-800">{loanCase.PaddedCaseNumber}</p></div>
        <div><span className="text-gray-400">Status</span><p><LoanCaseStatusBadge status={loanCase.Status} /></p></div>
        <div><span className="text-gray-400">Customer</span><p className="font-semibold text-gray-800 truncate">{loanCase.CustomerFullName}</p></div>
        <div><span className="text-gray-400">Loan Product</span><p className="font-semibold text-gray-800 truncate">{loanCase.LoanProductDescription}</p></div>
        <div><span className="text-gray-400">Amount Applied</span><p className="font-semibold text-indigo-600">{loanCase.AmountApplied?.toLocaleString()}</p></div>
        <div><span className="text-gray-400">Received Date</span><p className="font-semibold text-gray-800">{loanCase.ReceivedDate ? new Date(loanCase.ReceivedDate).toLocaleDateString() : "—"}</p></div>
        {loanCase.DisbursedDate && <div><span className="text-gray-400">Effective disbursement date</span><p className="font-semibold text-gray-800">{loanCase.DisbursedDate.slice(0, 10)}</p></div>}
        {loanCase.DisbursementProcessedDate && <div><span className="text-gray-400">Disbursement processed</span><p className="font-semibold text-gray-800">{new Date(loanCase.DisbursementProcessedDate).toLocaleString()}</p></div>}
      </div>

      {Number(loanCase.DepositSecurityAmount) > 0 && releasedId !== loanCase.Id && <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700">Guarantors waived: KES {Number(loanCase.DepositSecurityAmount).toLocaleString()} reserved from the borrower's BOSA deposits.
        {[LoanCaseStatus.Disbursed, LoanCaseStatus.Rejected].includes(Number(loanCase.Status)) && <Button type="button" disabled={saving} className="ml-2" onClick={async () => {
          const confirmation = await Swal.fire({title:"Release deposit security?",text:"Release requires BOSA loan approval permission and a fully repaid loan account, or a rejected application.",showCancelButton:true,confirmButtonText:"Check and release"});
          if(!confirmation.isConfirmed)return;
          setSaving(true);
          try { await apiJson(`${FIN_BASE}/api/backoffice/loancases/${loanCase.Id}/deposit-security/release`,{method:"POST"});setReleasedId(loanCase.Id);await Swal.fire("Released","Deposit security has been released.","success"); }
          catch(error){await Swal.fire("Cannot release",error.message,"error");}finally{setSaving(false);}
        }}>Release security</Button>}
      </p>}
      {editableGuarantors && !loanCase.DepositSecurityAccountId && Number(loanCase.Status) === LoanCaseStatus.Registered ? (
        <GuarantorEditor loanCase={loanCase} guarantors={guarantors} collaterals={collaterals} onSaved={onGuarantorsSaved} />
      ) : guarantors.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Guarantors</p>
          <div className="space-y-1.5">
            {guarantors.map((g) => (
              <div key={g.Id || g.GuarantorId} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-sm">
                <span className="text-gray-700 truncate">{guarantorDisplayName(g)}</span>
                <span className="font-semibold text-gray-800">{g.AmountGuaranteed?.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {(collaterals.length > 0 || editableCollaterals) && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Collateral</p>
            {editableCollaterals && !editing && (
              <button type="button" onClick={startEditing} className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                <FaPencilAlt className="text-[10px]" /> Edit
              </button>
            )}
          </div>

          {editing ? (
            <div className="space-y-2">
              {draft.length > 0 ? (
                <div className="space-y-1.5">
                  {draft.map((c) => (
                    <div key={c.Id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-sm">
                      <span className="text-gray-700 truncate">{c.CustomerDocumentFileTitle}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-800">{c.Value?.toLocaleString()}</span>
                        <button type="button" onClick={() => removeDraftItem(c.Id)} className="text-red-400 hover:text-red-600 text-xs">Remove</button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400">No collateral attached.</p>
              )}
              <div className="flex gap-2">
                <Button type="button" size="sm" variant="outline" onClick={() => setPicker(true)}>Add Document</Button>
                <Button type="button" size="sm" onClick={saveCollaterals} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
                  {saving ? "Saving..." : "Save"}
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
              </div>
            </div>
          ) : collaterals.length > 0 ? (
            <div className="space-y-1.5">
              {collaterals.map((c) => (
                <div key={c.Id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-sm">
                  <span className="text-gray-700 truncate">{c.CustomerDocumentFileTitle}</span>
                  <span className="font-semibold text-gray-800">{c.Value?.toLocaleString()}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400">No collateral attached.</p>
          )}
        </div>
      )}

      {picker && (
        <EntryPickerModal
          title="Select Collateral Document"
          fetchUrl={`${FIN_BASE}/api/registry/customerdocuments?customerId=${loanCase.CustomerId}&type=1`}
          getLabel={(i) => i.FileTitle}
          getSublabel={(i) => i.CollateralValue?.toLocaleString()}
          onSelect={addDraftItem}
          onClose={() => setPicker(false)}
        />
      )}
    </div>
  );
}
