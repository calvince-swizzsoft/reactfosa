import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";
import { FaMobileAlt, FaPlus, FaSearch } from "react-icons/fa";
import NotFoundImage from "/assets/scopefinding.png";
import {
  listAlternateChannelsPaged, replaceAlternateChannel, renewAlternateChannel,
  stopAlternateChannel, delinkAlternateChannel, approveAlternateChannel, rejectAlternateChannel,
} from "./api";

function StatusBadge({ status }) {
  const meta = {
    0: { label: "New", cls: "bg-gray-100 text-gray-600" },
    1: { label: "Edited", cls: "bg-blue-100 text-blue-600" },
    2: { label: "Approved", cls: "bg-green-100 text-green-600" },
    3: { label: "Rejected", cls: "bg-red-100 text-red-600" },
  }[status] || { label: "Unknown", cls: "bg-gray-100 text-gray-600" };
  return <span className={`px-2 py-1 rounded text-xs font-semibold ${meta.cls}`}>{meta.label}</span>;
}

function FieldGroup({ label, children }) {
  return (
    <div>
      <Label className="text-sm font-semibold text-gray-700">{label}</Label>
      {children}
    </div>
  );
}

async function promptRemarks(title) {
  const { value, isConfirmed } = await Swal.fire({
    title,
    input: "textarea",
    inputPlaceholder: "Remarks...",
    showCancelButton: true,
    confirmButtonColor: "#4f46e5",
  });
  if (!isConfirmed) return null;
  return value || "";
}

function DetailDrawer({ channel, onClose, onChanged }) {
  const [replaceOpen, setReplaceOpen] = useState(false);
  const [replaceMode, setReplaceMode] = useState("replace"); // "replace" | "renew"
  const [newCardNumber, setNewCardNumber] = useState("");
  const [replaceRemarks, setReplaceRemarks] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setReplaceOpen(false);
    setNewCardNumber("");
    setReplaceRemarks("");
  }, [channel?.Id]);

  if (!channel) return null;

  const handleApprove = async () => {
    const remarks = await promptRemarks("Approve Channel");
    if (remarks === null) return;
    try {
      await approveAlternateChannel(channel.Id, remarks);
      Swal.fire("Success", "Channel approved.", "success");
      onChanged();
      onClose();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  };

  const handleReject = async () => {
    const remarks = await promptRemarks("Reject Channel");
    if (remarks === null) return;
    try {
      await rejectAlternateChannel(channel.Id, remarks);
      Swal.fire("Success", "Channel rejected.", "success");
      onChanged();
      onClose();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  };

  const handleStop = async () => {
    const remarks = await promptRemarks("Stop Channel (suspend transacting)");
    if (remarks === null) return;
    try {
      await stopAlternateChannel(channel.Id, { CustomerAccountId: channel.CustomerAccountId, Remarks: remarks });
      Swal.fire("Success", "Channel stopped.", "success");
      onChanged();
      onClose();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  };

  const handleDelink = async () => {
    const confirm = await Swal.fire({
      title: "Delink this channel?",
      text: "This hard-deletes the link — it cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      confirmButtonText: "Delink",
    });
    if (!confirm.isConfirmed) return;
    const remarks = await promptRemarks("Delink Channel");
    if (remarks === null) return;
    try {
      await delinkAlternateChannel(channel.Id, { CustomerAccountId: channel.CustomerAccountId, Remarks: remarks });
      Swal.fire("Success", "Channel delinked.", "success");
      onChanged();
      onClose();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  };

  const submitReplaceOrRenew = async () => {
    if (!newCardNumber) {
      Swal.fire("Missing Fields", "A new primary account number is required.", "warning");
      return;
    }
    setBusy(true);
    try {
      const dto = { CustomerAccountId: channel.CustomerAccountId, CardNumber: newCardNumber, Remarks: replaceRemarks };
      if (replaceMode === "replace") await replaceAlternateChannel(channel.Id, dto);
      else await renewAlternateChannel(channel.Id, dto);
      Swal.fire("Success", replaceMode === "replace" ? "Channel replaced." : "Channel renewed.", "success");
      onChanged();
      onClose();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 bg-black z-40" initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div className="fixed top-0 right-0 h-full w-[520px] bg-white shadow-2xl z-50 flex flex-col" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
        <div className="m-2 flex justify-between items-center bg-indigo-600 rounded-2xl px-4 py-3">
          <h2 className="font-bold text-white">{channel.TypeDescription}</h2>
          <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-gray-400">Customer</span><p className="font-semibold text-gray-800">{channel.CustomerFullName}</p></div>
            <div><span className="text-gray-400">Status</span><p><StatusBadge status={channel.RecordStatus} /></p></div>
            <div><span className="text-gray-400">Account Number</span><p className="font-semibold text-gray-800">{channel.FullAccountNumber}</p></div>
            <div><span className="text-gray-400">Primary Account Number</span><p className="font-semibold text-gray-800">{channel.MaskedCardNumber}</p></div>
            <div><span className="text-gray-400">Daily Limit</span><p className="font-semibold text-gray-800">{channel.DailyLimit?.toLocaleString()}</p></div>
            <div><span className="text-gray-400">Locked?</span><p className="font-semibold text-gray-800">{channel.IsLocked ? "Yes" : "No"}</p></div>
          </div>

          {channel.Remarks && (
            <div className="text-xs bg-gray-50 border rounded-lg p-3">
              <span className="font-semibold text-gray-600">Remarks:</span> {channel.Remarks}
            </div>
          )}

          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            No real maker-checker gate exists for this record — Approve/Reject don't check who created or last edited it.
          </p>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <Button size="sm" onClick={handleApprove} className="bg-green-600 hover:bg-green-700">Approve</Button>
            <Button size="sm" onClick={handleReject} variant="outline" className="border-red-300 text-red-600 hover:bg-red-50">Reject</Button>
            <Button size="sm" onClick={() => { setReplaceMode("replace"); setReplaceOpen(true); }} variant="outline">Replace</Button>
            <Button size="sm" onClick={() => { setReplaceMode("renew"); setReplaceOpen(true); }} variant="outline">Renew</Button>
            <Button size="sm" onClick={handleStop} variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-50">Stop</Button>
            <Button size="sm" onClick={handleDelink} variant="outline" className="border-red-300 text-red-600 hover:bg-red-50">Delink</Button>
          </div>

          {replaceOpen && (
            <div className="border-t pt-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                {replaceMode === "replace" ? "Replace Card/Number" : "Renew Card/Number"}
              </p>
              <FieldGroup label="New Primary Account Number">
                <Input value={newCardNumber} onChange={(e) => setNewCardNumber(e.target.value)} />
              </FieldGroup>
              <FieldGroup label="Remarks">
                <Input value={replaceRemarks} onChange={(e) => setReplaceRemarks(e.target.value)} />
              </FieldGroup>
              <Button onClick={submitReplaceOrRenew} disabled={busy} className="w-full bg-indigo-600 hover:bg-indigo-700">
                {busy ? "Submitting..." : replaceMode === "replace" ? "Confirm Replacement" : "Confirm Renewal"}
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// api/accounts/alternatechannels — docs/api/alternate-channel-api-spec.md.
// NavigationMenu code 23054 ("Management").
export default function AlternateChannelManagement() {
  const navigate = useNavigate();
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
        setItems(page?.pageCollection || page?.PageCollection || []);
        setItemsCount(page?.itemsCount ?? page?.ItemsCount ?? 0);
      })
      .catch(() => setItems([]))
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
          <FaMobileAlt /> Alternate Channels
        </h2>
        <Button onClick={() => navigate("/Accounts/AlternateChannels/Register")} className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2">
          <FaPlus /> New Link
        </Button>
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
          <span className="col-span-4">Customer</span>
          <span className="col-span-2">Type</span>
          <span className="col-span-3">Primary Account Number</span>
          <span className="col-span-2">Status</span>
          <span className="col-span-1">Locked</span>
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
                  <span className="col-span-4 font-medium text-indigo-700 truncate">{channel.CustomerFullName}</span>
                  <span className="col-span-2 text-gray-700">{channel.TypeDescription}</span>
                  <span className="col-span-3 text-gray-700 font-mono text-xs">{channel.MaskedCardNumber}</span>
                  <span className="col-span-2"><StatusBadge status={channel.RecordStatus} /></span>
                  <span className="col-span-1 text-xs text-gray-500">{channel.IsLocked ? "Yes" : "No"}</span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <img src={NotFoundImage} alt="Not Found" className="mx-auto w-42" />
            <p className="text-gray-400 font-medium">No alternate channels found.</p>
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

      <DetailDrawer channel={selected} onClose={() => setSelected(null)} onChanged={fetchList} />
    </div>
  );
}
