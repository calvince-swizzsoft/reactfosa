import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { FaSearch, FaChevronDown, FaTimes, FaSpinner } from "react-icons/fa";
import Swal from "sweetalert2";
import NotFoundImage from "/assets/scopefinding.png";

//const BASE = "https://calvins.ngrok.io";
const BASE = `${import.meta.env.VITE_APP_FIN_URL}`

/* ── Generic searchable-select popup ──────────────────────────── */
function SearchSelectModal({ title, fetchUrl, getLabel, getSublabel, onSelect, onClose }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetch(fetchUrl)
      .then((r) => r.json())
      .then((d) => setItems(Array.isArray(d) ? d : (Array.isArray(d?.Data) ? d.Data : (Array.isArray(d?.data) ? d.data : []))))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [fetchUrl]);

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter((item) => {
      const label = getLabel(item) ?? "";
      const sub = getSublabel ? (getSublabel(item) ?? "") : "";
      return label.toLowerCase().includes(q) || sub.toLowerCase().includes(q);
    });
  }, [query, items, getLabel, getSublabel]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Modal card */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-[480px] max-h-[80vh] flex flex-col z-10">
        {/* Header */}
        <div className="flex justify-between items-center px-5 py-4 bg-indigo-600 rounded-t-2xl">
          <h3 className="font-bold text-white text-base">{title}</h3>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
            <FaTimes />
          </button>
        </div>

        {/* Search input */}
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
              className="pl-8 text-sm"
            />
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto px-2 py-2">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-gray-400 gap-2">
              <FaSpinner className="animate-spin" />
              <span className="text-sm">Loading...</span>
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-8">No results found.</p>
          ) : (
            filtered.map((item) => (
              <button
                key={item.Id}
                onClick={() => { onSelect(item); onClose(); }}
                className="w-full text-left px-4 py-2.5 rounded-xl hover:bg-indigo-50 transition-colors"
              >
                <p className="text-sm font-semibold text-gray-800">{getLabel(item)}</p>
                {getSublabel && (
                  <p className="text-xs text-gray-400 mt-0.5">{getSublabel(item)}</p>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Clickable select field ───────────────────────────────────── */
function SelectField({ label, value, placeholder, onClick }) {
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

/* ── Cheque table skeleton ────────────────────────────────────── */
function SkeletonRow() {
  return (
    <div className="grid grid-cols-12 gap-2 items-center bg-white px-4 py-3 rounded-lg shadow border animate-pulse">
      <div className="col-span-1"><div className="h-4 w-4 bg-gray-200 rounded" /></div>
      <div className="col-span-2"><div className="h-3 bg-gray-200 rounded w-16" /></div>
      <div className="col-span-2"><div className="h-3 bg-gray-200 rounded w-28" /></div>
      <div className="col-span-2"><div className="h-4 bg-gray-200 rounded w-24" /></div>
      <div className="col-span-1"><div className="h-4 bg-indigo-100 rounded w-14" /></div>
      <div className="col-span-4 flex gap-1">
        <div className="h-5 bg-gray-200 rounded-full w-16" />
        <div className="h-5 bg-gray-200 rounded-full w-14" />
        <div className="h-5 bg-gray-200 rounded-full w-20" />
      </div>
    </div>
  );
}

/* ── Modal configs ────────────────────────────────────────────── */
const MODAL_CONFIGS = {
  bankLinkage: {
    title: "Select Bank Linkage",
    fetchUrl: `${BASE}/api/values/getBankWithLinkages`,
    getLabel: (item) =>
      `${item.BankName || ""} — ${item.BankBranchName || ""}`.trim() || item.Id,
    getSublabel: (item) =>
      `Acc: ${item.BankAccountNumber || "—"}  |  Bal: ${(item.BankLinkageBalance ?? 0).toLocaleString()}  |  ${item.BranchDescription || ""}`,
    idField: "Id",
    labelField: "Id",
  },
  chartOfAccount: {
    title: "Select Chart of Account",
    fetchUrl: `${BASE}/api/chartofaccounts`,
    getLabel: (item) =>
      item.AccountCode ? `${item.AccountCode} — ${item.AccountName || item.Name || ""}` : (item.Name || item.Id),
    getSublabel: (item) => item.AccountType || item.Description || null,
    idField: "Id",
    labelField: "Id",
  },
  branch: {
    title: "Select Branch",
    fetchUrl: `${BASE}/api/administration/branches`,
    getLabel: (item) => item.Description || item.Name || item.Id,
    getSublabel: (item) => item.Code || item.BranchCode || null,
    idField: "Id",
    labelField: "Id",
  },
};

/* ── Main component ──────────────────────────────────────────── */
const emptyLinkage = {
  Id: "", IdLabel: "",
  ChartOfAccountId: "", ChartOfAccountLabel: "",
  BranchId: "", BranchLabel: "",
};

export default function BankCheques() {
  const [cheques, setCheques] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [linkage, setLinkage] = useState(emptyLinkage);
  const [branchId, setBranchId] = useState("");
  const [openModal, setOpenModal] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`${BASE}/api/frontoffice/cheques`).then((r) => r.json()),
      fetch(`${BASE}/api/administration/branches`).then((r) => r.json()),
    ])
      .then(([chequeData, branchData]) => {
        setCheques(Array.isArray(chequeData) ? chequeData : []);
        setBranches(Array.isArray(branchData?.data) ? branchData.data : (Array.isArray(branchData) ? branchData : []));
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  const transferredCheques = cheques.filter((c) => c.IsTransferred === true);
  const allSelected = transferredCheques.length > 0 && selected.length === transferredCheques.length;
  const toggleAll = () => setSelected(allSelected ? [] : transferredCheques.map((c) => c.Id));
  const toggleOne = (id) =>
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  // Selecting a bank linkage auto-fills COA and pre-selects branch in the dropdown
  const handleBankLinkageSelect = (item) => {
    setLinkage({
      Id: item.Id,
      IdLabel: `${item.BankName || ""} — ${item.BankBranchName || ""}`.trim(),
      ChartOfAccountId: item.ChartOfAccountId || "",
      ChartOfAccountLabel: item.ChartOfAccountName || item.ChartOfAccountAccountName || "",
      _raw: item,
    });
    if (item.BranchId) setBranchId(item.BranchId);
  };

  const handleSubmit = async () => {
    if (selected.length === 0) return Swal.fire("Warning", "Select at least one cheque.", "warning");
    if (!linkage.Id || !linkage.ChartOfAccountId || !branchId) {
      return Swal.fire("Warning", "Select a bank linkage and branch.", "warning");
    }
    const confirm = await Swal.fire({
      title: `Bank ${selected.length} cheque(s)?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#4f46e5",
      confirmButtonText: "Bank",
    });
    if (!confirm.isConfirmed) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${BASE}/api/frontoffice/cheques/bank`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedChequeIds: selected,
          bankLinkageDTO: {
            Id: linkage.Id,
            ChartOfAccountId: linkage.ChartOfAccountId,
            BranchId: branchId,
          },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) throw new Error(data.message || "Banking failed");
      Swal.fire("Success", data.message || "Cheques banked successfully.", "success");
      setSelected([]);
      setLinkage(emptyLinkage);
      setBranchId("");
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Bank linkage panel — visible when cheques are selected */}
      {selected.length > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-4 space-y-3">
          <p className="text-sm font-semibold text-indigo-700">
            {selected.length} cheque(s) selected — select a bank linkage
          </p>

          {/* Single bank linkage picker */}
          <SelectField
            label="Bank Linkage"
            value={linkage.IdLabel}
            placeholder="Search & select bank linkage..."
            onClick={() => setOpenModal("bankLinkage")}
          />

          {/* Branch dropdown */}
          <div>
            <Label className="text-sm font-semibold text-gray-700 mb-1 block">Branch</Label>
            <Select value={branchId} onValueChange={setBranchId}>
              <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
              <SelectContent>
                {branches.map((b) => (
                  <SelectItem key={b.Id} value={b.Id}>{b.Description || b.Name || b.Id}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Auto-filled COA + bank details card */}
          {linkage.Id && (
            <div className="grid grid-cols-2 gap-3 bg-white border border-indigo-100 rounded-xl p-3 text-xs">
              <div>
                <p className="text-gray-400 font-semibold uppercase tracking-wide mb-0.5">Chart of Account</p>
                <p className="text-gray-800 font-medium">{linkage.ChartOfAccountLabel || "—"}</p>
                <p className="text-gray-400 font-mono mt-0.5">{linkage.ChartOfAccountId}</p>
              </div>
              {linkage._raw && (
                <>
                  <div>
                    <p className="text-gray-400 font-semibold uppercase tracking-wide mb-0.5">Account No.</p>
                    <p className="text-gray-800 font-medium">{linkage._raw.BankAccountNumber || "—"}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-400 font-semibold uppercase tracking-wide mb-0.5">Balance</p>
                    <p className={`font-bold text-sm ${(linkage._raw.BankLinkageBalance ?? 0) < 0 ? "text-red-600" : "text-green-600"}`}>
                      {(linkage._raw.BankLinkageBalance ?? 0).toLocaleString()}
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={submitting || !linkage.Id}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {submitting ? "Banking..." : `Bank ${selected.length} Cheque(s)`}
          </Button>
        </div>
      )}

      {/* Table header */}
      <div className="grid grid-cols-12 gap-2 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-3 text-sm">
        <span className="col-span-1">
          <input type="checkbox" checked={allSelected} onChange={toggleAll} className="rounded cursor-pointer" />
        </span>
        <span className="col-span-2">Cheque #</span>
        <span className="col-span-2">Account</span>
        <span className="col-span-2">Customer</span>
        <span className="col-span-1">Amount</span>
        <span className="col-span-4">Status</span>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => <SkeletonRow key={i} />)}
        </div>
      ) : transferredCheques.length > 0 ? (
        <div className="space-y-2">
          {transferredCheques.map((c) => {
            const isSelected = selected.includes(c.Id);
            return (
              <div
                key={c.Id}
                onClick={() => toggleOne(c.Id)}
                className={`grid grid-cols-12 gap-2 items-center px-4 py-3 rounded-lg shadow border text-sm cursor-pointer transition-all ${isSelected ? "bg-indigo-50 border-indigo-300" : "bg-white hover:bg-gray-50"
                  }`}
              >
                <span className="col-span-1">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleOne(c.Id)}
                    onClick={(e) => e.stopPropagation()}
                    className="rounded cursor-pointer"
                  />
                </span>
                <span className="col-span-2 font-mono text-xs text-gray-700">{c.PaddedNumber || c.Number || "—"}</span>
                <span className="col-span-2 text-xs text-gray-500 truncate" title={c.CustomerAccountFullAccountNumber}>
                  {c.CustomerAccountFullAccountNumber || "—"}
                </span>
                <div className="col-span-2">
                  <p className="font-medium text-gray-800 truncate text-xs">
                    {[c.CustomerAccountCustomerIndividualFirstName, c.CustomerAccountCustomerIndividualLastName]
                      .filter(Boolean).join(" ") || c.Drawer || "—"}
                  </p>
                </div>
                <span className="col-span-1 font-semibold text-indigo-700 text-xs">
                  {c.Amount != null ? c.Amount.toLocaleString() : "—"}
                </span>
                <div className="col-span-4 flex items-center gap-1 flex-wrap">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${c.IsCleared ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}>
                    {c.IsCleared ? "Cleared" : "Not Cleared"}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${c.IsBanked ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-400"}`}>
                    {c.IsBanked ? "Banked" : "Not Banked"}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${c.IsTransferred ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-400"}`}>
                    {c.IsTransferred ? "Transferred" : "Not Transferred"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center mt-10">
          <img src={NotFoundImage} alt="Not Found" className="mx-auto w-32 h-auto" />
          <p className="text-gray-400 mt-2">No transferred cheques available for banking.</p>
        </div>
      )}

      {/* Bank linkage search modal */}
      {openModal === "bankLinkage" && (
        <SearchSelectModal
          {...MODAL_CONFIGS.bankLinkage}
          onSelect={(item) => { handleBankLinkageSelect(item); setOpenModal(null); }}
          onClose={() => setOpenModal(null)}
        />
      )}
    </div>
  );
}
