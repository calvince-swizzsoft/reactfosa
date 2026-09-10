import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Swal from "sweetalert2";
import { FaChevronLeft, FaChevronRight, FaEdit, FaExchangeAlt, FaPlus, FaTimes } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import NotFoundImage from "/assets/scopefinding.png";
import PickerList from "../lib/PickerList";
import EntryPickerModal from "../BatchProcedures/lib/EntryPickerModal";
import FieldHelp from "../SavingsProducts/FieldHelp";
import { FIN_BASE, getWireTransferTypeCommissions, getWireTransferTypeOptions, listWireTransferTypes, saveWireTransferType } from "./api";

const emptyForm = { Description: "", ChartOfAccountId: "", ChartOfAccountName: "", TransactionOwnership: 0, IsLocked: false };
const ownerships = [{ value: 0, label: "Beneficiary Branch (Customer)" }, { value: 1, label: "Initiating Branch (Employee)" }];

function FieldGroup({ label, help, children }) {
  return <div><div className="flex items-center gap-1"><Label className="text-sm font-semibold text-gray-700">{label}</Label><FieldHelp label={label}>{help}</FieldHelp></div>{children}</div>;
}

function WireTransferTypeDrawer({ item, commissions, optionsLoading, onClose, onSaved }) {
  const [form, setForm] = useState(emptyForm);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [configurationLoading, setConfigurationLoading] = useState(false);
  const [configurationError, setConfigurationError] = useState("");
  const [saving, setSaving] = useState(false);
  const [accountPicker, setAccountPicker] = useState(false);

  useEffect(() => {
    setForm(item ? { ...emptyForm, ...item, ChartOfAccountName: item.ChartOfAccountName || item.ChartOfAccountAccountName || "" } : emptyForm);
    setSelectedIds(new Set());
    setConfigurationError("");
    if (!item?.Id) return;
    setConfigurationLoading(true);
    getWireTransferTypeCommissions(item.Id)
      .then((values) => setSelectedIds(new Set((values || []).map((value) => value.Id))))
      .catch((error) => { setConfigurationError(error.message); Swal.fire("Unable to load charges", error.message, "error"); })
      .finally(() => setConfigurationLoading(false));
  }, [item]);

  const toggleCharge = (id) => setSelectedIds((previous) => { const next = new Set(previous); next.has(id) ? next.delete(id) : next.add(id); return next; });
  const submit = async (event) => {
    event.preventDefault();
    if (!form.Description.trim() || !form.ChartOfAccountId) return Swal.fire("Missing Fields", "Name and G/L account are required.", "warning");
    if (!ownerships.some((option) => option.value === Number(form.TransactionOwnership))) return Swal.fire("Invalid Selection", "Select a valid transaction ownership.", "warning");
    if (!selectedIds.size) return Swal.fire("Missing Selection", "Select at least one applicable charge.", "warning");
    setSaving(true);
    try {
      await saveWireTransferType(item?.Id, { WireTransferType: { ...form, Description: form.Description.trim(), TransactionOwnership: Number(form.TransactionOwnership) }, Commissions: [...selectedIds].map((Id) => ({ Id })) });
      await Swal.fire("Success", `Wire transfer type ${item ? "updated" : "created"} successfully.`, "success");
      onSaved(); onClose();
    } catch (error) { Swal.fire("Error", error.message, "error"); } finally { setSaving(false); }
  };
  const busy = saving || configurationLoading || optionsLoading || !!configurationError;

  return <AnimatePresence>
    <motion.div className="fixed inset-0 z-40 bg-black" initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }} onClick={onClose} />
    <motion.div className="fixed right-0 top-0 z-50 flex h-full w-[620px] max-w-full flex-col bg-white p-3 shadow-2xl" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
      <div className="m-2 flex shrink-0 items-center justify-between rounded-2xl bg-indigo-600 p-4 text-white"><h2 className="font-bold">{item ? "Edit" : "Create"} Wire Transfer Type</h2><Button type="button" variant="outline" size="sm" onClick={onClose}><FaTimes /> Close</Button></div>
      <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          <FieldGroup label="Name" help="The name operators use when selecting this wire-transfer product."><Input required maxLength={256} value={form.Description} onChange={(e) => setForm((p) => ({ ...p, Description: e.target.value }))} placeholder="e.g. Domestic EFT" /></FieldGroup>
          <FieldGroup label="G/L Account" help="The control account credited when wire-transfer batches of this type are posted."><button type="button" onClick={() => setAccountPicker(true)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-left text-sm">{form.ChartOfAccountName || "Select G/L account..."}</button></FieldGroup>
          <FieldGroup label="Transaction Ownership" help="Determines whether the customer’s branch or the initiating employee’s branch owns the resulting transaction."><select value={form.TransactionOwnership} onChange={(e) => setForm((p) => ({ ...p, TransactionOwnership: Number(e.target.value) }))} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm">{ownerships.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></FieldGroup>
          <FieldGroup label={`Applicable Charges (${selectedIds.size} selected)`} help="Charges calculated and recovered when this wire-transfer type is used."><PickerList items={commissions} selectedIds={selectedIds} onToggle={toggleCharge} getLabel={(value) => value.Description} getSublabel={(value) => value.ChargeTypeDescription || ""} emptyText={optionsLoading ? "Loading charges..." : "No commissions configured."} /></FieldGroup>
          <label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={form.IsLocked} onChange={(e) => setForm((p) => ({ ...p, IsLocked: e.target.checked }))} className="h-4 w-4 accent-indigo-600" /> Locked <FieldHelp label="Locked">Locked transfer types are unavailable for new operational use.</FieldHelp></label>
          {configurationError && <p role="alert" className="text-sm text-red-600">Charges could not be loaded. Close and reopen the drawer to retry.</p>}
        </div>
        <div className="shrink-0 border-t p-4"><Button type="submit" disabled={busy} className="w-full bg-indigo-600 hover:bg-indigo-700">{saving ? "Saving..." : "Save Wire Transfer Type"}</Button></div>
      </form>
    </motion.div>
    {accountPicker && <EntryPickerModal title="Select G/L Account" allowCreateGlAccount fetchUrl={`${FIN_BASE}/api/accounts/chartofaccounts?pageSize=100`} getLabel={(account) => `${account.AccountCode} — ${account.AccountName}`} getSublabel={(account) => account.CostCenterDescription || ""} onSelect={(account) => setForm((p) => ({ ...p, ChartOfAccountId: account.Id, ChartOfAccountName: `${account.AccountCode} — ${account.AccountName}` }))} onClose={() => setAccountPicker(false)} />}
  </AnimatePresence>;
}

export default function WireTransferTypes() {
  const [items, setItems] = useState([]); const [itemsCount, setItemsCount] = useState(0); const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(""); const [pageIndex, setPageIndex] = useState(0); const [editing, setEditing] = useState(undefined);
  const [commissions, setCommissions] = useState([]); const [optionsLoading, setOptionsLoading] = useState(true); const pageSize = 20;
  const load = () => { setLoading(true); listWireTransferTypes({ text: search, pageIndex, pageSize }).then((page) => { setItems(page?.PageCollection || page?.pageCollection || []); setItemsCount(page?.ItemsCount || page?.itemsCount || 0); }).catch((error) => { setItems([]); Swal.fire("Unable to load wire transfer types", error.message, "error"); }).finally(() => setLoading(false)); };
  useEffect(load, [search, pageIndex]);
  useEffect(() => { getWireTransferTypeOptions().then((options) => setCommissions(options.commissions.filter((value) => !value.IsLocked))).catch((error) => Swal.fire("Unable to load charges", error.message, "error")).finally(() => setOptionsLoading(false)); }, []);
  const pages = Math.max(1, Math.ceil(itemsCount / pageSize));
  return <div className="relative m-8 rounded-lg bg-white px-8 py-8 shadow-2xl">
    <div className="mb-6 flex items-center justify-between rounded-2xl bg-indigo-800 px-6 py-3"><h2 className="flex items-center gap-2 text-xl font-bold text-white"><FaExchangeAlt /> Wire Transfer Types</h2><Button onClick={() => setEditing(null)} className="gap-2 bg-indigo-600 hover:bg-indigo-700"><FaPlus /> Add Wire Transfer Type</Button></div>
    <Input value={search} onChange={(e) => { setSearch(e.target.value); setPageIndex(0); }} placeholder="Search wire transfer types..." className="mb-4 max-w-xs" />
    <div className="rounded-sm bg-gray-200 p-4"><div className="mb-4 grid grid-cols-12 gap-4 rounded-lg bg-gray-700 p-3 font-semibold text-gray-100"><span className="col-span-3">Name</span><span className="col-span-4">G/L Account</span><span className="col-span-3">Transaction Ownership</span><span className="col-span-1">Status</span><span className="col-span-1 text-right">Action</span></div>
      {loading ? <div className="space-y-2">{[1,2,3].map((i) => <div key={i} className="grid grid-cols-12 gap-2 rounded-lg bg-gray-50 p-6">{Array.from({length:12}).map((_,j) => <div key={j} className="h-4 animate-pulse rounded bg-gray-200" />)}</div>)}</div> : items.length ? <div className="space-y-2">{items.map((item) => <div key={item.Id} className="grid grid-cols-12 items-center gap-4 rounded-lg border bg-white p-4 text-sm shadow-lg transition-all hover:shadow-xl"><span className="col-span-3 font-medium text-indigo-700">{item.Description}</span><span className="col-span-4 truncate">{item.ChartOfAccountName || item.ChartOfAccountAccountName || "—"}</span><span className="col-span-3">{item.TransactionOwnershipDescription || "—"}</span><span className="col-span-1"><span className={`rounded px-2 py-1 text-xs font-semibold ${item.IsLocked ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}>{item.IsLocked ? "Locked" : "Active"}</span></span><span className="col-span-1 text-right"><Button size="sm" variant="outline" onClick={() => setEditing(item)} aria-label={`Edit ${item.Description}`}><FaEdit /></Button></span></div>)}</div> : <div className="py-8 text-center"><img src={NotFoundImage} alt="No wire transfer types" className="mx-auto w-32" /><p className="text-gray-400">No wire transfer types found.</p></div>}
      <div className="mt-4 flex items-center justify-center"><Button disabled={!pageIndex} onClick={() => setPageIndex((p) => p - 1)}><FaChevronLeft /> Prev</Button><span className="mx-3">Page {pageIndex + 1} of {pages}</span><Button disabled={pageIndex + 1 >= pages} onClick={() => setPageIndex((p) => p + 1)}>Next <FaChevronRight /></Button></div>
    </div>
    {editing !== undefined && <WireTransferTypeDrawer item={editing} commissions={commissions} optionsLoading={optionsLoading} onClose={() => setEditing(undefined)} onSaved={load} />}
  </div>;
}
