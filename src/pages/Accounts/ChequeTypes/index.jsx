import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import NotFoundImage from "/assets/scopefinding.png";
import {
  FaEdit, FaPlus, FaChevronLeft, FaChevronRight, FaMoneyCheckAlt,
} from "react-icons/fa";
import { apiFetch, normalizeList } from "@/lib/api";
import PickerList from "../lib/PickerList";
import FieldHelp from "../SavingsProducts/FieldHelp";

// Areas/Accounts/Controllers/ChequeTypeController.cs — docs/api/cheque-type-api-spec.md
const BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
const CHEQUE_TYPES_BASE = `${BASE}/api/accounts/chequetypes`;

// ChequeTypeChargeRecoveryMode — transcribed from the DTO source, not guessed.
const CHARGE_RECOVERY_MODE_OPTIONS = [
  { value: 0, label: "On Cheque Deposit" },
  { value: 1, label: "On Cheque Clearance" },
];

function FieldGroup({ label, help, children }) {
  return (
    <div>
      <div className="flex items-center gap-1">
        <Label className="text-sm font-semibold text-gray-700">{label}</Label>
        <FieldHelp label={label}>{help}</FieldHelp>
      </div>
      {children}
    </div>
  );
}

// Covers the cheque type's own fields (PUT /{id}, §5.5) plus re-selecting
// its commissions and attached products (PUT /{id}/commissions,
// PUT /{id}/attached-products — §5.6/§5.7). Both of those are full-replace
// endpoints server-side (ChequeTypeAppService.UpdateCommissions/
// UpdateAttachedProducts delete every existing link for this cheque type
// first, then re-add exactly what's sent) — so this always submits the
// complete current selection, not a diff.
function EditChequeTypeDrawer({ open, onClose, onSuccess, item }) {
  const [form, setForm] = useState({ Description: "", MaturityPeriod: 0, ChargeRecoveryMode: 0, IsLocked: false });
  const [loading, setLoading] = useState(false);
  const [loadingPickers, setLoadingPickers] = useState(false);

  const [commissions, setCommissions] = useState([]);
  const [loanProducts, setLoanProducts] = useState([]);
  const [investmentProducts, setInvestmentProducts] = useState([]);

  const [selectedCommissionIds, setSelectedCommissionIds] = useState(new Set());
  const [selectedLoanProductIds, setSelectedLoanProductIds] = useState(new Set());
  const [selectedInvestmentProductIds, setSelectedInvestmentProductIds] = useState(new Set());

  useEffect(() => {
    if (!open || !item) return;

    setForm({
      Description: item.Description || "",
      MaturityPeriod: item.MaturityPeriod ?? 0,
      ChargeRecoveryMode: item.ChargeRecoveryMode ?? 0,
      IsLocked: !!item.IsLocked,
    });

    setLoadingPickers(true);
    Promise.all([
      apiFetch(`${BASE}/api/accounts/commissions`).then((r) => r.json()),
      apiFetch(`${BASE}/api/accounts/loanproducts`).then((r) => r.json()),
      apiFetch(`${BASE}/api/accounts/investmentsproducts`).then((r) => r.json()),
      apiFetch(`${CHEQUE_TYPES_BASE}/${item.Id}/commissions`).then((r) => r.json()),
      apiFetch(`${CHEQUE_TYPES_BASE}/${item.Id}/attached-products`).then((r) => r.json()),
    ]).then(([commissionData, loanData, investmentData, currentCommissions, currentProducts]) => {
      setCommissions(normalizeList(commissionData));
      setLoanProducts(normalizeList(loanData));
      setInvestmentProducts(normalizeList(investmentData));

      setSelectedCommissionIds(new Set(normalizeList(currentCommissions).map((c) => c.Id)));

      const products = currentProducts?.data ?? currentProducts?.Data ?? {};
      const currentLoanIds = (products?.LoanProductCollection ?? products?.loanProductCollection ?? []).map((p) => p.Id);
      const currentInvestmentIds = (products?.InvestmentProductCollection ?? products?.investmentProductCollection ?? []).map((p) => p.Id);
      setSelectedLoanProductIds(new Set(currentLoanIds));
      setSelectedInvestmentProductIds(new Set(currentInvestmentIds));
    }).catch(() => { }).finally(() => setLoadingPickers(false));
  }, [open, item]);

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
      const [chequeTypeRes, commissionsRes, productsRes] = await Promise.all([
        apiFetch(`${CHEQUE_TYPES_BASE}/${item.Id}`, {
          method: "PUT",
          body: JSON.stringify({ ...form, Id: item.Id }),
        }),
        apiFetch(`${CHEQUE_TYPES_BASE}/${item.Id}/commissions`, {
          method: "PUT",
          body: JSON.stringify([...selectedCommissionIds].map((Id) => ({ Id }))),
        }),
        apiFetch(`${CHEQUE_TYPES_BASE}/${item.Id}/attached-products`, {
          method: "PUT",
          body: JSON.stringify({
            LoanProductCollection: [...selectedLoanProductIds].map((Id) => ({ Id })),
            InvestmentProductCollection: [...selectedInvestmentProductIds].map((Id) => ({ Id })),
          }),
        }),
      ]);

      const [chequeTypeData, commissionsData, productsData] = await Promise.all(
        [chequeTypeRes, commissionsRes, productsRes].map((r) => r.json().catch(() => ({})))
      );

      if (!chequeTypeRes.ok || chequeTypeData.success === false) throw new Error(chequeTypeData.message || "Failed to update cheque type");
      if (!commissionsRes.ok || commissionsData.success === false) throw new Error(commissionsData.message || "Failed to update commissions");
      if (!productsRes.ok || productsData.success === false) throw new Error(productsData.message || "Failed to update attached products");

      Swal.fire("Success", "Cheque type updated successfully", "success");
      onSuccess();
      onClose();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 bg-black z-40" initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div className="fixed top-5 right-3 w-[460px] bg-white shadow-xl z-50 flex flex-col rounded-2xl p-3 max-h-[95vh]" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
            <div className="p-4 flex justify-between items-center bg-indigo-600 rounded-2xl m-2 shrink-0">
              <h2 className="font-bold text-lg text-white">Edit Cheque Type</h2>
              <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
            </div>
            {/* Same tall-drawer pattern as SavingsReceiptsPayments' Cheque
                Deposit form: scrolling body + a footer that always stays
                put, so Save Changes never scrolls out of view. */}
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
            <div className="p-4 space-y-4 overflow-y-auto flex-1 min-h-0">
              <FieldGroup label="Description" help="The teller-facing name used to identify this cheque category during deposit, banking, and clearance.">
                <Input value={form.Description} onChange={(e) => setForm((p) => ({ ...p, Description: e.target.value }))} required placeholder="e.g. Standard Cheque" />
              </FieldGroup>

              <FieldGroup label="Maturity Period (days)" help="The number of calendar days added to the deposit date to calculate the cheque's expected maturity date. Enter 0 for same-day maturity.">
                <Input type="number" min="0" value={form.MaturityPeriod} onChange={(e) => setForm((p) => ({ ...p, MaturityPeriod: Number(e.target.value) }))} placeholder="e.g. 3" />
              </FieldGroup>

              <FieldGroup label="Charge Recovery Mode" help="Controls when the selected commissions are recovered: immediately when the cheque is deposited, or later when it is successfully cleared.">
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
                <FieldHelp label="Is Locked">Administrative status flag for this cheque type. The current cheque-deposit pipeline does not yet enforce this flag, so locking alone does not prevent teller selection.</FieldHelp>
              </div>

              <FieldGroup label={`Commissions${selectedCommissionIds.size ? ` (${selectedCommissionIds.size} selected)` : ""} — at least one required`} help="Charges associated with this cheque type. Recovery timing is determined by the Charge Recovery Mode above.">
                <PickerList
                  items={commissions}
                  selectedIds={selectedCommissionIds}
                  onToggle={toggleSet(setSelectedCommissionIds)}
                  getLabel={(c) => c.Description}
                  getSublabel={(c) => c.ChargeTypeDescription}
                  emptyText={loadingPickers ? "Loading commissions..." : "No commissions configured."}
                />
              </FieldGroup>

              <FieldGroup label={`Loan Products${selectedLoanProductIds.size ? ` (${selectedLoanProductIds.size} selected)` : ""}`} help="Loan products whose dues may be recovered from cheque proceeds when this cheque type is cleared, according to the institution's recovery priority.">
                <PickerList
                  items={loanProducts}
                  selectedIds={selectedLoanProductIds}
                  onToggle={toggleSet(setSelectedLoanProductIds)}
                  getLabel={(p) => p.Description}
                  getSublabel={(p) => p.PaddedCode || p.Code}
                  emptyText={loadingPickers ? "Loading loan products..." : "No loan products configured."}
                />
              </FieldGroup>

              <FieldGroup label={`Investment Products${selectedInvestmentProductIds.size ? ` (${selectedInvestmentProductIds.size} selected)` : ""} — at least one loan or investment product required`} help="Investment products that may receive recoveries from cheque proceeds at clearance. At least one loan or investment product must be attached.">
                <PickerList
                  items={investmentProducts}
                  selectedIds={selectedInvestmentProductIds}
                  onToggle={toggleSet(setSelectedInvestmentProductIds)}
                  getLabel={(p) => p.Description}
                  emptyText={loadingPickers ? "Loading investment products..." : "No investment products configured."}
                />
              </FieldGroup>
            </div>

            <div className="p-4 pt-3 border-t shrink-0">
              <Button type="submit" disabled={loading || loadingPickers} className="w-full bg-indigo-600 hover:bg-indigo-700">
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default function ChequeTypes() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editItem, setEditItem] = useState(null);
  const [search, setSearch] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize] = useState(20);
  const [itemsCount, setItemsCount] = useState(0);

  const fetchItems = () => {
    setLoading(true);
    // GET / (§5.1) — omitting `text` returns the plain paged listing.
    const params = new URLSearchParams({ pageIndex: String(pageIndex), pageSize: String(pageSize) });
    if (search.trim()) params.set("text", search.trim());
    apiFetch(`${CHEQUE_TYPES_BASE}?${params.toString()}`)
      .then((r) => r.json())
      .then((body) => {
        const page = body?.data ?? body;
        setItems(page?.pageCollection || page?.PageCollection || normalizeList(body));
        setItemsCount(page?.itemsCount || page?.ItemsCount || 0);
      })
      .catch(() => { setItems([]); setItemsCount(0); })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, pageIndex]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPageIndex(0);
  };

  const hasNextPage = itemsCount ? (pageIndex + 1) * pageSize < itemsCount : items.length === pageSize;

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
      <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FaMoneyCheckAlt /> Cheque Types
        </h2>
        <Link
          to="/Accounts/ChequeTypes/create"
          className="inline-flex items-center gap-2 rounded-md bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-sm font-medium text-white"
        >
          <FaPlus /> Add Cheque Type
        </Link>
      </div>

      <div className="flex flex-wrap justify-between items-center mb-4 gap-3">
        <Input
          value={search}
          onChange={handleSearchChange}
          placeholder="Search by description..."
          className="max-w-xs"
        />
      </div>

      <div className="bg-gray-200 p-4 rounded-sm">
        <div className="grid grid-cols-12 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4">
          <span className="col-span-4">Description</span>
          <span className="col-span-2">Maturity Period</span>
          <span className="col-span-3">Charge Recovery Mode</span>
          <span className="col-span-1">Status</span>
          <span className="col-span-2 text-right">Actions</span>
        </div>

        {loading ? (
          <div className="space-y-2 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="grid grid-cols-12 gap-2 bg-gray-50 p-6 rounded">
                {Array.from({ length: 12 }).map((_, j) => (
                  <div key={j} className="h-4 bg-gray-200 rounded"></div>
                ))}
              </div>
            ))}
          </div>
        ) : items.length > 0 ? (
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.Id} className="bg-white rounded-lg shadow-lg border">
                <div className="grid grid-cols-12 gap-2 items-center py-4 px-6 hover:shadow-xl transition-all">
                  <span className="col-span-4 font-medium text-indigo-700">{item.Description}</span>
                  <span className="col-span-2 text-sm text-gray-700">{item.MaturityPeriod} {item.MaturityPeriod === 1 ? "day" : "days"}</span>
                  <span className="col-span-3 text-sm text-gray-700">{item.ChargeRecoveryModeDescription || "—"}</span>
                  <span className="col-span-1">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${item.IsLocked ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}>
                      {item.IsLocked ? "Locked" : "Active"}
                    </span>
                  </span>
                  <div className="col-span-2 flex justify-end">
                    <Button size="sm" variant="outline" onClick={() => setEditItem(item)} className="flex items-center gap-1">
                      <FaEdit className="text-indigo-600" /> Edit
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-center mt-4">
            <img src={NotFoundImage} alt="Not Found" className="mx-auto w-42" />
            <p className="font-medium text-gray-400">No cheque types found.</p>
          </div>
        )}

        <div className="flex justify-center items-center mt-4">
          <Button type="button" size="sm" disabled={pageIndex === 0} onClick={() => setPageIndex((p) => Math.max(0, p - 1))} className="flex items-center gap-1 m-2">
            <FaChevronLeft /> Prev
          </Button>
          <span>Page {pageIndex + 1}</span>
          <Button type="button" size="sm" disabled={!hasNextPage} onClick={() => setPageIndex((p) => p + 1)} className="flex items-center gap-1 m-2">
            Next <FaChevronRight />
          </Button>
        </div>
      </div>

      <EditChequeTypeDrawer open={!!editItem} onClose={() => setEditItem(null)} onSuccess={fetchItems} item={editItem} />
    </div>
  );
}
