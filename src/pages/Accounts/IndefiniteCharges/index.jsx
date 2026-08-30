import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FaEdit, FaPlus, FaRandom } from "react-icons/fa";
import Swal from "sweetalert2";
import { apiErrorMessage, apiJson, normalizeList } from "@/lib/api";
import FieldHelp from "../SavingsProducts/FieldHelp";
import PickerList from "../lib/PickerList";

const BASE = `${import.meta.env.VITE_APP_FIN_URL}/api/accounts`;
const ENDPOINT = `${BASE}/indefinite-charges`;
const UPFRONT = 0x500;
const LOAN_ACCOUNT = 0x600;

const emptyForm = { Description: "", RecoveryMode: UPFRONT, RecoverySource: LOAN_ACCOUNT, InstallmentsBasisValue: 0, Installments: 0, FactorInLoanTerm: false, ComputeChargeOnTopUp: false, IsLocked: false };

function FieldGroup({ label, help, children }) {
  return <div><div className="mb-1 flex items-center gap-1"><Label className="text-sm font-semibold text-gray-700">{label}</Label><FieldHelp label={label}>{help}</FieldHelp></div>{children}</div>;
}

function ConfigurationDrawer({ open, item, onClose, onSaved, commissions, options, loadingLookups }) {
  const [form, setForm] = useState(emptyForm);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [loadingItem, setLoadingItem] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (!item) {
      setForm(emptyForm);
      setSelectedIds(new Set());
      return;
    }
    setLoadingItem(true);
    apiJson(`${ENDPOINT}/${item.Id}`).then((response) => {
      const data = response?.data ?? response;
      setForm({ ...emptyForm, ...(data?.DynamicCharge || item) });
      const availableIds = new Set(commissions.map((commission) => commission.Id));
      setSelectedIds(new Set((data?.CommissionIds || []).filter((id) => availableIds.has(id))));
    }).catch((error) => Swal.fire("Load Error", apiErrorMessage(error, "Unable to load the indefinite charge."), "error"))
      .finally(() => setLoadingItem(false));
  }, [open, item, commissions]);

  const toggleCommission = (id) => setSelectedIds((current) => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const submit = async (event) => {
    event.preventDefault();
    if (!form.Description.trim()) {
      Swal.fire("Name Required", "Enter a name for the indefinite charge.", "warning");
      return;
    }
    if (!options.RecoveryModes.some((option) => option.Value === form.RecoveryMode) || !options.RecoverySources.some((option) => option.Value === form.RecoverySource)) {
      Swal.fire("Invalid Recovery Configuration", "Select a supported recovery mode and source.", "warning");
      return;
    }
    if (form.RecoverySource === LOAN_ACCOUNT && form.RecoveryMode !== UPFRONT) {
      Swal.fire("Unsupported Recovery Combination", "Loan Account recovery is supported only for Upfront charges. Select Savings Account for Periodic or Carry Forward recovery.", "warning");
      return;
    }
    if (selectedIds.size === 0) {
      Swal.fire("Applicable Charge Required", "Select at least one applicable charge.", "warning");
      return;
    }
    setLoading(true);
    try {
      const response = await apiJson(item ? `${ENDPOINT}/${item.Id}` : ENDPOINT, {
        method: item ? "PUT" : "POST",
        body: JSON.stringify({ DynamicCharge: { ...form, Description: form.Description.trim() }, CommissionIds: [...selectedIds] }),
      });
      Swal.fire("Success", response?.message || `Indefinite charge ${item ? "updated" : "created"} successfully.`, "success");
      onSaved();
      onClose();
    } catch (error) {
      Swal.fire(item ? "Update Failed" : "Creation Failed", apiErrorMessage(error, `Unable to ${item ? "update" : "create"} the indefinite charge.`), "error");
    } finally {
      setLoading(false);
    }
  };

  return <AnimatePresence>{open && <>
    <motion.div className="fixed inset-0 z-40 bg-black" initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }} onClick={onClose} />
    <motion.div className="fixed right-3 top-5 z-50 flex max-h-[95vh] w-[560px] flex-col rounded-2xl bg-white p-3 shadow-xl" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
      <div className="m-2 flex shrink-0 items-center justify-between rounded-2xl bg-indigo-600 p-4"><h2 className="text-lg font-bold text-white">{item ? "Edit" : "Create"} Indefinite Charge</h2><Button type="button" variant="outline" size="sm" onClick={onClose}>Close</Button></div>
      <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4">
          <FieldGroup label="Name" help="Identifies this reusable charge determination, such as Loan Processing Charges. The underlying applicable charges define the actual rates and G/L postings."><Input value={form.Description} onChange={(event) => setForm((current) => ({ ...current, Description: event.target.value }))} placeholder="e.g. Loan Processing Charges" /></FieldGroup>
          <div className="grid grid-cols-2 gap-4">
            <FieldGroup label="Recovery Mode" help="Upfront recovers immediately; Periodic is invoked during scheduled recovery; Carry Forward recovers on the next payout.">
              <Select value={String(form.RecoveryMode)} onValueChange={(value) => setForm((current) => ({ ...current, RecoveryMode: Number(value), ...(Number(value) !== UPFRONT && current.RecoverySource === LOAN_ACCOUNT ? { RecoverySource: 0x601 } : {}) }))} disabled={loadingLookups || loadingItem}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{options.RecoveryModes.map((option) => <SelectItem key={option.Value} value={String(option.Value)}>{option.Description}</SelectItem>)}</SelectContent></Select>
            </FieldGroup>
            <FieldGroup label="Recovery Source" help="Loan Account adds an upfront charge to the loan. Savings Account recovers from customer savings and supports upfront, periodic, and carry-forward modes.">
              <Select value={String(form.RecoverySource)} onValueChange={(value) => setForm((current) => ({ ...current, RecoverySource: Number(value) }))} disabled={loadingLookups || loadingItem}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{options.RecoverySources.filter((option) => form.RecoveryMode === UPFRONT || option.Value !== LOAN_ACCOUNT).map((option) => <SelectItem key={option.Value} value={String(option.Value)}>{option.Description}</SelectItem>)}</SelectContent></Select>
            </FieldGroup>
          </div>
          <FieldGroup label={`Applicable Charges${selectedIds.size ? ` (${selectedIds.size} selected)` : ""}`} help="Existing unlocked Charges/Commissions whose graduated scales, caps, rounding, G/L splits, and linked levies are applied when this determination runs."><PickerList items={commissions} selectedIds={selectedIds} onToggle={toggleCommission} getLabel={(commission) => commission.Description} getSublabel={(commission) => commission.MaximumCharge > 0 ? `Maximum ${commission.MaximumCharge}` : "Uncapped"} emptyText={loadingLookups ? "Loading charges..." : "No unlocked charges are available."} /></FieldGroup>
          <label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={form.IsLocked} onChange={(event) => setForm((current) => ({ ...current, IsLocked: event.target.checked }))} className="h-4 w-4 accent-indigo-600" />Locked<FieldHelp label="Locked">Locked indefinite charges are retained for audit and configuration but skipped by the tariff calculation engine.</FieldHelp></label>
        </div>
        <div className="shrink-0 border-t p-4 pt-3"><Button type="submit" disabled={loading || loadingLookups || loadingItem} className="w-full bg-indigo-600 hover:bg-indigo-700">{loading ? "Saving..." : item ? "Update Indefinite Charge" : "Create Indefinite Charge"}</Button></div>
      </form>
    </motion.div>
  </>}</AnimatePresence>;
}

export default function IndefiniteCharges() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [commissions, setCommissions] = useState([]);
  const [options, setOptions] = useState({ RecoveryModes: [], RecoverySources: [] });
  const [loadingLookups, setLoadingLookups] = useState(true);
  const [drawer, setDrawer] = useState(null);
  const pageSize = 20;

  const loadItems = useCallback(() => {
    setLoading(true);
    const query = new URLSearchParams({ text: search, pageIndex: String(pageIndex), pageSize: String(pageSize) });
    apiJson(`${ENDPOINT}/paged?${query}`).then((response) => {
      const page = response?.data ?? response;
      setItems(normalizeList(response));
      setTotal(page?.ItemsCount ?? page?.itemsCount ?? 0);
    }).catch((error) => Swal.fire("Load Error", apiErrorMessage(error, "Unable to load indefinite charges."), "error"))
      .finally(() => setLoading(false));
  }, [search, pageIndex]);

  useEffect(loadItems, [loadItems]);
  useEffect(() => {
    Promise.all([apiJson(`${BASE}/commissions`), apiJson(`${ENDPOINT}/options`)]).then(([commissionData, optionData]) => {
      setCommissions(normalizeList(commissionData).filter((commission) => !commission.IsLocked));
      setOptions(optionData?.data ?? optionData);
    }).catch((error) => Swal.fire("Lookup Error", apiErrorMessage(error, "Unable to load charge configuration options."), "error"))
      .finally(() => setLoadingLookups(false));
  }, []);

  const pages = Math.max(1, Math.ceil(total / pageSize));
  return <div className="relative m-8 rounded-lg bg-white px-8 py-8 shadow-2xl">
    <div className="mb-6 flex items-center justify-between rounded-2xl bg-indigo-800 px-6 py-3"><div className="flex items-center gap-3"><FaRandom className="text-xl text-white" /><div><h1 className="text-xl font-bold text-white">Indefinite Charges</h1><p className="text-xs text-indigo-100">Determine how reusable, non-preset charges are recovered.</p></div></div><Button onClick={() => setDrawer({ mode: "create" })} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700"><FaPlus /> Create</Button></div>
    <Input value={search} onChange={(event) => { setSearch(event.target.value); setPageIndex(0); }} placeholder="Search indefinite charges..." className="mb-4 max-w-md" />
    <div className="rounded-sm bg-gray-200 p-4"><div className="mb-4 grid grid-cols-12 gap-4 rounded-lg bg-gray-700 p-3 font-semibold text-gray-100"><span className="col-span-4">Name</span><span className="col-span-2">Recovery</span><span className="col-span-2">Source</span><span className="col-span-2">Status</span><span className="col-span-2">Action</span></div>
      <div className="space-y-2">{loading ? [0, 1, 2].map((key) => <div key={key} className="grid animate-pulse grid-cols-12 gap-4 rounded-lg bg-gray-50 p-3"><span className="col-span-4 h-4 rounded bg-gray-200" /><span className="col-span-2 h-4 rounded bg-gray-200" /><span className="col-span-2 h-4 rounded bg-gray-200" /></div>) : items.length ? items.map((item) => <div key={item.Id} className="grid grid-cols-12 items-center gap-4 rounded-lg border bg-white p-3 text-sm text-gray-700 shadow-lg transition-all hover:shadow-xl"><span className="col-span-4 font-medium">{item.Description}</span><span className="col-span-2">{item.RecoveryModeDescription}</span><span className="col-span-2">{item.RecoverySourceDescription}</span><span className="col-span-2"><span className={`rounded px-2 py-1 text-xs font-semibold ${item.IsLocked ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}>{item.IsLocked ? "Locked" : "Active"}</span></span><span className="col-span-2"><Button variant="outline" size="sm" onClick={() => setDrawer({ mode: "edit", item })} className="flex items-center gap-1"><FaEdit /> Edit</Button></span></div>) : <p className="py-8 text-center text-sm text-gray-400">No indefinite charges found.</p>}</div>
    </div>
    <div className="mt-4 flex items-center justify-center gap-3"><Button disabled={pageIndex === 0} onClick={() => setPageIndex((value) => value - 1)}>Prev</Button><span className="text-sm text-gray-600">Page {pageIndex + 1} of {pages}</span><Button disabled={pageIndex + 1 >= pages} onClick={() => setPageIndex((value) => value + 1)}>Next</Button></div>
    <ConfigurationDrawer open={!!drawer} item={drawer?.item} onClose={() => setDrawer(null)} onSaved={loadItems} commissions={commissions} options={options} loadingLookups={loadingLookups} />
  </div>;
}
