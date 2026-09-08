import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FaPencilAlt, FaPlus } from "react-icons/fa";
import Swal from "sweetalert2";
import GuarantorRow from "./GuarantorRow";
import { getRegistrationContext, lookupGuarantorEligibility, updateLoanCaseGuarantors } from "./loanCaseApi";
import { validateRegistrationGuarantors } from "./guarantorValidation";
import { guarantorDisplayName } from "./guarantorDisplayName";

export default function GuarantorEditor({ loanCase, guarantors, collaterals, onSaved }) {
  const [rows, setRows] = useState(null);
  const [product, setProduct] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const start = async () => {
    setBusy(true);
    try {
      const context = await getRegistrationContext(loanCase.CustomerId, loanCase.LoanProductId);
      if (!context.loanProduct) throw new Error("The loan product could not be loaded.");
      setProduct(context.loanProduct);
      const existing = guarantors.map((g) => ({
        clientId: crypto.randomUUID(), GuarantorId: g.CustomerId || g.GuarantorId,
        label: guarantorDisplayName(g), AmountGuaranteed: g.AmountGuaranteed, lookup: null,
      }));
      const lookups = await Promise.allSettled(existing.map((row) => lookupGuarantorEligibility(row.GuarantorId, loanCase.LoanProductId, loanCase.Id)));
      setRows(existing.map((row, index) => ({ ...row, lookup: lookups[index].status === "fulfilled" ? lookups[index].value : null })));
      setError(lookups.some((result) => result.status === "rejected") ? "Some existing guarantors could not be verified. Review or remove them before saving." : "");
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally { setBusy(false); }
  };

  const save = async () => {
    setBusy(true);
    setError("");
    try {
      // Recheck existing and newly selected members immediately before saving.
      const checked = await Promise.all(rows.map(async (row) => ({ ...row,
        lookup: row.GuarantorId ? await lookupGuarantorEligibility(row.GuarantorId, loanCase.LoanProductId, loanCase.Id) : null,
      })));
      setRows(checked);
      const validation = validateRegistrationGuarantors(product, loanCase.CustomerId, Number(loanCase.AmountApplied), checked,
        collaterals.reduce((sum, c) => sum + Number(c.Value || 0), 0));
      if (validation) { setError(validation); return; }
      await updateLoanCaseGuarantors(loanCase.Id, checked.map((row) => ({ GuarantorId: row.GuarantorId, AmountGuaranteed: Number(row.AmountGuaranteed) })));
      setRows(null);
      onSaved?.();
      Swal.fire("Success", "Guarantors updated.", "success");
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  return <section className="space-y-2">
    <div className="flex items-center justify-between">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Guarantors</p>
      {rows === null && <button type="button" disabled={busy} onClick={start} className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 disabled:opacity-50">
        <FaPencilAlt /> {busy ? "Loading..." : "Edit Guarantors"}
      </button>}
    </div>
    {rows === null ? (guarantors.length ? guarantors.map((g) => <div key={g.Id} className="flex justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm">
      <span className="truncate text-gray-700">{guarantorDisplayName(g)}</span>
      <span className="font-semibold text-gray-800">{Number(g.AmountGuaranteed).toLocaleString()}</span>
    </div>) : <p className="text-xs text-gray-400">No guarantors attached.</p>) : <>
      <fieldset disabled={busy} className="space-y-2">
        {rows.map((row, index) => <GuarantorRow key={row.clientId} row={row} index={index} loanProductId={loanCase.LoanProductId} loanCaseId={loanCase.Id}
          onChange={(id, change) => setRows((current) => current.map((item) => item.clientId === id ? { ...item, ...change } : item))}
          onRemove={(id) => setRows((current) => current.filter((item) => item.clientId !== id))} />)}
        <Button type="button" size="sm" variant="outline" onClick={() => setRows((current) => [...current, { clientId: crypto.randomUUID(), GuarantorId: "", AmountGuaranteed: "", label: "", lookup: null }])}>
          <FaPlus className="mr-1" /> Add Guarantor
        </Button>
      </fieldset>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <div className="sticky bottom-0 flex gap-2 border-t bg-white py-3">
        <Button type="button" size="sm" disabled={busy} onClick={save} className="bg-indigo-600 hover:bg-indigo-700">{busy ? "Saving..." : "Save Guarantors"}</Button>
        <Button type="button" size="sm" disabled={busy} variant="outline" onClick={() => setRows(null)}>Cancel</Button>
      </div>
    </>}
  </section>;
}
