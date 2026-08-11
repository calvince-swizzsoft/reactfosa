import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import Swal from "sweetalert2";
import NotFoundImage from "/assets/scopefinding.png";
import { FaCheckDouble } from "react-icons/fa";
import { apiFetch, normalizeList } from "@/lib/api";

const BASE = `${import.meta.env.VITE_APP_FIN_URL}`

// ExternalChequeClearanceOption: Pay=1, UnPay=2
const CLEARING_OPTIONS = [
  { value: 1, label: "Pay" },
  { value: 2, label: "UnPay" },
];

function SkeletonRow() {
  return (
    <div className="grid grid-cols-12 gap-2 items-center bg-white px-4 py-3 rounded-lg shadow border animate-pulse">
      <div className="col-span-1"><div className="h-4 w-4 bg-gray-200 rounded" /></div>
      <div className="col-span-2"><div className="h-3 bg-gray-200 rounded w-16" /></div>
      <div className="col-span-2"><div className="h-3 bg-gray-200 rounded w-28" /></div>
      <div className="col-span-3 flex flex-col gap-1">
        <div className="h-4 bg-gray-200 rounded w-28" />
      </div>
      <div className="col-span-2"><div className="h-4 bg-indigo-100 rounded w-20" /></div>
      <div className="col-span-2"><div className="h-5 bg-gray-200 rounded-full w-16" /></div>
    </div>
  );
}

export default function ClearCheques() {
  const [cheques, setCheques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [clearingOption, setClearingOption] = useState(1);
  const [unpayReasons, setUnpayReasons] = useState([]);
  const [selectedReasonId, setSelectedReasonId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      // Was missing /frontoffice and assumed a bare array — ChequesController's
      // GET / is paged and enveloped ({ success, message, data: PageCollectionInfo }).
      apiFetch(`${BASE}/api/frontoffice/cheques?pageSize=1000`).then((r) => r.json()),
      // /api/unpay isn't documented in frontoffice-api-spec.md at all — left
      // as-is (see TODO.md) rather than guessing a real path for it.
      apiFetch(`${BASE}/api/unpay`).then((r) => r.json()),
    ])
      .then(([chequeData, reasonData]) => {
        setCheques(normalizeList(chequeData));
        setUnpayReasons(Array.isArray(reasonData) ? reasonData : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Clearing (either Pay or UnPay) now requires IsTransferred && IsBanked —
  // the candidate list this screen's own GET isn't filtered on IsBanked
  // server-side, so ineligible cheques would otherwise select fine and only
  // fail on submit with "Failed to clear cheque" (frontoffice-api-spec.md
  // §8). Gate selection here instead of letting the user hit that error.
  const clearableCheques = cheques.filter((c) => c.IsTransferred && c.IsBanked);
  const clearableIds = new Set(clearableCheques.map((c) => c.Id));

  const allSelected = clearableCheques.length > 0 && selected.length === clearableCheques.length;
  const toggleAll = () => setSelected(allSelected ? [] : clearableCheques.map((c) => c.Id));
  const toggleOne = (id) => {
    if (!clearableIds.has(id)) return;
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const handleOptionChange = (val) => {
    setClearingOption(val);
    setSelectedReasonId("");
  };

  const handleSubmit = async () => {
    if (selected.length === 0) return Swal.fire("Warning", "Select at least one cheque.", "warning");
    if (clearingOption === 2 && !selectedReasonId) {
      return Swal.fire("Warning", "Select an unpay reason.", "warning");
    }
    const label = clearingOption === 1 ? "Pay" : "UnPay";
    const confirm = await Swal.fire({
      title: `${label} ${selected.length} cheque(s)?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: clearingOption === 1 ? "#4f46e5" : "#dc2626",
      confirmButtonText: label,
    });
    if (!confirm.isConfirmed) return;
    setSubmitting(true);
    try {
      const reason = unpayReasons.find((r) => r.Id === selectedReasonId);
      // clearingOption and actionType must agree — the server doesn't
      // derive one from the other, a mismatched pair silently takes
      // whichever branch clearingOption selects (frontoffice-api-spec.md
      // §8, CHEQUE-PROCESSING-ANALYSIS.md Finding #5). Pay=1 with "clear",
      // UnPay=2 with "unpay".
      const payload = {
        selectedChequeIds: selected,
        clearingOption,
        actionType: clearingOption === 1 ? "clear" : "unpay",
        unPayReasonDTO: clearingOption === 2 && reason
          ? { Id: reason.Id, Code: reason.Code, Description: reason.Description }
          : {},
      };
      const res = await apiFetch(`${BASE}/api/frontoffice/cheques/clear`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) throw new Error(data.message || "Clearing failed");
      Swal.fire("Success", data.message || `Cheques ${label.toLowerCase()}ed successfully.`, "success");
      setSelected([]);
      setSelectedReasonId("");
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
      <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FaCheckDouble /> Clear Cheques
        </h2>
      </div>

      {/* Action panel — appears when cheques are selected */}
      {selected.length > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-4 flex flex-wrap items-end gap-4">
          <p className="text-sm font-semibold text-indigo-700 w-full">
            {selected.length} cheque(s) selected
          </p>

          {/* Pay / UnPay radio */}
          <div className="flex items-center gap-6">
            {CLEARING_OPTIONS.map((opt) => (
              <label key={opt.value} className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700">
                <input
                  type="radio"
                  name="clearingOption"
                  value={opt.value}
                  checked={clearingOption === opt.value}
                  onChange={() => handleOptionChange(opt.value)}
                  className="accent-indigo-600"
                />
                {opt.label}
              </label>
            ))}
          </div>

          {/* Unpay reason — only for UnPay */}
          {clearingOption === 2 && (
            <div className="min-w-[220px]">
              <Label className="text-xs font-semibold text-gray-600 mb-1 block">Unpay Reason</Label>
              <Select value={selectedReasonId} onValueChange={setSelectedReasonId}>
                <SelectTrigger><SelectValue placeholder="Select reason" /></SelectTrigger>
                <SelectContent>
                  {unpayReasons.map((r) => (
                    <SelectItem key={r.Id} value={r.Id}>{r.Description}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className={clearingOption === 1
              ? "bg-indigo-600 hover:bg-indigo-700"
              : "bg-red-600 hover:bg-red-700"}
          >
            {submitting
              ? "Processing..."
              : `${clearingOption === 1 ? "Pay" : "UnPay"} ${selected.length} Cheque(s)`}
          </Button>
        </div>
      )}

      <div className="bg-gray-200 p-4 rounded-sm">
        <div className="grid grid-cols-12 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4 text-sm">
          <span className="col-span-1">
            <input type="checkbox" checked={allSelected} onChange={toggleAll} className="rounded cursor-pointer" />
          </span>
          <span className="col-span-2">Cheque #</span>
          <span className="col-span-2">Account</span>
          <span className="col-span-3">Customer</span>
          <span className="col-span-2">Amount</span>
          <span className="col-span-2">Status</span>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => <SkeletonRow key={i} />)}
          </div>
        ) : cheques.length > 0 ? (
          <div className="space-y-2">
            {cheques.map((c) => {
              const isSelected = selected.includes(c.Id);
              const isClearable = clearableIds.has(c.Id);
              const statusLabel = c.IsCleared ? "Cleared" : c.IsBanked ? "Banked" : c.IsTransferred ? "Transferred" : "Pending";
              const statusCls = {
                Cleared: "bg-green-100 text-green-700",
                Banked: "bg-blue-100 text-blue-700",
                Transferred: "bg-purple-100 text-purple-700",
                Pending: "bg-yellow-100 text-yellow-700",
              }[statusLabel];
              return (
                <div
                  key={c.Id}
                  onClick={() => toggleOne(c.Id)}
                  title={isClearable ? undefined : "Must be transferred and banked before it can be cleared or unpaid"}
                  className={`rounded-lg shadow-lg border transition-all ${
                    !isClearable ? "bg-gray-50 opacity-60 cursor-not-allowed" : isSelected ? "bg-indigo-50 border-indigo-300 cursor-pointer" : "bg-white hover:shadow-xl cursor-pointer"
                  }`}
                >
                  <div className="grid grid-cols-12 gap-2 items-center py-4 px-6 text-sm">
                    <span className="col-span-1">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={!isClearable}
                        onChange={() => toggleOne(c.Id)}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded cursor-pointer disabled:cursor-not-allowed"
                      />
                    </span>
                    <span className="col-span-2 font-mono text-xs text-gray-700">{c.PaddedNumber || c.Number || "—"}</span>
                    <span className="col-span-2 text-xs text-gray-500 truncate" title={c.CustomerAccountFullAccountNumber}>
                      {c.CustomerAccountFullAccountNumber || "—"}
                    </span>
                    <div className="col-span-3">
                      <p className="font-medium text-gray-800 truncate">
                        {[c.CustomerAccountCustomerIndividualFirstName, c.CustomerAccountCustomerIndividualLastName]
                          .filter(Boolean).join(" ") || c.Drawer || "—"}
                      </p>
                    </div>
                    <span className="col-span-2 font-semibold text-indigo-700">
                      {c.Amount != null ? c.Amount.toLocaleString() : "—"}
                    </span>
                    <span className="col-span-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusCls}`}>{statusLabel}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-gray-500 text-center mt-4">
            <img src={NotFoundImage} alt="Not Found" className="mx-auto w-42" />
            <p className="font-medium text-gray-400">No cheques available.</p>
          </div>
        )}
      </div>
    </div>
  );
}
