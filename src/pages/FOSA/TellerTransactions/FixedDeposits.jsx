import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Swal from "sweetalert2";
import NotFoundImage from "/assets/scopefinding.png";
import { FaPiggyBank, FaPlus, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import {
  listFixedDeposits, listPayableFixedDeposits, listRevocableFixedDeposits,
  getFixedDeposit, listFixedDepositPayables, verifyFixedDeposit,
  terminateFixedDeposits, liquidateFixedDeposits,
} from "./fixedDepositsApi";
import { FixedDepositStatus } from "../lib/frontOfficeEnums";

// api/frontoffice/fixeddeposits — docs/api/frontoffice-api-spec.md §11.
const MODULE_NAVIGATION_ITEM_CODE = 25012;

const STATUS_BADGE = {
  Running: "bg-blue-100 text-blue-700",
  Paid: "bg-green-100 text-green-700",
  Revoked: "bg-red-100 text-red-600",
  New: "bg-yellow-100 text-yellow-700",
};

const TABS = [
  { id: "all", label: "All" },
  { id: "payable", label: "Payable" },
  { id: "revocable", label: "Revocable" },
];

function DetailRow({ label, value }) {
  return (
    <div className="flex justify-between text-sm py-1">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-800 font-medium">{value ?? "—"}</span>
    </div>
  );
}

function FixedDepositDetailDrawer({ id, onClose, onChanged }) {
  const [deposit, setDeposit] = useState(null);
  const [loading, setLoading] = useState(false);
  const [payables, setPayables] = useState([]);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getFixedDeposit(id).then(setDeposit).catch(() => setDeposit(null)).finally(() => setLoading(false));
    listFixedDepositPayables(id).then((p) => setPayables(Array.isArray(p) ? p : [])).catch(() => setPayables([]));
  }, [id]);

  if (!id) return null;

  const isNew = deposit?.Status === FixedDepositStatus.New;

  const handleVerify = async (approve) => {
    const confirm = await Swal.fire({
      title: `${approve ? "Post" : "Reject"} this fixed deposit?`,
      icon: "question", showCancelButton: true,
      confirmButtonColor: approve ? "#4f46e5" : "#dc2626",
      confirmButtonText: approve ? "Post" : "Reject",
    });
    if (!confirm.isConfirmed) return;
    setVerifying(true);
    try {
      const updated = await verifyFixedDeposit(id, { Approve: approve, ModuleNavigationItemCode: MODULE_NAVIGATION_ITEM_CODE });
      setDeposit(updated);
      Swal.fire("Success", `Fixed deposit ${approve ? "posted" : "rejected"}`, "success");
      onChanged?.();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 bg-black z-40" initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div className="fixed top-5 right-3 w-[460px] bg-white shadow-xl z-50 flex flex-col rounded-2xl p-3 max-h-[95vh]" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
        <div className="p-4 flex justify-between items-center bg-indigo-600 rounded-2xl m-2 shrink-0">
          <h2 className="font-bold text-lg text-white">Fixed Deposit</h2>
          <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
        </div>
        <div className="p-4 space-y-4 overflow-y-auto flex-1 min-h-0">
          {loading || !deposit ? (
            <p className="text-sm text-gray-400">Loading...</p>
          ) : (
            <>
              <div className="divide-y divide-gray-100 border rounded-lg px-3">
                <DetailRow label="Customer" value={deposit.CustomerAccountCustomerFullName} />
                <DetailRow label="Account" value={deposit.CustomerAccountFullAccountNumber} />
                <DetailRow label="Category" value={deposit.CategoryDescription} />
                <DetailRow label="Maturity Action" value={deposit.MaturityActionDescription} />
                <DetailRow label="Value" value={typeof deposit.Value === "number" ? deposit.Value.toLocaleString() : "—"} />
                <DetailRow label="Term (Months)" value={deposit.Term} />
                <DetailRow label="Rate" value={deposit.Rate ? `${deposit.Rate}%` : "—"} />
                <DetailRow label="Maturity Date" value={deposit.MaturityDate ? new Date(deposit.MaturityDate).toLocaleDateString() : "—"} />
                <DetailRow label="Expected Interest" value={typeof deposit.ExpectedInterest === "number" ? deposit.ExpectedInterest.toLocaleString() : "—"} />
                <DetailRow label="Total Expected" value={typeof deposit.TotalExpected === "number" ? deposit.TotalExpected.toLocaleString() : "—"} />
                <div className="flex justify-between text-sm py-1">
                  <span className="text-gray-500">Status</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${STATUS_BADGE[deposit.StatusDescription] || "bg-gray-100 text-gray-500"}`}>
                    {deposit.StatusDescription || "—"}
                  </span>
                </div>
                {deposit.Remarks && <DetailRow label="Remarks" value={deposit.Remarks} />}
              </div>

              {payables.length > 0 && (
                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-1 block">Payout Accounts</Label>
                  <div className="space-y-1">
                    {payables.map((p) => (
                      <div key={p.Id} className="border border-gray-200 rounded-lg p-2 text-xs space-y-0.5">
                        <p className="font-medium text-gray-700">{p.FullAccountNumber}</p>
                        <p className="text-gray-500">Principal: {p.PrincipalBalance?.toLocaleString?.() ?? "—"} &middot; Interest: {p.InterestBalance?.toLocaleString?.() ?? "—"} &middot; Book: {p.BookBalance?.toLocaleString?.() ?? "—"}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {isNew && (
                <div className="flex gap-2 border-t pt-3">
                  <Button disabled={verifying} onClick={() => handleVerify(true)} className="flex-1 bg-indigo-600 hover:bg-indigo-700">
                    Post
                  </Button>
                  <Button disabled={verifying} onClick={() => handleVerify(false)} className="flex-1 bg-red-600 hover:bg-red-700">
                    Reject
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function FixedDeposits() {
  const [activeTab, setActiveTab] = useState("all");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize] = useState(20);
  const [itemsCount, setItemsCount] = useState(0);
  const [selectedId, setSelectedId] = useState(null);
  const [selected, setSelected] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const fetchItems = () => {
    setLoading(true);
    const fetcher = activeTab === "payable" ? listPayableFixedDeposits : activeTab === "revocable" ? listRevocableFixedDeposits : listFixedDeposits;
    fetcher({ text: search, pageIndex, pageSize })
      .then((page) => {
        setItems(page?.pageCollection || page?.PageCollection || []);
        setItemsCount(page?.itemsCount || page?.ItemsCount || 0);
      })
      .catch(() => { setItems([]); setItemsCount(0); })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchItems();
    setSelected([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, search, pageIndex]);

  const handleSearchChange = (e) => { setSearch(e.target.value); setPageIndex(0); };
  const changeTab = (id) => { setActiveTab(id); setPageIndex(0); };

  const toggleOne = (id) => setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const runBatch = async (action, apiFn, label) => {
    const confirm = await Swal.fire({
      title: `${label} ${selected.length} fixed deposit(s)?`,
      icon: "warning", showCancelButton: true, confirmButtonColor: "#dc2626", confirmButtonText: label,
    });
    if (!confirm.isConfirmed) return;
    setSubmitting(true);
    try {
      await apiFn(selected, MODULE_NAVIGATION_ITEM_CODE);
      Swal.fire("Success", `${label}d successfully`, "success");
      setSelected([]);
      fetchItems();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const hasNextPage = itemsCount ? (pageIndex + 1) * pageSize < itemsCount : items.length === pageSize;

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
      <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FaPiggyBank /> Fixed Deposits
        </h2>
        <Link
          to="/FrontOffice/FixedDeposits/create"
          className="inline-flex items-center gap-2 rounded-md bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-sm font-medium text-white"
        >
          <FaPlus /> New Fixed Deposit
        </Link>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex gap-1 border-b border-gray-200">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => changeTab(tab.id)}
              className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-all ${activeTab === tab.id ? "bg-indigo-600 text-white" : "text-gray-500 hover:bg-indigo-50"}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <Input value={search} onChange={handleSearchChange} placeholder="Search..." className="max-w-xs" />
      </div>

      {(activeTab === "payable" || activeTab === "revocable") && selected.length > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-4 flex items-center justify-between">
          <p className="text-sm font-semibold text-indigo-700">{selected.length} selected</p>
          {activeTab === "payable" ? (
            <Button disabled={submitting} onClick={() => runBatch("liquidate", liquidateFixedDeposits, "Liquidate")} className="bg-indigo-600 hover:bg-indigo-700">
              Liquidate Selected
            </Button>
          ) : (
            <Button disabled={submitting} onClick={() => runBatch("terminate", terminateFixedDeposits, "Terminate")} className="bg-red-600 hover:bg-red-700">
              Terminate Selected
            </Button>
          )}
        </div>
      )}

      <div className="bg-gray-200 p-4 rounded-sm">
        <div className="grid grid-cols-12 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4">
          {activeTab !== "all" && <span className="col-span-1"></span>}
          <span className={activeTab !== "all" ? "col-span-3" : "col-span-4"}>Customer</span>
          <span className="col-span-2">Value</span>
          <span className="col-span-2">Term</span>
          <span className="col-span-2">Maturity Date</span>
          <span className={activeTab !== "all" ? "col-span-2" : "col-span-2"}>Status</span>
        </div>

        {loading ? (
          <div className="space-y-2 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="grid grid-cols-12 gap-2 bg-gray-50 p-6 rounded">
                {Array.from({ length: 12 }).map((_, j) => <div key={j} className="h-4 bg-gray-200 rounded"></div>)}
              </div>
            ))}
          </div>
        ) : items.length > 0 ? (
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.Id} className="bg-white rounded-lg shadow-lg border">
                <div className="grid grid-cols-12 gap-2 items-center py-4 px-6 hover:shadow-xl transition-all">
                  {activeTab !== "all" && (
                    <span className="col-span-1">
                      <input type="checkbox" checked={selected.includes(item.Id)} onChange={() => toggleOne(item.Id)} className="w-4 h-4 accent-indigo-600" />
                    </span>
                  )}
                  <button onClick={() => setSelectedId(item.Id)} className={`text-left font-medium text-indigo-700 truncate ${activeTab !== "all" ? "col-span-3" : "col-span-4"}`}>
                    {item.CustomerAccountCustomerFullName || "—"}
                  </button>
                  <span className="col-span-2 text-sm text-gray-700">{typeof item.Value === "number" ? item.Value.toLocaleString() : "—"}</span>
                  <span className="col-span-2 text-sm text-gray-700">{item.Term} mo</span>
                  <span className="col-span-2 text-xs text-gray-500">{item.MaturityDate ? new Date(item.MaturityDate).toLocaleDateString() : "—"}</span>
                  <span className="col-span-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${STATUS_BADGE[item.StatusDescription] || "bg-gray-100 text-gray-500"}`}>
                      {item.StatusDescription || "—"}
                    </span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-center mt-4">
            <img src={NotFoundImage} alt="Not Found" className="mx-auto w-42" />
            <p className="font-medium text-gray-400">No fixed deposits found.</p>
          </div>
        )}

        <div className="flex justify-center items-center mt-4">
          <Button type="button" size="sm" disabled={pageIndex === 0} onClick={() => setPageIndex((p) => Math.max(0, p - 1))} className="flex items-center gap-1 m-2">
            <FaChevronLeft /> Prev
          </Button>
          <span>Page {pageIndex + 1}</span>
          <Button type="button" size="sm" disabled={!hasNextPage} onClick={() => setPageIndex((p) => p + 1)} className="flex items-center gap-1 m-2">
            Next <FaChevronRight />
          </Button>
        </div>
      </div>

      {selectedId && (
        <FixedDepositDetailDrawer id={selectedId} onClose={() => setSelectedId(null)} onChanged={fetchItems} />
      )}
    </div>
  );
}
