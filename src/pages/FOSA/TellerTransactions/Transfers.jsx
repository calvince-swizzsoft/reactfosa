import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FaEllipsisV, FaCheckCircle, FaTimesCircle, FaPaperPlane, FaExchangeAlt } from "react-icons/fa";
import Swal from "sweetalert2";
import NotFoundImage from "/assets/scopefinding.png";
import { apiFetch, normalizeList } from "@/lib/api";
import DenominationCountFields, {
  emptyDenominationCounts,
  sumDenominations,
  toDenominationSubtotals,
} from "../lib/DenominationCountFields";

// api/frontoffice/transfers — docs/api/frontoffice-api-spec.md §7.
// NavigationMenu.cs has exactly one real nav slot for this whole area
// (0x000061A8+9, Description "Cheques/Cash Transfer", ControllerName
// "Transfers") — no separate code exists for Cash vs. Cheque Transfer,
// even though POST /cash (CashTransferRequestDTO — amount + denomination
// breakdown + balance status) and POST /cheques (bare
// List<ExternalChequeDTO>, just {Id, TellerId, TellerDescription} per
// cheque) are genuinely different request shapes against the same
// controller. Unified into one screen behind a top-level tab, same
// precedent as SavingsReceiptsPayments.jsx absorbing 4 separate
// Phase-1 screens for the same reason (single real nav item, multiple
// underlying operations). Previously two separate, unrelated top-level
// routes (CashTransfer.jsx/ChequeTransfer.jsx) — ChequeTransfer.jsx was
// never reachable from the real dynamic sidebar nav as a result, only
// from this app's own launcher hub.

const BASE = `${import.meta.env.VITE_APP_FIN_URL}`;

/* ══════════════════════════ Cash Transfer ══════════════════════════ */

// TellerCashBalanceStatus enum: Balanced=0x5000(20480), Shortage=20481, Excess=20482
const BALANCE_STATUS_OPTIONS = [
  { value: 20480, label: "Balanced" },
  { value: 20481, label: "Shortage" },
  { value: 20482, label: "Excess" },
];

function SkeletonRow() {
  return (
    <div className="grid grid-cols-10 gap-2 items-center bg-white px-4 py-3 rounded-lg shadow border animate-pulse">
      <div className="col-span-3"><div className="h-3 bg-gray-200 rounded w-44" /></div>
      <div className="col-span-2"><div className="h-4 bg-indigo-100 rounded w-20" /></div>
      <div className="col-span-2 flex flex-col gap-1">
        <div className="h-4 bg-gray-200 rounded w-24" />
        <div className="h-3 bg-gray-100 rounded w-16" />
      </div>
      <div className="col-span-2"><div className="h-3 bg-gray-200 rounded w-28" /></div>
      <div className="col-span-1"><div className="h-8 w-8 bg-gray-100 rounded" /></div>
    </div>
  );
}

const emptyCashForm = {
  TotalDebits: "",
  TotalCredits: "",
  OpeningBalance: "0",
  TellerCashBalanceStatus: "20480",
};

function FieldGroup({ label, children }) {
  return (
    <div>
      <Label className="text-sm font-semibold text-gray-700">{label}</Label>
      {children}
    </div>
  );
}

function AddCashTransferDrawer({ open, onClose, onSuccess }) {
  const [form, setForm] = useState(emptyCashForm);
  const [counts, setCounts] = useState(emptyDenominationCounts);
  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) => setForm((p) => ({ ...p, [field]: value }));
  const handleCountChange = (key, value) => setCounts((p) => ({ ...p, [key]: value }));
  const amount = sumDenominations(counts);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (amount <= 0) {
      Swal.fire("Missing Amount", "Enter a denomination count first.", "warning");
      return;
    }
    setLoading(true);
    try {
      // EmployeeId is overwritten server-side from the caller's JWT
      // regardless of what's sent (TransfersController.Create) — not a
      // client-supplied field.
      const payload = {
        TotalDebits: Number(form.TotalDebits),
        TotalCredits: Number(form.TotalCredits),
        // Amount is derived from the counted denominations, not entered
        // separately — the server now requires the 11 Denomination*Value
        // fields to reconcile exactly against Amount
        // (DENOMINATION-CAPTURE-FRONTEND-GUIDE.md), so deriving it here
        // guarantees that by construction instead of risking a 400 from a
        // teller-entered figure that doesn't match their count.
        Amount: amount,
        OpeningBalance: String(form.OpeningBalance),
        // TellerCashBalanceStatus (no suffix) is a read-only computed
        // description string on the real CashTransferRequestDTO — it has
        // no setter, so sending it here is silently discarded.
        // TellerCashBalanceStatusValue (int) is the actual settable field,
        // confirmed against the real DTO source.
        TellerCashBalanceStatusValue: Number(form.TellerCashBalanceStatus),
        ...toDenominationSubtotals(counts),
      };
      const res = await apiFetch(`${BASE}/api/frontoffice/transfers/cash`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Failed to create cash transfer");
      data.success === false
        ? Swal.fire("Error", data.message || "Cash transfer creation failed", "error")
        : Swal.fire("Success", data.message || "Cash transfer created successfully", "success");
      setForm(emptyCashForm);
      setCounts(emptyDenominationCounts);
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
          <motion.div
            className="fixed inset-0 bg-black z-40"
            initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed top-5 right-3 w-[480px] bg-white shadow-xl z-50 flex flex-col rounded-2xl p-3 max-h-[95vh] overflow-y-auto"
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="p-4 flex justify-between items-center bg-indigo-600 rounded-2xl m-2">
              <h2 className="font-bold text-lg text-white">New Cash Transfer</h2>
              <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <FieldGroup label="Count the Cash Being Transferred">
                <DenominationCountFields counts={counts} onChange={handleCountChange} />
              </FieldGroup>
              <FieldGroup label="Total Debits">
                <Input
                  type="number"
                  value={form.TotalDebits}
                  onChange={(e) => handleChange("TotalDebits", e.target.value)}
                  placeholder="300"
                  required
                />
              </FieldGroup>
              <FieldGroup label="Total Credits">
                <Input
                  type="number"
                  value={form.TotalCredits}
                  onChange={(e) => handleChange("TotalCredits", e.target.value)}
                  placeholder="400"
                  required
                />
              </FieldGroup>
              <FieldGroup label="Opening Balance">
                <Input
                  type="number"
                  value={form.OpeningBalance}
                  onChange={(e) => handleChange("OpeningBalance", e.target.value)}
                  placeholder="0"
                />
              </FieldGroup>
              <FieldGroup label="Balance Status">
                <Select
                  value={String(form.TellerCashBalanceStatus)}
                  onValueChange={(v) => handleChange("TellerCashBalanceStatus", v)}
                >
                  <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                  <SelectContent>
                    {BALANCE_STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s.value} value={String(s.value)}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldGroup>
              <Button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700">
                {loading ? "Saving..." : "Submit Cash Transfer"}
              </Button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

const CASH_STATUS_TABS = [
  { id: "Pending", label: "Pending", color: "text-yellow-600" },
  { id: "Acknowledged", label: "Acknowledged", color: "text-green-600" },
  { id: "Utilized", label: "Utilized", color: "text-blue-600" },
  { id: "Rejected", label: "Rejected", color: "text-red-600" },
];

// Status enum: Pending=1, Acknowledged=2, Rejected=3, Utilized=4
const CASH_STATUS_MAP = { 1: "Pending", 2: "Acknowledged", 3: "Rejected", 4: "Utilized" };
function getCashTransferStatus(t) {
  return CASH_STATUS_MAP[t.Status] ?? "Pending";
}

function CashTransferPanel() {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Pending");

  const fetchTransfers = () => {
    setLoading(true);
    // TransfersController.GetCashTransferRequests returns the array bare
    // (no { success, message, data } envelope, unlike most of this API).
    apiFetch(`${BASE}/api/frontoffice/transfers/cash`)
      .then((r) => r.json())
      .then((d) => setTransfers(Array.isArray(d) ? d : []))
      .catch(() => setTransfers([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTransfers(); }, []);

  const handleAcknowledge = async (item) => {
    const confirm = await Swal.fire({
      title: "Acknowledge Transfer?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#4f46e5",
      confirmButtonText: "Acknowledge",
    });
    if (!confirm.isConfirmed) return;
    try {
      const res = await apiFetch(`${BASE}/api/frontoffice/transfers/cash/acknowledge?option=2`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Id: item.Id,
          TotalDebits: item.TotalDebits ?? 0,
          TotalCredits: item.TotalCredits ?? 0,
          Amount: item.Amount,
          OpeningBalance: item.OpeningBalance ?? 0,
          TellerCashBalanceStatusValue: item.TellerCashBalanceStatusValue,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error("Acknowledgement failed");
      if (data.success === false) {
        Swal.fire("Error", data.message, "error");
      } else {
        Swal.fire("Acknowledged!", data.message, "success");
      }
      fetchTransfers();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  };

  const handleReject = async (item) => {
    const confirm = await Swal.fire({
      title: "Reject Transfer?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      confirmButtonText: "Reject",
    });
    if (!confirm.isConfirmed) return;
    try {
      const res = await apiFetch(`${BASE}/api/frontoffice/transfers/cash/acknowledge?option=3`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Id: item.Id,
          TotalDebits: item.TotalDebits ?? 0,
          TotalCredits: item.TotalCredits ?? 0,
          Amount: item.Amount,
          OpeningBalance: item.OpeningBalance ?? 0,
          TellerCashBalanceStatusValue: item.TellerCashBalanceStatusValue,
        }),
      });
      if (!res.ok) throw new Error("Rejection failed");
      Swal.fire("Rejected!", "Transfer has been rejected.", "success");
      fetchTransfers();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  };

  const handleUtilize = async (id) => {
    const confirm = await Swal.fire({
      title: "Utilize Transfer?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#4f46e5",
      confirmButtonText: "Utilize",
    });
    if (!confirm.isConfirmed) return;
    try {
      const res = await apiFetch(`${BASE}/api/frontoffice/transfers/cash/utilize?request=${id}`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Utilization failed");
      Swal.fire("Utilized!", "Transfer has been utilized.", "success");
      fetchTransfers();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  };

  const filteredTransfers = transfers.filter((t) => getCashTransferStatus(t) === activeTab);
  const countFor = (status) => transfers.filter((t) => getCashTransferStatus(t) === status).length;

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-1 border-b border-gray-200">
          {CASH_STATUS_TABS.map((tab) => {
            const count = countFor(tab.id);
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-t-lg transition-all ${activeTab === tab.id
                  ? "bg-indigo-600 text-white border-b-2 border-indigo-600"
                  : `text-gray-500 hover:${tab.color} hover:bg-indigo-50`
                  }`}
              >
                {tab.label}
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${activeTab === tab.id ? "bg-white text-indigo-600" : "bg-gray-200 text-gray-600"
                    }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
        <Button onClick={() => setAddOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
          + New Cash Transfer
        </Button>
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-400 mb-3 px-1">
        <span className="font-medium text-yellow-600">Pending</span>
        <span>→</span>
        <span className="font-medium text-green-600">Acknowledged</span>
        <span>→</span>
        <span className="font-medium text-blue-600">Utilized</span>
        <span className="mx-1 text-gray-300">|</span>
        <span className="font-medium text-red-500">Rejected</span>
      </div>

      <div className="bg-gray-200 p-4 rounded-sm">
        <div className="grid grid-cols-10 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4 text-sm">
          <span className="col-span-3">Transfer ID</span>
          <span className="col-span-2">Amount</span>
          <span className="col-span-2">Acknowledged By</span>
          <span className="col-span-2">Acknowledged Date</span>
          <span className="col-span-1 text-right">
            {activeTab === "Pending" || activeTab === "Acknowledged" ? "Actions" : ""}
          </span>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => <SkeletonRow key={i} />)}
          </div>
        ) : filteredTransfers.length > 0 ? (
          <div className="space-y-2">
            {filteredTransfers.map((t) => (
              <div key={t.Id} className="bg-white rounded-lg shadow-lg border">
                <div className="grid grid-cols-10 gap-2 items-center py-4 px-6 hover:shadow-xl transition-all text-sm">
                  <span className="col-span-3 font-mono text-xs text-gray-500 truncate" title={t.Id}>
                    {t.Id}
                  </span>
                  <span className="col-span-2 font-semibold text-indigo-700">
                    {t.Amount != null ? t.Amount.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "—"}
                  </span>
                  <div className="col-span-2">
                    <p className="text-gray-700 text-xs font-medium">{t.AcknowledgedBy || "—"}</p>
                  </div>
                  <span className="col-span-2 text-xs text-gray-400">
                    {t.AcknowledgedDate ? new Date(t.AcknowledgedDate).toLocaleString() : "—"}
                  </span>
                  <div className="col-span-1 flex justify-end">
                    {activeTab === "Pending" && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <FaEllipsisV className="text-gray-500" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleAcknowledge(t)}>
                            <FaCheckCircle className="mr-2 text-green-600" /> Acknowledge
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleReject(t)}>
                            <FaTimesCircle className="mr-2 text-red-600" /> Reject
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                    {activeTab === "Acknowledged" && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <FaEllipsisV className="text-gray-500" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleUtilize(t.Id)}>
                            <FaPaperPlane className="mr-2 text-blue-600" /> Utilize
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-center mt-4">
            <img src={NotFoundImage} alt="Not Found" className="mx-auto w-42" />
            <p className="font-medium text-gray-400">
              No <span className="font-medium">{activeTab.toLowerCase()}</span> cash transfer records found.
            </p>
          </div>
        )}
      </div>

      <AddCashTransferDrawer open={addOpen} onClose={() => setAddOpen(false)} onSuccess={fetchTransfers} />
    </>
  );
}

/* ══════════════════════════ Cheque Transfer ══════════════════════════ */

const CHEQUE_STATUS_TABS = [
  { id: "pending", label: "Pending Transfer" },
  { id: "transferred", label: "Transferred" },
];

function ChequeTransferPanel() {
  const [cheques, setCheques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [transferring, setTransferring] = useState(false);
  const [activeTab, setActiveTab] = useState("pending");

  const fetchCheques = () => {
    setLoading(true);
    setSelected([]);
    // ChequesController.Index (GET /api/frontoffice/cheques) is paged and
    // enveloped ({ success, message, data: PageCollectionInfo }).
    apiFetch(`${BASE}/api/frontoffice/cheques?pageSize=1000`)
      .then((r) => r.json())
      .then((d) => setCheques(normalizeList(d)))
      .catch(() => setCheques([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCheques(); }, []);

  const filtered = cheques.filter((c) =>
    activeTab === "transferred" ? c.IsTransferred : !c.IsTransferred
  );

  const countFor = (tab) =>
    cheques.filter((c) => tab === "transferred" ? c.IsTransferred : !c.IsTransferred).length;

  const allSelected = filtered.length > 0 && filtered.every((c) => selected.includes(c.Id));

  const toggleAll = () => {
    if (allSelected) {
      setSelected((prev) => prev.filter((id) => !filtered.some((c) => c.Id === id)));
    } else {
      setSelected((prev) => [...new Set([...prev, ...filtered.map((c) => c.Id)])]);
    }
  };

  const toggleOne = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleTransfer = async () => {
    if (selected.length === 0) {
      Swal.fire("No Selection", "Please select at least one cheque to transfer.", "warning");
      return;
    }

    const confirm = await Swal.fire({
      title: `Transfer ${selected.length} cheque${selected.length > 1 ? "s" : ""}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#4f46e5",
      confirmButtonText: "Transfer",
    });
    if (!confirm.isConfirmed) return;

    setTransferring(true);
    try {
      // Bare array body — TransfersController.TransferSelectedChequesAsync
      // binds List<ExternalChequeDTO> directly, no wrapper object.
      // ExternalChequeAppService.TransferExternalCheques re-fetches each
      // cheque by Id and posts the transfer journal using the PERSISTED
      // record's own Amount/Number (not whatever the client sends for
      // those fields), and only transfers cheques that actually belong to
      // the requesting teller — confirmed against the current app service
      // source. Id is the only field this endpoint actually needs from the
      // client; everything else about the cheque is resolved server-side.
      const payload = selected
        .map((id) => cheques.find((c) => c.Id === id))
        .filter(Boolean)
        .map((c) => ({ Id: c.Id }));

      const res = await apiFetch(`${BASE}/api/frontoffice/transfers/cheques`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(data.message || "Transfer failed");

      data.success === false
        ? Swal.fire("Error", data.message || "Transfer failed", "error")
        : Swal.fire("Success", data.message || "Cheques transferred successfully", "success");

      fetchCheques();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setTransferring(false);
    }
  };

  const selectedInTab = selected.filter((id) => filtered.some((c) => c.Id === id));

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-1 border-b border-gray-200">
          {CHEQUE_STATUS_TABS.map((tab) => {
            const count = countFor(tab.id);
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSelected([]); }}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-t-lg transition-all ${activeTab === tab.id
                  ? "bg-indigo-600 text-white border-b-2 border-indigo-600"
                  : "text-gray-500 hover:bg-indigo-50"
                  }`}
              >
                {tab.label}
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${activeTab === tab.id ? "bg-white text-indigo-600" : "bg-gray-200 text-gray-600"
                    }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {activeTab === "pending" && (
          <Button
            onClick={handleTransfer}
            disabled={transferring || selectedInTab.length === 0}
            className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2"
          >
            <FaExchangeAlt />
            {transferring ? "Transferring..." : `Transfer${selectedInTab.length > 0 ? ` (${selectedInTab.length})` : ""}`}
          </Button>
        )}
      </div>

      <div className="bg-gray-200 p-4 rounded-sm">
        <div className="grid grid-cols-12 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4 text-sm">
          {activeTab === "pending" && (
            <div className="col-span-1 flex items-center">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                className="accent-indigo-500 w-4 h-4 cursor-pointer"
              />
            </div>
          )}
          <span className={activeTab === "pending" ? "col-span-2" : "col-span-3"}>Cheque No.</span>
          <span className="col-span-2">Amount</span>
          <span className="col-span-2">Drawer</span>
          <span className="col-span-2">Bank</span>
          <span className="col-span-2">Write Date</span>
          <span className="col-span-1 text-right">Status</span>
        </div>

        {loading ? (
          <div className="space-y-2 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="grid grid-cols-12 gap-2 bg-gray-50 p-6 rounded">
                {Array.from({ length: 12 }).map((_, j) => <div key={j} className="h-4 bg-gray-200 rounded"></div>)}
              </div>
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="space-y-2">
            {filtered.map((c) => {
              const isChecked = selected.includes(c.Id);
              return (
                <div
                  key={c.Id}
                  className={`rounded-lg shadow-lg border transition-all ${isChecked ? "bg-indigo-50 border-indigo-300" : "bg-white hover:shadow-xl"
                    }`}
                >
                  <div className="grid grid-cols-12 gap-2 items-center py-4 px-6 text-sm">
                    {activeTab === "pending" && (
                      <div className="col-span-1">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleOne(c.Id)}
                          className="accent-indigo-500 w-4 h-4 cursor-pointer"
                        />
                      </div>
                    )}
                    <span className={`font-mono font-semibold text-indigo-700 ${activeTab === "pending" ? "col-span-2" : "col-span-3"}`}>
                      {c.PaddedNumber || c.Number || "—"}
                    </span>
                    <span className="col-span-2 font-medium text-gray-800">
                      {c.Amount != null ? c.Amount.toLocaleString() : "—"}
                    </span>
                    <span className="col-span-2 text-gray-700 truncate">{c.Drawer || "—"}</span>
                    <span className="col-span-2 text-gray-500 truncate">{c.DrawerBank || "—"}</span>
                    <span className="col-span-2 text-xs text-gray-400">
                      {c.WriteDate ? new Date(c.WriteDate).toLocaleDateString() : "—"}
                    </span>
                    <div className="col-span-1 flex justify-end">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-semibold ${c.IsTransferred
                          ? "bg-blue-100 text-blue-700"
                          : "bg-yellow-100 text-yellow-700"
                          }`}
                      >
                        {c.IsTransferred ? "Transferred" : "Pending"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-gray-500 text-center mt-4">
            <img src={NotFoundImage} alt="Not Found" className="mx-auto w-42" />
            <p className="font-medium text-gray-400">
              No <span className="font-medium">{activeTab === "transferred" ? "transferred" : "pending"}</span> cheques found.
            </p>
          </div>
        )}
      </div>
    </>
  );
}

/* ══════════════════════════ Unified screen ══════════════════════════ */

const MODE_TABS = [
  { id: "cash", label: "Cash Transfer" },
  { id: "cheque", label: "Cheque Transfer" },
];

export default function Transfers() {
  const [mode, setMode] = useState("cash");

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
      <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FaExchangeAlt /> Cheques/Cash Transfer
        </h2>
      </div>

      <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1 w-fit">
        {MODE_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setMode(tab.id)}
            className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all ${mode === tab.id ? "bg-white shadow text-indigo-700" : "text-gray-500 hover:text-indigo-600"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {mode === "cash" ? <CashTransferPanel /> : <ChequeTransferPanel />}
    </div>
  );
}
