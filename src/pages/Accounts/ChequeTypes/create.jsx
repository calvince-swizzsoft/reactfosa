import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { FaMoneyCheckAlt } from "react-icons/fa";
import Swal from "sweetalert2";
import { apiFetch, normalizeList } from "@/lib/api";
import PickerList from "../lib/PickerList";

// Areas/Accounts/Controllers/ChequeTypeController.cs — docs/api/cheque-type-api-spec.md §5.4.
// POST / requires both a commission and a loan/investment product attached
// in the SAME request (CreateChequeTypeRequest { ChequeType, Commissions,
// AttachedProducts }) — there's no session here the way the reference MVC
// controller had, so this form collects all three pieces at once rather
// than the old multi-step wizard. UpdateCommissions/UpdateAttachedProducts
// only ever read `.Id` off each selected item (confirmed against
// ChequeTypeAppService.cs directly), so only `{ Id }` is sent per selection.
const BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
const CHEQUE_TYPES_BASE = `${BASE}/api/accounts/chequetypes`;

const CHARGE_RECOVERY_MODE_OPTIONS = [
  { value: 0, label: "On Cheque Deposit" },
  { value: 1, label: "On Cheque Clearance" },
];

const emptyForm = { Description: "", MaturityPeriod: 0, ChargeRecoveryMode: 0, IsLocked: false };

function FieldGroup({ label, children }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

export default function CreateChequeType() {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [loadingPickers, setLoadingPickers] = useState(true);

  const [commissions, setCommissions] = useState([]);
  const [loanProducts, setLoanProducts] = useState([]);
  const [investmentProducts, setInvestmentProducts] = useState([]);

  const [selectedCommissionIds, setSelectedCommissionIds] = useState(new Set());
  const [selectedLoanProductIds, setSelectedLoanProductIds] = useState(new Set());
  const [selectedInvestmentProductIds, setSelectedInvestmentProductIds] = useState(new Set());

  useEffect(() => {
    setLoadingPickers(true);
    Promise.all([
      apiFetch(`${BASE}/api/accounts/commissions`).then((r) => r.json()),
      apiFetch(`${BASE}/api/accounts/loanproducts`).then((r) => r.json()),
      apiFetch(`${BASE}/api/accounts/investmentsproducts`).then((r) => r.json()),
    ]).then(([commissionData, loanData, investmentData]) => {
      setCommissions(normalizeList(commissionData));
      setLoanProducts(normalizeList(loanData));
      setInvestmentProducts(normalizeList(investmentData));
    }).catch(() => { }).finally(() => setLoadingPickers(false));
  }, []);

  const toggleSet = (setter) => (id) => setter((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.Description.trim()) {
      Swal.fire("Missing Field", "Description is required.", "warning");
      return;
    }
    if (selectedCommissionIds.size === 0) {
      Swal.fire("Missing Selection", "Select at least one commission.", "warning");
      return;
    }
    if (selectedLoanProductIds.size === 0 && selectedInvestmentProductIds.size === 0) {
      Swal.fire("Missing Selection", "Select at least one loan or investment product.", "warning");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ChequeType: form,
        Commissions: [...selectedCommissionIds].map((Id) => ({ Id })),
        AttachedProducts: {
          LoanProductCollection: [...selectedLoanProductIds].map((Id) => ({ Id })),
          InvestmentProductCollection: [...selectedInvestmentProductIds].map((Id) => ({ Id })),
        },
      };

      const res = await apiFetch(CHEQUE_TYPES_BASE, { method: "POST", body: JSON.stringify(payload) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) throw new Error(data.message || "Failed to create cheque type");

      Swal.fire("Success", data.message || "Cheque type created successfully", "success");
      setForm(emptyForm);
      setSelectedCommissionIds(new Set());
      setSelectedLoanProductIds(new Set());
      setSelectedInvestmentProductIds(new Set());
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
      <div className="flex items-center justify-between gap-3 mb-6 bg-indigo-700 px-6 py-3 rounded-2xl">
        <div className="flex items-center gap-3">
          <FaMoneyCheckAlt className="text-white text-xl" />
          <h2 className="text-xl font-bold text-white">Create Cheque Type</h2>
        </div>
        <Link to="/Accounts/ChequeTypes" className="text-sm text-white/80 hover:text-white">
          &larr; Back to Cheque Types
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
        <FieldGroup label="Description">
          <Input
            value={form.Description}
            onChange={(e) => setForm((p) => ({ ...p, Description: e.target.value }))}
            required
            placeholder="e.g. Standard Cheque"
          />
        </FieldGroup>

        <FieldGroup label="Maturity Period (days)">
          <Input
            type="number"
            min="0"
            value={form.MaturityPeriod}
            onChange={(e) => setForm((p) => ({ ...p, MaturityPeriod: Number(e.target.value) }))}
            placeholder="e.g. 3"
          />
        </FieldGroup>

        <FieldGroup label="Charge Recovery Mode">
          <Select value={String(form.ChargeRecoveryMode)} onValueChange={(v) => setForm((p) => ({ ...p, ChargeRecoveryMode: Number(v) }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CHARGE_RECOVERY_MODE_OPTIONS.map((o) => <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </FieldGroup>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="chequetype-locked"
            checked={form.IsLocked}
            onChange={(e) => setForm((p) => ({ ...p, IsLocked: e.target.checked }))}
            className="w-4 h-4 accent-indigo-600"
          />
          <Label htmlFor="chequetype-locked">Is Locked?</Label>
        </div>

        <FieldGroup label={`Commissions${selectedCommissionIds.size ? ` (${selectedCommissionIds.size} selected)` : ""} — at least one required`}>
          <PickerList
            items={commissions}
            selectedIds={selectedCommissionIds}
            onToggle={toggleSet(setSelectedCommissionIds)}
            getLabel={(c) => c.Description}
            getSublabel={(c) => c.ChargeTypeDescription}
            emptyText={loadingPickers ? "Loading commissions..." : "No commissions configured."}
          />
        </FieldGroup>

        <FieldGroup label={`Loan Products${selectedLoanProductIds.size ? ` (${selectedLoanProductIds.size} selected)` : ""}`}>
          <PickerList
            items={loanProducts}
            selectedIds={selectedLoanProductIds}
            onToggle={toggleSet(setSelectedLoanProductIds)}
            getLabel={(p) => p.Description}
            getSublabel={(p) => p.PaddedCode || p.Code}
            emptyText={loadingPickers ? "Loading loan products..." : "No loan products configured."}
          />
        </FieldGroup>

        <FieldGroup label={`Investment Products${selectedInvestmentProductIds.size ? ` (${selectedInvestmentProductIds.size} selected)` : ""} — at least one loan or investment product required`}>
          <PickerList
            items={investmentProducts}
            selectedIds={selectedInvestmentProductIds}
            onToggle={toggleSet(setSelectedInvestmentProductIds)}
            getLabel={(p) => p.Description}
            emptyText={loadingPickers ? "Loading investment products..." : "No investment products configured."}
          />
        </FieldGroup>

        <Button type="submit" disabled={loading || loadingPickers} className="w-full bg-indigo-600 hover:bg-indigo-700">
          {loading ? "Creating..." : "Create Cheque Type"}
        </Button>
      </form>
    </div>
  );
}
