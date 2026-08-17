import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Swal from "sweetalert2";
import { FaHandshake, FaPlus, FaTrash, FaChevronDown } from "react-icons/fa";
import NotFoundImage from "/assets/scopefinding.png";
import {
  attachLoanGuarantors, listAttachmentHistory, getAttachmentHistoryEntries,
  relieveLoanGuarantors, substituteLoanGuarantors,
} from "./api";
import EntryPickerModal from "../../Accounts/BatchProcedures/lib/EntryPickerModal";
import PickerList from "../../Accounts/lib/PickerList";
import CustomerPickerModal from "../LoanCases/lib/CustomerPickerModal";
import { listLoanGuarantors } from "../Guarantors/api";

const FIN_BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
const MODULE_NAVIGATION_ITEM_CODE = { attach: 70014, substitute: 70015, relieve: 70016 };

const HISTORY_STATUS = { Attached: 0, Relieved: 1 };

function customerAccountName(account = {}) {
  return account.CustomerFullName
    || [account.CustomerIndividualFirstName, account.CustomerIndividualLastName].filter(Boolean).join(" ").trim()
    || account.CustomerNonIndividualDescription
    || "Unnamed customer";
}

function customerAccountProduct(account = {}) {
  return account.CustomerAccountTypeTargetProductDescription
    || account.TargetProductDescription
    || account.TypeDescription
    || "Unknown product";
}

function customerAccountLabel(account) {
  return `${customerAccountName(account)} — ${customerAccountProduct(account)}`;
}

function FieldGroup({ label, children }) {
  return (
    <div>
      <Label className="text-sm font-semibold text-gray-700">{label}</Label>
      {children}
    </div>
  );
}

function PickerField({ label, value, placeholder, onClick }) {
  return (
    <div>
      <Label className="text-sm font-semibold text-gray-700 mb-1 block">{label}</Label>
      <button
        type="button"
        onClick={onClick}
        className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md bg-white text-sm hover:border-indigo-400 transition-colors text-left"
      >
        <span className={value ? "text-gray-800 truncate" : "text-gray-400"}>{value || placeholder}</span>
        <FaChevronDown className="text-gray-400 text-xs flex-shrink-0 ml-2" />
      </button>
    </div>
  );
}

/* ══════════════════════ Attach ══════════════════════ */

function AttachPanel() {
  const [sourceCustomerAccountId, setSourceCustomerAccountId] = useState("");
  const [sourceLabel, setSourceLabel] = useState("");
  const [destinationLoanProductId, setDestinationLoanProductId] = useState("");
  const [destinationLabel, setDestinationLabel] = useState("");
  const [rows, setRows] = useState([]);
  const [picker, setPicker] = useState(null);
  const [loading, setLoading] = useState(false);

  const addRow = (guarantor) => {
    if (rows.some((r) => r.Id === guarantor.Id)) return;
    setRows((p) => [...p, { Id: guarantor.Id, label: `${guarantor.CustomerFullName} → ${guarantor.LoaneeCustomerFullName}`, PrincipalAttached: "", InterestAttached: "" }]);
  };
  const updateRow = (id, patch) => setRows((p) => p.map((r) => (r.Id === id ? { ...r, ...patch } : r)));
  const removeRow = (id) => setRows((p) => p.filter((r) => r.Id !== id));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!sourceCustomerAccountId || !destinationLoanProductId || rows.length === 0) {
      Swal.fire("Missing Fields", "Source account, destination loan product, and at least one guarantor row are required.", "warning");
      return;
    }
    setLoading(true);
    try {
      await attachLoanGuarantors({
        SourceCustomerAccountId: sourceCustomerAccountId,
        DestinationLoanProductId: destinationLoanProductId,
        LoanGuarantors: rows.map((r) => ({ Id: r.Id, PrincipalAttached: Number(r.PrincipalAttached) || 0, InterestAttached: Number(r.InterestAttached) || 0 })),
        ModuleNavigationItemCode: MODULE_NAVIGATION_ITEM_CODE.attach,
      });
      Swal.fire("Success", "Loan guarantors attached.", "success");
      setSourceCustomerAccountId(""); setSourceLabel("");
      setDestinationLoanProductId(""); setDestinationLabel("");
      setRows([]);
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
      <p className="text-xs text-gray-400">
        Pledges an already-existing guarantor record's security against a loan product — it doesn't create a new guarantor. Create one first under Guarantor Management if it doesn't exist yet.
      </p>
      <PickerField label="Source Customer Account" value={sourceLabel} placeholder="Search & select the account being pledged..." onClick={() => setPicker("source")} />
      <PickerField label="Destination Loan Product" value={destinationLabel} placeholder="Select the loan product this secures..." onClick={() => setPicker("destination")} />

      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Guarantors</p>
          <Button type="button" size="sm" variant="outline" onClick={() => setPicker("guarantor")} className="flex items-center gap-1">
            <FaPlus className="text-xs" /> Add
          </Button>
        </div>
        <div className="space-y-2">
          {rows.map((row) => (
            <div key={row.Id} className="bg-white rounded-lg border p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700 truncate">{row.label}</span>
                <button type="button" onClick={() => removeRow(row.Id)} className="text-red-400 hover:text-red-600"><FaTrash className="text-xs" /></button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <FieldGroup label="Principal Attached">
                  <Input type="number" min="0" value={row.PrincipalAttached} onChange={(e) => updateRow(row.Id, { PrincipalAttached: e.target.value })} />
                </FieldGroup>
                <FieldGroup label="Interest Attached">
                  <Input type="number" min="0" value={row.InterestAttached} onChange={(e) => updateRow(row.Id, { InterestAttached: e.target.value })} />
                </FieldGroup>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700">
        {loading ? "Attaching..." : "Attach Guarantors"}
      </Button>

      {picker === "source" && (
        <EntryPickerModal
          title="Select Source Customer Account"
          fetchUrl={`${FIN_BASE}/api/accounts/customer-accounts?pageSize=1000`}
          getLabel={customerAccountLabel}
          getSublabel={(i) => i.FullAccountNumber || "Account number unavailable"}
          onSelect={(i) => { setSourceCustomerAccountId(i.Id); setSourceLabel(`${customerAccountLabel(i)} · ${i.FullAccountNumber || "Account number unavailable"}`); }}
          onClose={() => setPicker(null)}
        />
      )}
      {picker === "destination" && (
        <EntryPickerModal
          title="Select Destination Loan Product"
          fetchUrl={`${FIN_BASE}/api/accounts/loanproducts`}
          getLabel={(i) => i.Description}
          onSelect={(i) => { setDestinationLoanProductId(i.Id); setDestinationLabel(i.Description); }}
          onClose={() => setPicker(null)}
        />
      )}
      {picker === "guarantor" && (
        <EntryPickerModal
          title="Select Existing Guarantor Record"
          fetchUrl={`${FIN_BASE}/api/backoffice/loanguarantors?pageSize=1000`}
          getLabel={(i) => i.CustomerFullName}
          getSublabel={(i) => `Loanee: ${i.LoaneeCustomerFullName} · Case #${i.LoanCasePaddedCaseNumber}`}
          onSelect={addRow}
          onClose={() => setPicker(null)}
        />
      )}
    </form>
  );
}

/* ══════════════════════ History / Relieve ══════════════════════ */

function HistoryPanel() {
  const [status, setStatus] = useState(HISTORY_STATUS.Attached);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loadingEntries, setLoadingEntries] = useState(false);

  const fetchList = () => {
    setLoading(true);
    listAttachmentHistory({ status, pageSize: 100 })
      .then((page) => setItems(page?.pageCollection || page?.PageCollection || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchList(); }, [status]);

  const openDetail = (record) => {
    setSelected(record);
    setLoadingEntries(true);
    getAttachmentHistoryEntries(record.Id)
      .then((list) => setEntries(list || []))
      .catch(() => setEntries([]))
      .finally(() => setLoadingEntries(false));
  };

  const handleRelieve = async () => {
    const confirm = await Swal.fire({
      title: "Relieve this attachment?",
      text: "This releases every guarantee under this record in one call — it cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      confirmButtonText: "Relieve",
    });
    if (!confirm.isConfirmed) return;
    try {
      await relieveLoanGuarantors(selected.Id, MODULE_NAVIGATION_ITEM_CODE.relieve);
      Swal.fire("Success", "Guarantors relieved.", "success");
      setSelected(null);
      fetchList();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {Object.entries(HISTORY_STATUS).map(([label, value]) => (
          <button
            key={label}
            type="button"
            onClick={() => setStatus(value)}
            className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all ${status === value ? "bg-white shadow text-indigo-700" : "text-gray-500 hover:text-indigo-600"}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="bg-gray-200 p-4 rounded-sm">
        <div className="grid grid-cols-12 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4 text-sm">
          <span className="col-span-5">Source Customer</span>
          <span className="col-span-4">Account Number</span>
          <span className="col-span-3">Created</span>
        </div>

        {loading ? (
          <div className="space-y-2 animate-pulse">{[1, 2, 3].map((i) => <div key={i} className="h-12 bg-gray-100 rounded-lg" />)}</div>
        ) : items.length > 0 ? (
          <div className="space-y-2">
            {items.map((record) => (
              <button key={record.Id} type="button" onClick={() => openDetail(record)} className="w-full text-left bg-white rounded-lg shadow-lg border hover:shadow-xl transition-all">
                <div className="grid grid-cols-12 gap-2 items-center py-3 px-6 text-sm">
                  <span className="col-span-5 font-medium text-indigo-700 truncate">{record.CustomerFullName}</span>
                  <span className="col-span-4 text-gray-700 font-mono text-xs">{record.FullAccountNumber}</span>
                  <span className="col-span-3 text-gray-500 text-xs">{record.CreatedDate ? new Date(record.CreatedDate).toLocaleDateString() : "—"}</span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <img src={NotFoundImage} alt="Not Found" className="mx-auto w-42" />
            <p className="text-gray-400 font-medium">No attachment history found.</p>
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelected(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-[520px] max-h-[80vh] flex flex-col z-10">
            <div className="flex justify-between items-center px-5 py-4 bg-indigo-600 rounded-t-2xl">
              <h3 className="font-bold text-white text-base">{selected.CustomerFullName}</h3>
              <button onClick={() => setSelected(null)} className="text-white/70 hover:text-white">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
              {loadingEntries ? (
                <p className="text-sm text-gray-400">Loading...</p>
              ) : entries.length > 0 ? (
                entries.map((e) => (
                  <div key={e.Id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-sm">
                    <span className="text-gray-700 truncate">Case #{e.PaddedLoanGuarantorLoanCaseCaseNumber}</span>
                    <span className="font-semibold text-gray-800">{((e.PrincipalAttached || 0) + (e.InterestAttached || 0)).toLocaleString()}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">No entries.</p>
              )}
            </div>
            {status === HISTORY_STATUS.Attached && (
              <div className="shrink-0 px-4 py-3 border-t">
                <Button onClick={handleRelieve} variant="outline" className="w-full border-red-300 text-red-600 hover:bg-red-50">Relieve</Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════ Substitute ══════════════════════ */

function SubstitutePanel() {
  const [substituteCustomerId, setSubstituteCustomerId] = useState("");
  const [substituteLabel, setSubstituteLabel] = useState("");
  const [allGuarantors, setAllGuarantors] = useState([]);
  const [loadingGuarantors, setLoadingGuarantors] = useState(true);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [picker, setPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoadingGuarantors(true);
    listLoanGuarantors({ pageSize: 1000 })
      .then((page) => setAllGuarantors(page?.pageCollection || page?.PageCollection || []))
      .catch(() => setAllGuarantors([]))
      .finally(() => setLoadingGuarantors(false));
  }, []);

  const toggle = (id) => setSelectedIds((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!substituteCustomerId || selectedIds.size === 0) {
      Swal.fire("Missing Fields", "New guarantor and at least one existing guarantor record to replace are required.", "warning");
      return;
    }
    setLoading(true);
    try {
      await substituteLoanGuarantors({
        SubstituteGuarantorCustomerId: substituteCustomerId,
        LoanGuarantorIds: Array.from(selectedIds),
        ModuleNavigationItemCode: MODULE_NAVIGATION_ITEM_CODE.substitute,
      });
      Swal.fire("Success", "Guarantors substituted.", "success");
      setSubstituteCustomerId(""); setSubstituteLabel(""); setSelectedIds(new Set());
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
      <PickerField label="New (Substitute) Guarantor" value={substituteLabel} placeholder="Search & select the replacement guarantor..." onClick={() => setPicker(true)} />

      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Guarantor Records to Replace</p>
        {loadingGuarantors ? (
          <p className="text-sm text-gray-400">Loading...</p>
        ) : (
          <PickerList
            items={allGuarantors}
            selectedIds={selectedIds}
            onToggle={toggle}
            getLabel={(g) => g.CustomerFullName}
            getSublabel={(g) => `Loanee: ${g.LoaneeCustomerFullName} · Case #${g.LoanCasePaddedCaseNumber}`}
            emptyText="No guarantor records found."
          />
        )}
      </div>

      <Button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700">
        {loading ? "Substituting..." : "Substitute Guarantors"}
      </Button>

      {picker && (
        <CustomerPickerModal
          title="Select Substitute Guarantor"
          onSelect={(i) => { setSubstituteCustomerId(i.Id); setSubstituteLabel(i.FullName); }}
          onClose={() => setPicker(false)}
        />
      )}
    </form>
  );
}

/* ══════════════════════ Shell ══════════════════════ */

const TABS = [
  { id: "attach", label: "Attach", Panel: AttachPanel },
  { id: "history", label: "History / Relieve", Panel: HistoryPanel },
  { id: "substitute", label: "Substitute", Panel: SubstitutePanel },
];

// api/backoffice/loanguarantorattachments —
// docs/api/loan-guarantor-attachment-api-spec.md. NavigationMenu codes
// 70014 (Attach)/70015 (Substitute)/70016 (Relieve) — one controller,
// three codes, united here via tabs same as Batch Procedures/Cheques.
export default function GuarantorAttachment() {
  const [activeTab, setActiveTab] = useState(TABS[0].id);
  const tab = TABS.find((t) => t.id === activeTab);

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
      <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FaHandshake /> Guarantor Attachment
        </h2>
      </div>

      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all ${activeTab === t.id ? "bg-white shadow text-indigo-700" : "text-gray-500 hover:text-indigo-600"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <tab.Panel />
    </div>
  );
}
