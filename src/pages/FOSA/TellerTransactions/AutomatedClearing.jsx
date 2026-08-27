import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import Swal from "sweetalert2";
import NotFoundImage from "/assets/scopefinding.png";
import {
  FaFileImage, FaUpload, FaChevronLeft, FaChevronRight, FaLock, FaCheck, FaLink,
} from "react-icons/fa";
import {
  listElectronicJournals, getElectronicJournal, listTruncatedCheques,
  uploadElectronicJournal, closeElectronicJournal, clearTruncatedCheque,
  matchTruncatedChequeVoucher,
} from "./automatedClearingApi";
import { ElectronicJournalStatus, TruncatedChequeStatus } from "../lib/frontOfficeEnums";
import { apiErrorMessage } from "@/lib/api";

// api/frontoffice/automatedclearing — docs/api/frontoffice-api-spec.md §15.
// Image-based (truncated) cheque clearing.

const STATUS_OPTIONS = [
  { value: ElectronicJournalStatus.Open, label: "Open" },
  { value: ElectronicJournalStatus.Closed, label: "Closed" },
];

const JOURNAL_BADGE = { Open: "bg-blue-100 text-blue-700", Closed: "bg-gray-100 text-gray-600" };
const CHEQUE_BADGE = { New: "bg-yellow-100 text-yellow-700", Processed: "bg-green-100 text-green-700" };

function UploadModal({ open, onClose, onUploaded }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  if (!open) return null;

  const handleUpload = async () => {
    if (!file) {
      Swal.fire("Missing File", "Select a cheque-image batch file to upload.", "warning");
      return;
    }
    setUploading(true);
    try {
      await uploadElectronicJournal(file);
      Swal.fire("Success", "Electronic journal uploaded and parsed successfully", "success");
      setFile(null);
      onUploaded?.();
      onClose();
    } catch (err) {
      Swal.fire("Error", apiErrorMessage(err, "Unable to upload the electronic journal."), "error");
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
          <h3 className="font-bold text-lg text-slate-800">Upload Cheque Batch</h3>
          <Label className="text-sm font-semibold text-gray-700 block">Cheque-Image Batch File</Label>
          <input
            ref={inputRef}
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full text-sm border rounded-md p-2"
          />
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button disabled={uploading} className="flex-1 bg-indigo-600 hover:bg-indigo-700" onClick={handleUpload}>
              {uploading ? "Uploading..." : "Upload"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

function ElectronicJournalDrawer({ id, onClose, onChanged }) {
  const [journal, setJournal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cheques, setCheques] = useState([]);
  const [loadingCheques, setLoadingCheques] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [closing, setClosing] = useState(false);
  const [actingId, setActingId] = useState(null);

  const fetchJournal = () => {
    if (!id) return;
    setLoading(true);
    getElectronicJournal(id).then(setJournal).catch((error) => {
      setJournal(null);
      Swal.fire("Error", apiErrorMessage(error, "Unable to load the electronic journal."), "error");
    }).finally(() => setLoading(false));
  };

  const fetchCheques = () => {
    if (!id) return;
    setLoadingCheques(true);
    listTruncatedCheques(id, { status: statusFilter === "" ? undefined : Number(statusFilter), pageSize: 100 })
      .then((page) => setCheques(page?.pageCollection || page?.PageCollection || []))
      .catch((error) => {
        setCheques([]);
        Swal.fire("Error", apiErrorMessage(error, "Unable to load truncated cheques."), "error");
      })
      .finally(() => setLoadingCheques(false));
  };

  useEffect(() => { fetchJournal(); }, [id]);
  useEffect(() => { fetchCheques(); }, [id, statusFilter]);

  if (!id) return null;

  const isOpen = journal?.Status === ElectronicJournalStatus.Open;

  const handleClose = async () => {
    const confirm = await Swal.fire({
      title: "Close this electronic journal?",
      text: "This finalizes and exports the batch — it cannot be reopened.",
      icon: "warning", showCancelButton: true, confirmButtonColor: "#dc2626", confirmButtonText: "Close Journal",
    });
    if (!confirm.isConfirmed) return;
    setClosing(true);
    try {
      await closeElectronicJournal(id);
      Swal.fire("Success", "Electronic journal closed successfully", "success");
      fetchJournal();
      onChanged?.();
    } catch (err) {
      Swal.fire("Error", apiErrorMessage(err, "Unable to close the electronic journal."), "error");
    } finally {
      setClosing(false);
    }
  };

  const handleClear = async (chequeId) => {
    setActingId(chequeId);
    try {
      await clearTruncatedCheque(chequeId);
      Swal.fire("Success", "Truncated cheque cleared", "success");
      fetchCheques();
    } catch (err) {
      Swal.fire("Error", apiErrorMessage(err, "Unable to clear the truncated cheque."), "error");
    } finally {
      setActingId(null);
    }
  };

  const handleMatch = async (chequeId) => {
    setActingId(chequeId);
    try {
      await matchTruncatedChequeVoucher(chequeId);
      Swal.fire("Success", "Payment voucher matched", "success");
      fetchCheques();
    } catch (err) {
      Swal.fire("Error", apiErrorMessage(err, "Unable to match the payment voucher."), "error");
    } finally {
      setActingId(null);
    }
  };

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 bg-black z-40" initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div className="fixed top-5 right-3 w-[560px] bg-white shadow-xl z-50 flex flex-col rounded-2xl p-3 max-h-[95vh]" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
        <div className="p-4 flex justify-between items-center bg-indigo-600 rounded-2xl m-2 shrink-0">
          <h2 className="font-bold text-lg text-white">Electronic Journal</h2>
          <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
        </div>
        <div className="p-4 space-y-4 overflow-y-auto flex-1 min-h-0">
          {loading || !journal ? (
            <p className="text-sm text-gray-400">Loading...</p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2 text-sm bg-gray-50 rounded-lg p-3">
                <p><span className="font-semibold text-gray-600">File:</span> {journal.FileName || "—"}</p>
                <p><span className="font-semibold text-gray-600">Items:</span> {journal.ItemsCount} ({journal.ProcessedItemsCount} processed)</p>
                <p><span className="font-semibold text-gray-600">Debits:</span> {journal.TrailerRecordTotalValueDebits?.toLocaleString?.() ?? "—"}</p>
                <p><span className="font-semibold text-gray-600">Credits:</span> {journal.TrailerRecordTotalValueCredits?.toLocaleString?.() ?? "—"}</p>
                <p className="col-span-2">
                  <span className="font-semibold text-gray-600">Status:</span>{" "}
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${JOURNAL_BADGE[journal.StatusDescription] || "bg-gray-100 text-gray-500"}`}>
                    {journal.StatusDescription || "—"}
                  </span>
                </p>
              </div>

              {isOpen && (
                <Button disabled={closing} onClick={handleClose} className="w-full bg-red-600 hover:bg-red-700 flex items-center gap-2">
                  <FaLock /> {closing ? "Closing..." : "Close Journal"}
                </Button>
              )}

              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label className="font-semibold text-gray-700">Truncated Cheques</Label>
                  <Select value={statusFilter === "" ? "all" : statusFilter} onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}>
                    <SelectTrigger className="w-32 h-8 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value={String(TruncatedChequeStatus.New)}>New</SelectItem>
                      <SelectItem value={String(TruncatedChequeStatus.Processed)}>Processed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {loadingCheques ? (
                  <p className="text-sm text-gray-400">Loading...</p>
                ) : cheques.length > 0 ? (
                  <div className="space-y-1">
                    {cheques.map((c) => {
                      const isNew = c.Status === TruncatedChequeStatus.New;
                      return (
                        <div key={c.Id} className="border border-gray-200 rounded-lg p-2 text-xs space-y-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-gray-800">{c.SerialNumber || c.DocumentReferenceNumber || "—"}</p>
                              <p className="text-gray-500">{c.PresentingBank} &middot; {c.DestinationAccountAccount}</p>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full font-semibold ${CHEQUE_BADGE[c.StatusDescription] || "bg-gray-100 text-gray-500"}`}>
                              {c.StatusDescription || "—"}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-indigo-700">{typeof c.Value === "number" ? c.Value.toLocaleString() : "—"}</span>
                            {isNew && (
                              <div className="flex gap-1">
                                <Button size="sm" variant="outline" disabled={actingId === c.Id} onClick={() => handleMatch(c.Id)} className="h-7 px-2 text-[10px] flex items-center gap-1">
                                  <FaLink /> Match Voucher
                                </Button>
                                <Button size="sm" disabled={actingId === c.Id} onClick={() => handleClear(c.Id)} className="h-7 px-2 text-[10px] bg-indigo-600 hover:bg-indigo-700 flex items-center gap-1">
                                  <FaCheck /> Clear
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 py-2">No truncated cheques found.</p>
                )}
              </div>
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function AutomatedClearing() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize] = useState(20);
  const [itemsCount, setItemsCount] = useState(0);
  const [selectedId, setSelectedId] = useState(null);
  const [uploadOpen, setUploadOpen] = useState(false);

  const fetchItems = () => {
    setLoading(true);
    listElectronicJournals({ status: statusFilter === "" ? 0 : Number(statusFilter), text: search, pageIndex, pageSize })
      .then((page) => {
        setItems(page?.pageCollection || page?.PageCollection || []);
        setItemsCount(page?.itemsCount || page?.ItemsCount || 0);
      })
      .catch((error) => {
        setItems([]);
        setItemsCount(0);
        Swal.fire("Error", apiErrorMessage(error, "Unable to load electronic journals."), "error");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter, pageIndex]);

  const handleSearchChange = (e) => { setSearch(e.target.value); setPageIndex(0); };
  const handleStatusChange = (v) => { setStatusFilter(v === "all" ? "" : v); setPageIndex(0); };

  const hasNextPage = itemsCount ? (pageIndex + 1) * pageSize < itemsCount : items.length === pageSize;

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
      <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FaFileImage /> Automated Clearing
        </h2>
        <Button onClick={() => setUploadOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2">
          <FaUpload /> Upload Batch
        </Button>
      </div>

      <div className="flex flex-wrap justify-between items-center mb-4 gap-3">
        <Input value={search} onChange={handleSearchChange} placeholder="Search..." className="max-w-xs" />
        <Select value={statusFilter === "" ? "all" : statusFilter} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {STATUS_OPTIONS.map((o) => <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-gray-200 p-4 rounded-sm">
        <div className="grid grid-cols-12 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4">
          <span className="col-span-4">File Name</span>
          <span className="col-span-2">Items</span>
          <span className="col-span-3">Total Debits</span>
          <span className="col-span-3">Status</span>
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
              <button key={item.Id} onClick={() => setSelectedId(item.Id)} className="w-full text-left bg-white rounded-lg shadow-lg border">
                <div className="grid grid-cols-12 gap-2 items-center py-4 px-6 hover:shadow-xl transition-all">
                  <span className="col-span-4 font-medium text-indigo-700 truncate">{item.FileName || "—"}</span>
                  <span className="col-span-2 text-sm text-gray-700">{item.ItemsCount} ({item.ProcessedItemsCount})</span>
                  <span className="col-span-3 text-sm text-gray-700">{typeof item.TrailerRecordTotalValueDebits === "number" ? item.TrailerRecordTotalValueDebits.toLocaleString() : "—"}</span>
                  <span className="col-span-3">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${JOURNAL_BADGE[item.StatusDescription] || "bg-gray-100 text-gray-500"}`}>
                      {item.StatusDescription || "—"}
                    </span>
                  </span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-center mt-4">
            <img src={NotFoundImage} alt="Not Found" className="mx-auto w-42" />
            <p className="font-medium text-gray-400">No electronic journals found.</p>
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
        <ElectronicJournalDrawer id={selectedId} onClose={() => setSelectedId(null)} onChanged={fetchItems} />
      )}
      <UploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} onUploaded={fetchItems} />
    </div>
  );
}
