import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";
import { FaClipboardCheck, FaSearch } from "react-icons/fa";
import NotFoundImage from "/assets/scopefinding.png";
import { listAlternateChannelsPaged, approveAlternateChannel, rejectAlternateChannel } from "./api";
import { RecordStatus } from "./lib/alternateChannelEnums";
import { apiErrorMessage } from "@/lib/api";

function StatusBadge({ status }) {
  const meta = {
    0: { label: "New", cls: "bg-gray-100 text-gray-600" },
    1: { label: "Edited", cls: "bg-blue-100 text-blue-600" },
    2: { label: "Approved", cls: "bg-green-100 text-green-600" },
    3: { label: "Rejected", cls: "bg-red-100 text-red-600" },
  }[status] || { label: "Unknown", cls: "bg-gray-100 text-gray-600" };
  return <span className={`px-2 py-1 rounded text-xs font-semibold ${meta.cls}`}>{meta.label}</span>;
}

function ReviewDrawer({ channel, onClose, onChanged }) {
  const [remarks, setRemarks] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { setRemarks(""); }, [channel?.Id]);

  if (!channel) return null;

  const act = async (fn, successMessage) => {
    setBusy(true);
    try {
      await fn(channel.Id, remarks);
      Swal.fire("Success", successMessage, "success");
      onChanged();
      onClose();
    } catch (err) {
      Swal.fire("Error", apiErrorMessage(err, "Unable to update the alternate-channel request."), "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 bg-black z-40" initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div className="fixed top-0 right-0 h-full w-[480px] bg-white shadow-2xl z-50 flex flex-col" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
        <div className="m-2 flex justify-between items-center bg-indigo-600 rounded-2xl px-4 py-3">
          <h2 className="font-bold text-white">{channel.TypeDescription}</h2>
          <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-gray-400">Customer</span><p className="font-semibold text-gray-800">{channel.CustomerFullName}</p></div>
            <div><span className="text-gray-400">Product</span><p className="font-semibold text-gray-800">{channel.ProductDescription}</p></div>
            <div><span className="text-gray-400">Account Number</span><p className="font-semibold text-gray-800">{channel.FullAccountNumber}</p></div>
            <div><span className="text-gray-400">Primary Account Number</span><p className="font-semibold text-gray-800">{channel.MaskedCardNumber}</p></div>
            <div><span className="text-gray-400">Status</span><p><StatusBadge status={channel.RecordStatus} /></p></div>
            <div><span className="text-gray-400">Daily Limit</span><p className="font-semibold text-gray-800">{channel.DailyLimit?.toLocaleString()}</p></div>
          </div>

          {channel.Remarks && (
            <div className="text-xs bg-gray-50 border rounded-lg p-3">
              <span className="font-semibold text-gray-600">Remarks:</span> {channel.Remarks}
            </div>
          )}

          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            No real maker-checker gate exists for this record — approving/rejecting doesn't check who created or last edited it.
          </p>

          <div>
            <label className="text-sm font-semibold text-gray-700">Remarks</label>
            <textarea
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mt-1"
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Optional"
            />
          </div>

          <div className="flex gap-2">
            <Button disabled={busy} onClick={() => act(approveAlternateChannel, "Channel approved.")} className="flex-1 bg-green-600 hover:bg-green-700">
              {busy ? "Working..." : "Approve"}
            </Button>
            <Button disabled={busy} onClick={() => act(rejectAlternateChannel, "Channel rejected.")} variant="outline" className="flex-1 border-red-300 text-red-600 hover:bg-red-50">
              Reject
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// api/accounts/alternatechannels — docs/api/alternate-channel-api-spec.md.
// NavigationMenu code 23053 ("Register"). The approve/reject checker
// queue — channels in New/Edited status, pending review. Actual linking/
// de-linking/renewal/replacement live on Management (23054) instead.
export default function RegisterAlternateChannel() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [itemsCount, setItemsCount] = useState(0);
  const [selected, setSelected] = useState(null);
  const pageSize = 20;

  const fetchList = () => {
    setLoading(true);
    listAlternateChannelsPaged({ text: search, pageIndex, pageSize })
      .then((page) => {
        const all = page?.pageCollection || page?.PageCollection || [];
        setItems(all.filter((c) => c.RecordStatus === RecordStatus.New || c.RecordStatus === RecordStatus.Edited));
        setItemsCount(page?.itemsCount ?? page?.ItemsCount ?? 0);
      })
      .catch((error) => {
        setItems([]);
        setItemsCount(0);
        Swal.fire("Error", apiErrorMessage(error, "Unable to load alternate-channel requests."), "error");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchList(); }, [pageIndex]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPageIndex(0);
    fetchList();
  };

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
      <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FaClipboardCheck /> Alternate Channels — Pending Approval
        </h2>
      </div>

      <form onSubmit={handleSearch} className="mb-4 flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by primary account number..." className="pl-8" />
        </div>
        <Button type="submit" variant="outline">Search</Button>
      </form>

      <div className="bg-gray-200 p-4 rounded-sm">
        <div className="grid grid-cols-12 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4 text-sm">
          <span className="col-span-3">Customer</span>
          <span className="col-span-3">Product</span>
          <span className="col-span-2">Channel Type</span>
          <span className="col-span-2">Primary Account Number</span>
          <span className="col-span-2">Status</span>
        </div>

        {loading ? (
          <div className="space-y-2 animate-pulse">
            {[1, 2, 3].map((i) => <div key={i} className="h-12 bg-gray-100 rounded-lg" />)}
          </div>
        ) : items.length > 0 ? (
          <div className="space-y-2">
            {items.map((channel) => (
              <button
                key={channel.Id}
                type="button"
                onClick={() => setSelected(channel)}
                className="w-full text-left bg-white rounded-lg shadow-lg border hover:shadow-xl transition-all"
              >
                <div className="grid grid-cols-12 gap-2 items-center py-3 px-6 text-sm">
                  <span className="col-span-3 font-medium text-indigo-700 truncate">{channel.CustomerFullName}</span>
                  <span className="col-span-3 text-gray-700 truncate">{channel.ProductDescription}</span>
                  <span className="col-span-2 text-gray-700">{channel.TypeDescription}</span>
                  <span className="col-span-2 text-gray-700 font-mono text-xs">{channel.MaskedCardNumber}</span>
                  <span className="col-span-2"><StatusBadge status={channel.RecordStatus} /></span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <img src={NotFoundImage} alt="Not Found" className="mx-auto w-42" />
            <p className="text-gray-400 font-medium">No channels awaiting approval.</p>
          </div>
        )}
      </div>

      {itemsCount > pageSize && (
        <div className="flex justify-center items-center gap-4 mt-4">
          <Button variant="default" disabled={pageIndex === 0} onClick={() => setPageIndex((p) => p - 1)}>Prev</Button>
          <span className="text-sm text-gray-600">Page {pageIndex + 1}</span>
          <Button variant="default" disabled={(pageIndex + 1) * pageSize >= itemsCount} onClick={() => setPageIndex((p) => p + 1)}>Next</Button>
        </div>
      )}

      <ReviewDrawer channel={selected} onClose={() => setSelected(null)} onChanged={fetchList} />
    </div>
  );
}
