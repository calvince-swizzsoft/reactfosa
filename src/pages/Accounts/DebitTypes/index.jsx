import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Swal from "sweetalert2";
import { AnimatePresence, motion } from "framer-motion";
import { FaChevronLeft, FaChevronRight, FaEdit, FaMoneyBillWave, FaPlus, FaTimes } from "react-icons/fa";
import NotFoundImage from "/assets/scopefinding.png";
import PickerList from "../lib/PickerList";
import EntryPickerModal from "../BatchProcedures/lib/EntryPickerModal";
import { FIN_BASE, getDebitTypeConfiguration, getDebitTypeOptions, listDebitTypes, saveDebitType } from "./api";

const emptyForm = { Description: "", CustomerAccountTypeProductCode: 1, CustomerAccountTypeTargetProductId: "", CustomerAccountTypeTargetProductDescription: "", IsMandatory: false, IsLocked: false };
const emptySelections = () => ({ commissions: new Set() });
const idSet = (items) => new Set((items || []).map((item) => item.Id));
const toggle = (setter, key, id) => setter((previous) => {
  const next = { ...previous, [key]: new Set(previous[key]) };
  next[key].has(id) ? next[key].delete(id) : next[key].add(id);
  return next;
});

function FieldGroup({ label, children }) {
  return <div><Label className="text-sm font-semibold text-gray-700">{label}</Label>{children}</div>;
}

function Selection({ label, items, selected, onToggle, loading }) {
  return (
    <FieldGroup label={`${label} (${selected.size} selected)`}>
      <PickerList
        items={items}
        selectedIds={selected}
        onToggle={onToggle}
        getLabel={(item) => item.Description || item.AccountName || item.Name || "Unnamed"}
        getSublabel={(item) => item.PaddedCode || item.FullAccountNumber || item.ChargeTypeDescription || ""}
        emptyText={loading ? `Loading ${label.toLowerCase()}...` : `No ${label.toLowerCase()} configured.`}
      />
    </FieldGroup>
  );
}

function DebitTypeDrawer({ item, options, optionsLoading, onClose, onSaved }) {
  const [form, setForm] = useState(emptyForm);
  const [selected, setSelected] = useState(emptySelections);
  const [loading, setLoading] = useState(false);
  const [configurationLoading, setConfigurationLoading] = useState(false);
  const [accountPickerOpen, setAccountPickerOpen] = useState(false);
  const [configurationError, setConfigurationError] = useState("");

  useEffect(() => {
    setForm(item ? { ...emptyForm, ...item } : emptyForm);
    setSelected(emptySelections());
    if (!item?.Id) return;
    setConfigurationLoading(true);
    setConfigurationError("");
    getDebitTypeConfiguration(item.Id).then((config) => setSelected({
      commissions: idSet(config?.Commissions),
    })).catch((error) => { setConfigurationError(error.message); Swal.fire("Error", error.message, "error"); }).finally(() => setConfigurationLoading(false));
  }, [item]);

  const submit = async (event) => {
    event.preventDefault();
    if (loading || configurationLoading || optionsLoading || configurationError) return;
    if (!form.Description.trim() || !form.CustomerAccountTypeTargetProductId) {
      Swal.fire("Missing Fields", "Name and target product are required.", "warning");
      return;
    }
    const refs = (ids) => [...ids].map((Id) => ({ Id }));
    const payload = {
      DebitType: { ...form, Description: form.Description.trim() },
      Commissions: refs(selected.commissions),
    };
    setLoading(true);
    try {
      await saveDebitType(item?.Id, payload);
      await Swal.fire("Success", `Debit type ${item ? "updated" : "created"} successfully.`, "success");
      onSaved();
      onClose();
    } catch (error) {
      Swal.fire("Error", error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const busy = loading || configurationLoading || optionsLoading || !!configurationError;
  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-40 bg-black" initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div className="fixed right-0 top-0 z-50 flex h-full w-[620px] max-w-full flex-col bg-white shadow-2xl" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
        <div className="m-2 flex items-center justify-between rounded-2xl bg-indigo-600 px-4 py-3 text-white">
          <h2 className="font-bold">{item ? "Edit" : "Create"} Debit Type</h2>
          <Button type="button" variant="outline" size="sm" onClick={onClose}><FaTimes /> Close</Button>
        </div>
        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
            <FieldGroup label="Name"><Input value={form.Description} onChange={(e) => setForm((p) => ({ ...p, Description: e.target.value }))} placeholder="e.g. Registration fee" /></FieldGroup>
            <FieldGroup label="Product Type">
              <select value={form.CustomerAccountTypeProductCode} onChange={(e) => setForm((p) => ({ ...p, CustomerAccountTypeProductCode: Number(e.target.value), CustomerAccountTypeTargetProductId: "", CustomerAccountTypeTargetProductDescription: "" }))} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
                <option value={1}>Savings</option><option value={2}>Loan</option><option value={3}>Investment</option>
              </select>
            </FieldGroup>
            <FieldGroup label="Target Product">
              <button type="button" onClick={() => setAccountPickerOpen(true)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-left text-sm">{form.CustomerAccountTypeTargetProductDescription || "Select product..."}</button>
            </FieldGroup>
            <label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={form.IsMandatory} onChange={(e) => setForm((p) => ({ ...p, IsMandatory: e.target.checked }))} className="h-4 w-4 accent-indigo-600" /> Mandatory</label>
            <label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={form.IsLocked} onChange={(e) => setForm((p) => ({ ...p, IsLocked: e.target.checked }))} className="h-4 w-4 accent-indigo-600" /> Locked</label>
            <Selection label="Applicable Charges" items={options.commissions} selected={selected.commissions} onToggle={(id) => toggle(setSelected, "commissions", id)} loading={busy} />
            {configurationError && <p role="alert" className="text-sm text-red-600">{configurationError} Close and reopen to retry.</p>}
          </div>
          <div className="shrink-0 border-t px-4 py-3"><Button type="submit" disabled={busy} className="w-full bg-indigo-600 hover:bg-indigo-700">{loading ? "Saving..." : "Save Debit Type"}</Button></div>
        </form>
      </motion.div>
      {accountPickerOpen && <EntryPickerModal
        title="Select Target Product"
        fetchUrl={`${FIN_BASE}/api/accounts/${{1: "savingsproducts", 2: "loanproducts", 3: "investmentsproducts"}[form.CustomerAccountTypeProductCode]}`}
        getLabel={(product) => product.Description}
        getSublabel={(product) => product.PaddedCode || product.Code}
        onSelect={(product) => setForm((p) => ({ ...p, CustomerAccountTypeTargetProductId: product.Id, CustomerAccountTypeTargetProductDescription: product.Description }))}
        onClose={() => setAccountPickerOpen(false)}
      />}
    </AnimatePresence>
  );
}

export default function DebitTypes() {
  const [items, setItems] = useState([]);
  const [itemsCount, setItemsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [editing, setEditing] = useState(undefined);
  const [options, setOptions] = useState({ commissions: [] });
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [optionsError, setOptionsError] = useState("");
  const pageSize = 20;

  const fetchItems = () => {
    setLoading(true);
    listDebitTypes({ text: search, pageIndex, pageSize }).then((page) => {
      setItems(page?.PageCollection || page?.pageCollection || []);
      setItemsCount(page?.ItemsCount || page?.itemsCount || 0);
    }).catch((error) => { setItems([]); Swal.fire("Error", error.message, "error"); }).finally(() => setLoading(false));
  };
  useEffect(fetchItems, [search, pageIndex]);
  useEffect(() => { getDebitTypeOptions().then(setOptions).catch((error) => { setOptionsError(error.message); Swal.fire("Unable to load setup options", error.message, "error"); }).finally(() => setOptionsLoading(false)); }, []);
  const totalPages = Math.max(1, Math.ceil(itemsCount / pageSize));

  return <div className="relative m-8 rounded-lg bg-white px-8 py-8 shadow-2xl">
    <div className="mb-6 flex items-center justify-between rounded-2xl bg-indigo-800 px-6 py-3">
      <h2 className="flex items-center gap-2 text-xl font-bold text-white"><FaMoneyBillWave /> Debit Types</h2>
      <Button onClick={() => setEditing(null)} className="gap-2 bg-indigo-600 hover:bg-indigo-700"><FaPlus /> Add Debit Type</Button>
    </div>
    <Input value={search} onChange={(e) => { setSearch(e.target.value); setPageIndex(0); }} placeholder="Search debit types..." className="mb-4 max-w-xs" />
    {optionsError && <p role="alert" className="mb-4 text-sm text-red-600">Setup options could not be loaded. Refresh the page to retry.</p>}
    <div className="rounded-sm bg-gray-200 p-4">
      <div className="mb-4 grid grid-cols-12 gap-4 rounded-lg bg-gray-700 p-3 font-semibold text-gray-100"><span className="col-span-3">Name</span><span className="col-span-4">Target Product</span><span className="col-span-3">Mandatory</span><span className="col-span-1">Status</span><span className="col-span-1 text-right">Action</span></div>
      {loading ? <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-14 animate-pulse rounded-lg bg-gray-100" />)}</div> : items.length ? <div className="space-y-2">{items.map((item) => <div key={item.Id} className="grid grid-cols-12 items-center gap-4 rounded-lg border bg-white p-4 text-sm shadow-lg transition-all hover:shadow-xl"><span className="col-span-3 font-medium text-indigo-700">{item.Description}</span><span className="col-span-4 truncate">{item.CustomerAccountTypeTargetProductDescription || "—"}</span><span className="col-span-3">{item.IsMandatory ? "Yes" : "No"}</span><span className="col-span-1"><span className={`rounded px-2 py-1 text-xs font-semibold ${item.IsLocked ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}>{item.IsLocked ? "Locked" : "Active"}</span></span><span className="col-span-1 text-right"><Button size="sm" variant="outline" onClick={() => setEditing(item)}><FaEdit /></Button></span></div>)}</div> : <div className="py-8 text-center"><img src={NotFoundImage} alt="No debit types" className="mx-auto w-32" /><p className="text-gray-400">No debit types found.</p></div>}
      <div className="mt-4 flex items-center justify-center"><Button disabled={pageIndex === 0} onClick={() => setPageIndex((p) => p - 1)}><FaChevronLeft /> Prev</Button><span className="mx-3">Page {pageIndex + 1} of {totalPages}</span><Button disabled={pageIndex + 1 >= totalPages} onClick={() => setPageIndex((p) => p + 1)}>Next <FaChevronRight /></Button></div>
    </div>
    {editing !== undefined && <DebitTypeDrawer item={editing} options={options} optionsLoading={optionsLoading || !!optionsError} onClose={() => setEditing(undefined)} onSaved={fetchItems} />}
  </div>;
}
