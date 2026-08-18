import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { FaBook, FaCalendarAlt, FaChevronLeft, FaChevronRight, FaDownload, FaEdit, FaFileUpload, FaKeyboard, FaLock, FaPlus, FaSearch, FaTrash } from "react-icons/fa";
import Swal from "sweetalert2";
import { Button } from "@/components/ui/button";
import NotFoundImage from "/assets/scopefinding.png";
import CustomerPickerModal, { customerDisplayName } from "@/pages/Loaning/LoanCases/lib/CustomerPickerModal";
import { addEntry, closePeriod, createPeriod, customerAccounts, importEntries, listEntries, listPeriods, listPostingPeriods, removeEntry, updatePeriod } from "./api";

// Real full account numbers are BranchCode(3)-CustomerSerialNumber(7)-ProductCode(3)-TargetProductCode(3),
// zero-padded and dash-joined (see DataAttachmentEntryDTO.FullAccountNumber / the
// CustomerAccountFullAccountNumber matching spec, which requires exactly 4 numeric
// segments) — a plain-looking number like "1001-000123" will never resolve.
const CSV_TEMPLATE = `AccountNumber,TransactionType,NewAmount,CurrentAmount,NewBalance,CurrentBalance,NewAbility,CurrentAbility,Remarks
001-0000123-010-001,Fresh Loan,15000,0,15000,0,5000,0,Sample fresh loan checkoff row
001-0000456-010-001,Adjust Balance,0,8000,0,7500,0,0,Sample balance adjustment row
`;

function downloadCsvTemplate() {
  const blob = new Blob([CSV_TEMPLATE], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "checkoff-data-capture-template.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

const MODES = {
  periods: { title: "Checkoff Data Periods", icon: FaCalendarAlt },
  processing: { title: "Checkoff Data Processing", icon: FaKeyboard },
  closing: { title: "Checkoff Period Closing", icon: FaLock },
  catalogue: { title: "Checkoff Catalogue", icon: FaBook },
};
const transactionTypes = [[1, "Fresh Loan"], [2, "Adjust Balance"], [3, "Variation"], [4, "New Member"], [5, "Special Adjustments"], [6, "Stop Deduction"], [7, "Shares Deposit"], [8, "Risk Fund"], [9, "Entrance Fee"]];
const value = (item, name) => item?.[name] ?? item?.[name[0].toLowerCase() + name.slice(1)];
const pageParts = (page) => ({ items: page?.PageCollection || page?.pageCollection || [], count: page?.ItemsCount ?? page?.itemsCount ?? 0 });
const money = (amount) => Number(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function CheckOffDataCapture({ mode = "periods" }) {
  const config = MODES[mode]; const Icon = config.icon;
  const [periods, setPeriods] = useState([]); const [count, setCount] = useState(0);
  const [selectedId, setSelectedId] = useState(""); const [search, setSearch] = useState("");
  const [pageIndex, setPageIndex] = useState(0); const [loading, setLoading] = useState(true);
  const [periodForm, setPeriodForm] = useState(null); const [entriesOpen, setEntriesOpen] = useState(false);

  const load = useCallback(() => { setLoading(true); listPeriods({ text: search, pageIndex, pageSize: 20 }).then((page) => { const parsed = pageParts(page); setPeriods(parsed.items); setCount(parsed.count); setSelectedId((id) => id || value(parsed.items[0], "Id") || ""); }).catch((error) => Swal.fire("Unable to load periods", error.message, "error")).finally(() => setLoading(false)); }, [search, pageIndex]);
  useEffect(() => { const timer = setTimeout(load, 200); return () => clearTimeout(timer); }, [load]);
  const selected = periods.find((item) => value(item, "Id") === selectedId);

  const choose = (period) => { setSelectedId(value(period, "Id")); if (mode !== "periods") setEntriesOpen(true); };
  const handleClose = async (period) => {
    const result = await Swal.fire({ title: "Close checkoff period?", text: "No more entries can be added or removed after closing.", input: "textarea", inputLabel: "Closing remarks", inputPlaceholder: "Explain why this period is being closed", showCancelButton: true, confirmButtonText: "Close period", confirmButtonColor: "#4338ca", inputValidator: (text) => !text?.trim() && "Closing remarks are required." });
    if (!result.isConfirmed) return;
    try { await closePeriod(value(period, "Id"), result.value); await Swal.fire("Period closed", "The checkoff period is now read-only.", "success"); load(); }
    catch (error) { Swal.fire("Unable to close period", error.message, "error"); }
  };

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
      <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2"><Icon /> {config.title}</h2>
        {mode === "periods" && <Button onClick={() => setPeriodForm({})} className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2"><FaPlus /> Open period</Button>}
      </div>

      <div className="relative mb-4 max-w-xl">
        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={(e) => { setSearch(e.target.value); setPageIndex(0); }} placeholder="Search periods, remarks, or posting period" className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
      </div>

      <div className="bg-gray-200 p-4 rounded-sm">
        <div className="grid grid-cols-12 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4">
          <span className="col-span-3">Period</span>
          <span className="col-span-3">Posting period</span>
          <span className="col-span-2">Status</span>
          <span className="col-span-2">Created</span>
          <span className="col-span-2 text-right">Actions</span>
        </div>

        {loading ? (
          <div className="space-y-2 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="grid grid-cols-12 gap-2 bg-gray-50 p-6 rounded">
                {Array.from({ length: 12 }).map((_, j) => <div key={j} className="h-4 bg-gray-200 rounded" />)}
              </div>
            ))}
          </div>
        ) : periods.length > 0 ? (
          <div className="space-y-2">
            {periods.map((period) => {
              const isOpen = value(period, "Status") === 1;
              const isSelected = selectedId === value(period, "Id");
              return (
                <div key={value(period, "Id")} className={`bg-white rounded-lg shadow-lg border ${isSelected ? "border-indigo-400" : ""}`}>
                  <div className="grid grid-cols-12 gap-2 items-center py-4 px-6 hover:shadow-xl transition-all">
                    <span className="col-span-3 font-semibold text-indigo-800">{value(period, "MonthDescription")}</span>
                    <span className="col-span-3 text-sm text-gray-600">{value(period, "PostingPeriodDescription")}</span>
                    <span className="col-span-2">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${isOpen ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-600"}`}>{value(period, "StatusDescription")}</span>
                    </span>
                    <span className="col-span-2 text-sm text-gray-500">{new Date(value(period, "CreatedDate")).toLocaleDateString()}</span>
                    <span className="col-span-2 flex justify-end gap-2">
                      {mode === "periods" ? (
                        <Button size="sm" variant="outline" disabled={!isOpen} onClick={() => setPeriodForm(period)}><FaEdit /></Button>
                      ) : mode === "closing" ? (
                        <Button size="sm" disabled={!isOpen} onClick={() => handleClose(period)} className="gap-1 bg-indigo-600 hover:bg-indigo-700"><FaLock /> Close</Button>
                      ) : (
                        <Button size="sm" onClick={() => choose(period)} className="bg-indigo-600 hover:bg-indigo-700">{mode === "processing" ? "Capture" : "View"}</Button>
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-gray-500 text-center mt-4">
            <img src={NotFoundImage} alt="Not Found" className="mx-auto w-42" />
            <p className="font-medium text-gray-400">No checkoff periods found.</p>
          </div>
        )}

        {!loading && (
          <div className="mt-5 border-t border-gray-300 pt-4">
            <div className="mb-2 text-center text-sm text-gray-600">{count ? `${count} period${count === 1 ? "" : "s"}` : "Period results"}</div>
            <div className="flex items-center justify-center gap-2">
              <Button disabled={!pageIndex} onClick={() => setPageIndex((p) => p - 1)}><FaChevronLeft /> Prev</Button>
              <span className="px-3 text-sm font-medium text-gray-700">Page {pageIndex + 1}</span>
              <Button disabled={(pageIndex + 1) * 20 >= count} onClick={() => setPageIndex((p) => p + 1)}>Next <FaChevronRight /></Button>
            </div>
          </div>
        )}
      </div>

      {periodForm && <PeriodDrawer period={periodForm} onClose={() => setPeriodForm(null)} onSaved={() => { setPeriodForm(null); load(); }} />}
      {entriesOpen && selected && <EntriesDrawer period={selected} editable={mode === "processing"} onClose={() => setEntriesOpen(false)} />}
    </div>
  );
}

function FieldGroup({ label, children }) {
  return (
    <label className="block text-sm font-semibold text-gray-700">
      {label}
      <div className="mt-1 font-normal">{children}</div>
    </label>
  );
}

function PeriodDrawer({ period, onClose, onSaved }) {
  const id = value(period, "Id"); const [postingPeriods, setPostingPeriods] = useState([]); const [postingPeriodId, setPostingPeriodId] = useState(value(period, "PostingPeriodId") || ""); const [month, setMonth] = useState(value(period, "Month") || new Date().getMonth() + 1); const [remarks, setRemarks] = useState(value(period, "Remarks") || ""); const [isActive, setIsActive] = useState(id ? !!value(period, "IsActive") : true); const [saving, setSaving] = useState(false);
  useEffect(() => { listPostingPeriods().then(setPostingPeriods).catch((e) => Swal.fire("Unable to load posting periods", e.message, "error")); }, []);
  const submit = async (e) => { e.preventDefault(); setSaving(true); try { if (id) await updatePeriod(id, { month: Number(month), remarks, isActive }); else await createPeriod({ postingPeriodId, month: Number(month), remarks, isActive }); await Swal.fire("Saved", "The data period was saved.", "success"); onSaved(); } catch (error) { Swal.fire("Unable to save", error.message, "error"); setSaving(false); } };
  return (
    <Drawer title={id ? "Edit data period" : "Open data period"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <FieldGroup label="Posting period">
          <select disabled={!!id} required value={postingPeriodId} onChange={(e) => setPostingPeriodId(e.target.value)} className="w-full rounded-md border border-gray-300 p-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
            <option value="">Select posting period</option>
            {postingPeriods.map((p) => <option key={value(p, "Id")} value={value(p, "Id")}>{value(p, "Description")}</option>)}
          </select>
        </FieldGroup>
        <FieldGroup label="Month">
          <select value={month} onChange={(e) => setMonth(e.target.value)} className="w-full rounded-md border border-gray-300 p-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
            {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{new Date(2000, i, 1).toLocaleString(undefined, { month: "long" })}</option>)}
          </select>
        </FieldGroup>
        <FieldGroup label="Remarks">
          <textarea required value={remarks} onChange={(e) => setRemarks(e.target.value)} className="w-full rounded-md border border-gray-300 p-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" rows={4} />
        </FieldGroup>
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="w-4 h-4 accent-indigo-600" /> Use as the current checkoff capture period
        </label>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">{saving ? "Saving…" : "Save period"}</Button>
        </div>
      </form>
    </Drawer>
  );
}

function EntriesDrawer({ period, editable, onClose }) {
  const periodId = value(period, "Id"); const [entries, setEntries] = useState([]); const [count, setCount] = useState(0); const [page, setPage] = useState(0); const [loading, setLoading] = useState(true); const [search, setSearch] = useState(""); const [picker, setPicker] = useState(false); const [customer, setCustomer] = useState(null); const [accounts, setAccounts] = useState([]); const [form, setForm] = useState({ CustomerAccountId: "", TransactionType: 1, NewAmount: 0, CurrentAmount: 0, NewBalance: 0, CurrentBalance: 0, NewAbility: 0, CurrentAbility: 0, Remarks: "" }); const [importing, setImporting] = useState(false); const fileInputRef = useRef(null);
  const load = useCallback(() => { setLoading(true); listEntries(periodId, { text: search, pageIndex: page, pageSize: 20 }).then((data) => { const p = pageParts(data); setEntries(p.items); setCount(p.count); }).catch((e) => Swal.fire("Unable to load entries", e.message, "error")).finally(() => setLoading(false)); }, [periodId, search, page]);
  useEffect(() => { const t = setTimeout(load, 200); return () => clearTimeout(t); }, [load]);
  const pick = async (c) => { setCustomer(c); setPicker(false); try { const items = await customerAccounts(value(c, "Id")); setAccounts(items); setForm((f) => ({ ...f, CustomerAccountId: "" })); } catch (e) { Swal.fire("Unable to load accounts", e.message, "error"); } };
  const save = async (e) => { e.preventDefault(); try { await addEntry(periodId, { ...form, TransactionType: Number(form.TransactionType), NewAmount: Number(form.NewAmount), CurrentAmount: Number(form.CurrentAmount), NewBalance: Number(form.NewBalance), CurrentBalance: Number(form.CurrentBalance), NewAbility: Number(form.NewAbility), CurrentAbility: Number(form.CurrentAbility) }); setForm((f) => ({ ...f, NewAmount: 0, CurrentAmount: 0, NewBalance: 0, CurrentBalance: 0, NewAbility: 0, CurrentAbility: 0, Remarks: "" })); load(); } catch (error) { Swal.fire("Unable to capture entry", error.message, "error"); } };
  const remove = async (id) => { const answer = await Swal.fire({ title: "Remove entry?", icon: "warning", showCancelButton: true, confirmButtonText: "Remove", confirmButtonColor: "#dc2626" }); if (answer.isConfirmed) try { await removeEntry(periodId, id); load(); } catch (e) { Swal.fire("Unable to remove entry", e.message, "error"); } };
  const handleImportFile = async (e) => { const file = e.target.files?.[0]; if (fileInputRef.current) fileInputRef.current.value = ""; if (!file) return; setImporting(true); try { const result = await importEntries(periodId, file); const errorList = (result?.Errors || result?.errors || []).slice(0, 10).map((x) => `Row ${x.Row ?? x.row}: ${x.Error ?? x.error}`).join("<br/>"); await Swal.fire({ title: "Import complete", icon: (result?.Failed ?? result?.failed) ? "warning" : "success", html: `Imported ${result?.Imported ?? result?.imported ?? 0} row(s). Failed ${result?.Failed ?? result?.failed ?? 0} row(s).${errorList ? `<br/><br/><div style="text-align:left;font-size:12px">${errorList}</div>` : ""}` }); load(); } catch (error) { Swal.fire("Unable to import file", error.message, "error"); } finally { setImporting(false); } };

  return (
    <Drawer title={`${editable ? "Process" : "Catalogue"}: ${value(period, "MonthDescription")}`} onClose={onClose} wide>
      {editable && value(period, "Status") === 1 && (
        <div className="mb-4 flex flex-wrap items-center justify-end gap-2 rounded-lg border bg-gray-50 p-3">
          <Button type="button" size="sm" variant="outline" onClick={downloadCsvTemplate} className="gap-1"><FaDownload /> Download CSV template</Button>
          <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleImportFile} />
          <Button type="button" size="sm" disabled={importing} onClick={() => fileInputRef.current?.click()} className="gap-1 bg-indigo-600 hover:bg-indigo-700"><FaFileUpload /> {importing ? "Importing…" : "Import CSV"}</Button>
        </div>
      )}

      {editable && value(period, "Status") === 1 && (
        <form onSubmit={save} className="mb-6 rounded-lg border bg-indigo-50 p-4">
          <div className="mb-3 flex items-end gap-3">
            <FieldGroup label="Customer">
              <button type="button" onClick={() => setPicker(true)} className="w-full rounded-md border border-gray-300 bg-white p-3 text-left text-sm">{customer ? customerDisplayName(customer) : "Select customer…"}</button>
            </FieldGroup>
            <FieldGroup label="Customer account">
              <select required value={form.CustomerAccountId} onChange={(e) => setForm({ ...form, CustomerAccountId: e.target.value })} className="w-full rounded-md border border-gray-300 bg-white p-3 text-sm">
                <option value="">Select account</option>
                {accounts.map((a) => <option key={value(a, "Id")} value={value(a, "Id")}>{value(a, "CustomerFullName") || customerDisplayName(customer)} · {value(a, "CustomerAccountTypeTargetProductDescription") || value(a, "ProductDescription")} · {value(a, "FullAccountNumber")}</option>)}
              </select>
            </FieldGroup>
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            <FieldGroup label="Transaction type">
              <select value={form.TransactionType} onChange={(e) => setForm({ ...form, TransactionType: e.target.value })} className="w-full rounded-md border border-gray-300 bg-white p-2 text-sm">
                {transactionTypes.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </FieldGroup>
            {["NewAmount", "CurrentAmount", "NewBalance", "CurrentBalance", "NewAbility", "CurrentAbility"].map((field) => (
              <FieldGroup key={field} label={field.replace(/([A-Z])/g, " $1").trim()}>
                <input type="number" step="0.01" value={form[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })} className="w-full rounded-md border border-gray-300 p-2 text-sm" />
              </FieldGroup>
            ))}
            <div className="md:col-span-3">
              <FieldGroup label="Remarks">
                <input value={form.Remarks} onChange={(e) => setForm({ ...form, Remarks: e.target.value })} className="w-full rounded-md border border-gray-300 p-2 text-sm" />
              </FieldGroup>
            </div>
            <Button className="self-end bg-indigo-600 hover:bg-indigo-700"><FaPlus /> Add entry</Button>
          </div>
        </form>
      )}

      <div className="relative mb-4 max-w-xl">
        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} placeholder="Search captured entries" className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
      </div>

      <div className="bg-gray-200 p-4 rounded-sm">
        <div className="grid grid-cols-12 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4 text-sm">
          <span className="col-span-3">Customer / Account</span>
          <span className="col-span-2">Product</span>
          <span className="col-span-2">Type</span>
          <span className="col-span-1">New amount</span>
          <span className="col-span-1">Balance</span>
          <span className="col-span-1">Sequence</span>
          <span className="col-span-1">Created</span>
          <span className="col-span-1 text-right">Actions</span>
        </div>

        {loading ? (
          <div className="space-y-2 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="grid grid-cols-12 gap-2 bg-gray-50 p-6 rounded">
                {Array.from({ length: 12 }).map((_, j) => <div key={j} className="h-4 bg-gray-200 rounded" />)}
              </div>
            ))}
          </div>
        ) : entries.length > 0 ? (
          <div className="space-y-2">
            {entries.map((entry) => (
              <div key={value(entry, "Id")} className="bg-white rounded-lg shadow-lg border">
                <div className="grid grid-cols-12 gap-2 items-center py-4 px-6 hover:shadow-xl transition-all text-sm">
                  <span className="col-span-3">
                    <span className="font-medium text-indigo-700">{value(entry, "CustomerFullName")}</span>
                    <br /><span className="text-xs text-gray-500">{value(entry, "FullAccountNumber")}</span>
                  </span>
                  <span className="col-span-2 text-gray-600">{value(entry, "ProductDescription")}</span>
                  <span className="col-span-2 text-gray-600">{value(entry, "TransactionTypeDescription")}</span>
                  <span className="col-span-1 text-gray-600">{money(value(entry, "NewAmount"))}</span>
                  <span className="col-span-1 text-gray-600">{money(value(entry, "NewBalance"))}</span>
                  <span className="col-span-1 text-gray-600">{value(entry, "SequenceNumber")}</span>
                  <span className="col-span-1 text-gray-500">{new Date(value(entry, "CreatedDate")).toLocaleDateString()}</span>
                  <span className="col-span-1 text-right">
                    {editable && value(period, "Status") === 1 && <Button size="sm" variant="outline" onClick={() => remove(value(entry, "Id"))}><FaTrash className="text-red-600" /></Button>}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-center mt-4">
            <img src={NotFoundImage} alt="Not Found" className="mx-auto w-42" />
            <p className="font-medium text-gray-400">No captured entries.</p>
          </div>
        )}

        {!loading && (
          <div className="mt-5 border-t border-gray-300 pt-4">
            <div className="mb-2 text-center text-sm text-gray-600">{count ? `${count} entr${count === 1 ? "y" : "ies"}` : "Entry results"}</div>
            <div className="flex items-center justify-center gap-2">
              <Button size="sm" disabled={!page} onClick={() => setPage((p) => p - 1)}><FaChevronLeft /> Prev</Button>
              <span className="px-3 text-sm font-medium text-gray-700">Page {page + 1}</span>
              <Button size="sm" disabled={(page + 1) * 20 >= count} onClick={() => setPage((p) => p + 1)}>Next <FaChevronRight /></Button>
            </div>
          </div>
        )}
      </div>

      {picker && <CustomerPickerModal title="Select checkoff customer" onSelect={pick} onClose={() => setPicker(false)} />}
    </Drawer>
  );
}

function Drawer({ title, onClose, wide = false, children }) {
  return (
    <>
      <motion.div className="fixed inset-0 bg-black z-40" initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} onClick={onClose} />
      <motion.div
        className={`fixed top-3 right-3 bottom-3 bg-white shadow-2xl z-50 flex flex-col rounded-2xl ${wide ? "w-[92vw] max-w-6xl" : "w-full max-w-xl"}`}
        initial={{ x: "100%" }} animate={{ x: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="p-4 flex justify-between items-center bg-indigo-600 rounded-2xl m-2 shrink-0">
          <h2 className="font-bold text-lg text-white">{title}</h2>
          <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
        </div>
        <div className="p-5 space-y-4 overflow-y-auto flex-1 min-h-0">{children}</div>
      </motion.div>
    </>
  );
}
