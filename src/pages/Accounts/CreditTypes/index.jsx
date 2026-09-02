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
import { FIN_BASE, getCreditTypeConfiguration, getCreditTypeOptions, listCreditTypes, saveCreditType } from "./api";

const emptyForm = { Description: "", ChartOfAccountId: "", ChartOfAccountName: "", TransactionOwnership: 0, IsLocked: false };
const emptySelections = () => ({ commissions: new Set(), directDebits: new Set(), loans: new Set(), concessions: new Set(), investments: new Set(), savings: new Set() });
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

function CreditTypeDrawer({ item, options, optionsLoading, onClose, onSaved }) {
  const [form, setForm] = useState(emptyForm);
  const [selected, setSelected] = useState(emptySelections);
  const [loading, setLoading] = useState(false);
  const [configurationLoading, setConfigurationLoading] = useState(false);
  const [accountPickerOpen, setAccountPickerOpen] = useState(false);

  useEffect(() => {
    setForm(item ? { ...emptyForm, ...item } : emptyForm);
    setSelected(emptySelections());
    if (!item?.Id) return;
    setConfigurationLoading(true);
    getCreditTypeConfiguration(item.Id).then((config) => setSelected({
      commissions: idSet(config?.Commissions),
      directDebits: idSet(config?.DirectDebits),
      loans: idSet(config?.AttachedProducts?.LoanProductCollection),
      concessions: idSet(config?.ConcessionExemptProducts?.LoanProductCollection),
      investments: idSet(config?.AttachedProducts?.InvestmentProductCollection),
      savings: idSet(config?.AttachedProducts?.SavingsProductCollection),
    })).catch((error) => Swal.fire("Error", error.message, "error")).finally(() => setConfigurationLoading(false));
  }, [item]);

  const submit = async (event) => {
    event.preventDefault();
    if (!form.Description.trim() || !form.ChartOfAccountId) {
      Swal.fire("Missing Fields", "Name and G/L account are required.", "warning");
      return;
    }
    const refs = (ids) => [...ids].map((Id) => ({ Id }));
    const payload = {
      CreditType: { ...form, Description: form.Description.trim(), TransactionOwnership: Number(form.TransactionOwnership) },
      Commissions: refs(selected.commissions),
      DirectDebits: refs(selected.directDebits),
      AttachedProducts: {
        LoanProductCollection: refs(selected.loans), InvestmentProductCollection: refs(selected.investments), SavingsProductCollection: refs(selected.savings),
      },
      ConcessionExemptProducts: { LoanProductCollection: refs(selected.concessions) },
    };
    setLoading(true);
    try {
      await saveCreditType(item?.Id, payload);
      await Swal.fire("Success", `Credit type ${item ? "updated" : "created"} successfully.`, "success");
      onSaved();
      onClose();
    } catch (error) {
      Swal.fire("Error", error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const busy = loading || configurationLoading || optionsLoading;
  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-40 bg-black" initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div className="fixed right-0 top-0 z-50 flex h-full w-[620px] max-w-full flex-col bg-white shadow-2xl" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
        <div className="m-2 flex items-center justify-between rounded-2xl bg-indigo-600 px-4 py-3 text-white">
          <h2 className="font-bold">{item ? "Edit" : "Create"} Credit Type</h2>
          <Button type="button" variant="outline" size="sm" onClick={onClose}><FaTimes /> Close</Button>
        </div>
        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
            <FieldGroup label="Name"><Input value={form.Description} onChange={(e) => setForm((p) => ({ ...p, Description: e.target.value }))} placeholder="e.g. Salary" /></FieldGroup>
            <FieldGroup label="G/L Account">
              <button type="button" onClick={() => setAccountPickerOpen(true)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-left text-sm">
                {form.ChartOfAccountName || "Select G/L account..."}
              </button>
            </FieldGroup>
            <FieldGroup label="Transaction Ownership">
              <select value={form.TransactionOwnership} onChange={(e) => setForm((p) => ({ ...p, TransactionOwnership: Number(e.target.value) }))} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
                <option value={0}>Beneficiary Branch (Customer)</option>
                <option value={1}>Initiating Branch (Employee)</option>
              </select>
            </FieldGroup>
            <label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={form.IsLocked} onChange={(e) => setForm((p) => ({ ...p, IsLocked: e.target.checked }))} className="h-4 w-4 accent-indigo-600" /> Locked</label>
            <Selection label="Applicable Charges" items={options.commissions} selected={selected.commissions} onToggle={(id) => toggle(setSelected, "commissions", id)} loading={busy} />
            <Selection label="Applicable Direct Debits" items={options.directDebits} selected={selected.directDebits} onToggle={(id) => toggle(setSelected, "directDebits", id)} loading={busy} />
            <Selection label="Attached Loan Products" items={options.loanProducts} selected={selected.loans} onToggle={(id) => toggle(setSelected, "loans", id)} loading={busy} />
            <Selection label="Concession-Exempt Loan Products" items={options.loanProducts} selected={selected.concessions} onToggle={(id) => toggle(setSelected, "concessions", id)} loading={busy} />
            <Selection label="Attached Investment Products" items={options.investmentProducts} selected={selected.investments} onToggle={(id) => toggle(setSelected, "investments", id)} loading={busy} />
            <Selection label="Attached Savings Products" items={options.savingsProducts} selected={selected.savings} onToggle={(id) => toggle(setSelected, "savings", id)} loading={busy} />
          </div>
          <div className="shrink-0 border-t px-4 py-3"><Button type="submit" disabled={busy} className="w-full bg-indigo-600 hover:bg-indigo-700">{loading ? "Saving..." : "Save Credit Type"}</Button></div>
        </form>
      </motion.div>
      {accountPickerOpen && <EntryPickerModal
        title="Select G/L Account"
        fetchUrl={`${FIN_BASE}/api/accounts/chartofaccounts?pageIndex=0&pageSize=100&text=`}
        filterItems={(account) => Number(account.AccountCategory) !== 4096}
        getLabel={(account) => account.AccountName || account.Description}
        getSublabel={(account) => [account.AccountCode, account.CostCenterDescription].filter(Boolean).join(" — ")}
        onSelect={(account) => setForm((p) => ({ ...p, ChartOfAccountId: account.Id, ChartOfAccountName: account.Name || `${account.AccountCode || ""} ${account.AccountName || account.Description || ""}`.trim() }))}
        onClose={() => setAccountPickerOpen(false)}
      />}
    </AnimatePresence>
  );
}

export default function CreditTypes() {
  const [items, setItems] = useState([]);
  const [itemsCount, setItemsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [editing, setEditing] = useState(undefined);
  const [options, setOptions] = useState({ commissions: [], directDebits: [], loanProducts: [], investmentProducts: [], savingsProducts: [] });
  const [optionsLoading, setOptionsLoading] = useState(true);
  const pageSize = 20;

  const fetchItems = () => {
    setLoading(true);
    listCreditTypes({ text: search, pageIndex, pageSize }).then((page) => {
      setItems(page?.PageCollection || page?.pageCollection || []);
      setItemsCount(page?.ItemsCount || page?.itemsCount || 0);
    }).catch((error) => { setItems([]); Swal.fire("Error", error.message, "error"); }).finally(() => setLoading(false));
  };
  useEffect(fetchItems, [search, pageIndex]);
  useEffect(() => { getCreditTypeOptions().then(setOptions).catch((error) => Swal.fire("Unable to load setup options", error.message, "error")).finally(() => setOptionsLoading(false)); }, []);
  const totalPages = Math.max(1, Math.ceil(itemsCount / pageSize));

  return <div className="relative m-8 rounded-lg bg-white px-8 py-8 shadow-2xl">
    <div className="mb-6 flex items-center justify-between rounded-2xl bg-indigo-800 px-6 py-3">
      <h2 className="flex items-center gap-2 text-xl font-bold text-white"><FaMoneyBillWave /> Credit Types</h2>
      <Button onClick={() => setEditing(null)} className="gap-2 bg-indigo-600 hover:bg-indigo-700"><FaPlus /> Add Credit Type</Button>
    </div>
    <Input value={search} onChange={(e) => { setSearch(e.target.value); setPageIndex(0); }} placeholder="Search credit types..." className="mb-4 max-w-xs" />
    <div className="rounded-sm bg-gray-200 p-4">
      <div className="mb-4 grid grid-cols-12 gap-4 rounded-lg bg-gray-700 p-3 font-semibold text-gray-100"><span className="col-span-3">Name</span><span className="col-span-4">G/L Account</span><span className="col-span-3">Ownership</span><span className="col-span-1">Status</span><span className="col-span-1 text-right">Action</span></div>
      {loading ? <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-14 animate-pulse rounded-lg bg-gray-100" />)}</div> : items.length ? <div className="space-y-2">{items.map((item) => <div key={item.Id} className="grid grid-cols-12 items-center gap-4 rounded-lg border bg-white p-4 text-sm shadow-lg transition-all hover:shadow-xl"><span className="col-span-3 font-medium text-indigo-700">{item.Description}</span><span className="col-span-4 truncate">{item.ChartOfAccountName || item.ChartOfAccountAccountName || "—"}</span><span className="col-span-3">{item.TransactionOwnershipDescription || "—"}</span><span className="col-span-1"><span className={`rounded px-2 py-1 text-xs font-semibold ${item.IsLocked ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}>{item.IsLocked ? "Locked" : "Active"}</span></span><span className="col-span-1 text-right"><Button size="sm" variant="outline" onClick={() => setEditing(item)}><FaEdit /></Button></span></div>)}</div> : <div className="py-8 text-center"><img src={NotFoundImage} alt="No credit types" className="mx-auto w-32" /><p className="text-gray-400">No credit types found.</p></div>}
      <div className="mt-4 flex items-center justify-center"><Button disabled={pageIndex === 0} onClick={() => setPageIndex((p) => p - 1)}><FaChevronLeft /> Prev</Button><span className="mx-3">Page {pageIndex + 1} of {totalPages}</span><Button disabled={pageIndex + 1 >= totalPages} onClick={() => setPageIndex((p) => p + 1)}>Next <FaChevronRight /></Button></div>
    </div>
    {editing !== undefined && <CreditTypeDrawer item={editing} options={options} optionsLoading={optionsLoading} onClose={() => setEditing(undefined)} onSaved={fetchItems} />}
  </div>;
}
