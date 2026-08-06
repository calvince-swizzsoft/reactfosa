import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Swal from "sweetalert2";
import NotFoundImage from "/assets/scopefinding.png";
import { FaExchangeAlt } from "react-icons/fa";
import { apiFetch, normalizeList } from "@/lib/api";

const BASE = `${import.meta.env.VITE_APP_FIN_URL}`;

const STATUS_TABS = [
  { id: "pending", label: "Pending Transfer" },
  { id: "transferred", label: "Transferred" },
];

export default function ChequeTransfer() {
  const [cheques, setCheques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [transferring, setTransferring] = useState(false);
  const [activeTab, setActiveTab] = useState("pending");

  const fetchCheques = () => {
    setLoading(true);
    setSelected([]);
    // ChequesController.Index (GET /api/frontoffice/cheques) is paged and
    // enveloped ({ success, message, data: PageCollectionInfo }), not the
    // bare array this used to assume — was also missing the /frontoffice
    // segment entirely, so this call 404'd before.
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
      const payload = selected
        .map((id) => cheques.find((c) => c.Id === id))
        .filter(Boolean)
        .map((c) => ({
          Id: c.Id,
          TellerId: c.TellerId,
          TellerDescription: c.TellerDescription,
        }));

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
    <div>
      {/* Tabs + Transfer button */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-1 border-b border-gray-200">
          {STATUS_TABS.map((tab) => {
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

      {/* Table header */}
      <div className="grid grid-cols-12 gap-2 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-3 text-sm">
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

      {/* Rows */}
      {loading ? (
        <div className="space-y-2 animate-pulse">
          {[1, 2, 3].map((i) => <div key={i} className="h-12 bg-gray-100 rounded-lg" />)}
        </div>
      ) : filtered.length > 0 ? (
        <div className="space-y-2">
          {filtered.map((c) => {
            const isChecked = selected.includes(c.Id);
            return (
              <div
                key={c.Id}
                className={`grid grid-cols-12 gap-2 items-center px-4 py-3 rounded-lg shadow border text-sm transition-colors ${isChecked ? "bg-indigo-50 border-indigo-300" : "bg-white"
                  }`}
              >
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
            );
          })}
        </div>
      ) : (
        <div className="text-center mt-6">
          <img src={NotFoundImage} alt="Not Found" className="mx-auto w-32 h-auto" />
          <p className="text-gray-400 mt-2">
            No <span className="font-medium">{activeTab === "transferred" ? "transferred" : "pending"}</span> cheques found.
          </p>
        </div>
      )}
    </div>
  );
}
