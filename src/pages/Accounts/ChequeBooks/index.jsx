import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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
  FaBook, FaPlus, FaChevronLeft, FaChevronRight, FaEdit, FaListUl, FaSearch,
} from "react-icons/fa";
import { listChequeBooks, updateChequeBook, matchVoucher } from "./api";
import { apiErrorMessage } from "@/lib/api";
import { ChequeBookType } from "../lib/chequeBookEnums";

// Areas/Accounts/Controllers/ChequeBookController.cs — docs/api/chequebook-api-spec.md.
// New controller (2026-08-11) — IChequeBookAppService already existed but had
// no API surface. See TODO.md.
const TYPE_OPTIONS = [
  { value: ChequeBookType.InHouse, label: "In-House" },
  { value: ChequeBookType.External, label: "External" },
];

function FieldGroup({ label, children }) {
  return (
    <div>
      <Label className="text-sm font-semibold text-gray-700">{label}</Label>
      {children}
    </div>
  );
}

// PUT /{id} — the same call drives Reference/Remarks edits AND the
// activate/lock toggles (§4: IsActive false->true activates this
// chequebook and deactivates every other one on the same customer account;
// true->false does nothing). NumberOfVouchers/InitialVoucherNumber/
// CustomerAccountId/Type aren't exposed here (changing them after vouchers
// are already seeded isn't a supported flow) but ValidateAll() still
// requires them present and valid, so they're carried forward unchanged
// from the fetched item rather than dropped from the payload.
function EditChequeBookDrawer({ open, onClose, onSuccess, item }) {
  const [form, setForm] = useState({ Reference: "", Remarks: "", IsActive: false, IsLocked: false });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !item) return;
    setForm({
      Reference: item.Reference || "",
      Remarks: item.Remarks || "",
      IsActive: !!item.IsActive,
      IsLocked: !!item.IsLocked,
    });
  }, [open, item]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateChequeBook(item.Id, { ...item, ...form });
      Swal.fire("Success", "Cheque book updated successfully", "success");
      onSuccess();
      onClose();
    } catch (err) {
      Swal.fire("Error", apiErrorMessage(err, "Unable to update the cheque book."), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 bg-black z-40" initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div className="fixed top-5 right-3 w-[420px] bg-white shadow-xl z-50 flex flex-col rounded-2xl p-3 max-h-[95vh]" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
            <div className="p-4 flex justify-between items-center bg-indigo-600 rounded-2xl m-2 shrink-0">
              <h2 className="font-bold text-lg text-white">Edit Cheque Book</h2>
              <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
              <div className="p-4 space-y-4 overflow-y-auto flex-1 min-h-0">
                {item && (
                  <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3 space-y-0.5">
                    <p><span className="font-semibold text-gray-600">Customer:</span> {item.CustomerAccountCustomerFullName || "—"}</p>
                    <p><span className="font-semibold text-gray-600">Account:</span> {item.FullAccountNumber || "—"}</p>
                    <p><span className="font-semibold text-gray-600">Type:</span> {item.TypeDescription || "—"} &middot; Serial {item.PaddedSerialNumber}</p>
                    <p><span className="font-semibold text-gray-600">Vouchers:</span> {item.NumberOfVouchers} leaves from #{item.InitialVoucherNumber}</p>
                  </div>
                )}
                <FieldGroup label="Reference">
                  <Input value={form.Reference} onChange={(e) => setForm((p) => ({ ...p, Reference: e.target.value }))} placeholder="e.g. CBK-2026-0042" />
                </FieldGroup>
                <FieldGroup label="Remarks">
                  <Input value={form.Remarks} onChange={(e) => setForm((p) => ({ ...p, Remarks: e.target.value }))} placeholder="Optional" />
                </FieldGroup>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="cb-active"
                    checked={form.IsActive}
                    onChange={(e) => setForm((p) => ({ ...p, IsActive: e.target.checked }))}
                    className="w-4 h-4 accent-indigo-600"
                  />
                  <Label htmlFor="cb-active">Active (deactivates every other chequebook on this account)</Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="cb-locked"
                    checked={form.IsLocked}
                    onChange={(e) => setForm((p) => ({ ...p, IsLocked: e.target.checked }))}
                    className="w-4 h-4 accent-indigo-600"
                  />
                  <Label htmlFor="cb-locked">Is Locked?</Label>
                </div>
              </div>
              <div className="p-4 pt-3 border-t shrink-0">
                <Button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700">
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Read-only diagnostic — GET /vouchers/match (§6.7). Same lookup
// ElectronicJournalAppService uses internally to auto-match KBACTS
// clearing-house records against chequebook vouchers; exposed here as a
// manual tool, not wired into automated clearing itself.
function MatchVoucherModal({ open, onClose }) {
  const [chequeBookType, setChequeBookType] = useState(String(ChequeBookType.External));
  const [voucherNumber, setVoucherNumber] = useState("");
  const [chequeBookReference, setChequeBookReference] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  if (!open) return null;

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!voucherNumber || !chequeBookReference.trim()) {
      Swal.fire("Missing Fields", "Voucher number and cheque book reference are required.", "warning");
      return;
    }
    setLoading(true);
    setResults(null);
    try {
      const data = await matchVoucher({ chequeBookType: Number(chequeBookType), voucherNumber: Number(voucherNumber), chequeBookReference: chequeBookReference.trim() });
      setResults(Array.isArray(data) ? data : []);
    } catch (err) {
      Swal.fire("Error", apiErrorMessage(err, "Unable to match the voucher."), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
          <div className="flex justify-between items-center px-5 py-4 bg-indigo-600 rounded-t-2xl shrink-0">
            <h3 className="font-bold text-white text-base flex items-center gap-2"><FaSearch /> Match a Presented Leaf</h3>
            <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
          </div>
          <form onSubmit={handleSearch} className="p-4 space-y-3 overflow-y-auto flex-1 min-h-0">
            <div className="grid grid-cols-2 gap-3">
              <FieldGroup label="Cheque Book Type">
                <Select value={chequeBookType} onValueChange={setChequeBookType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TYPE_OPTIONS.map((o) => <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FieldGroup>
              <FieldGroup label="Voucher Number">
                <Input type="number" value={voucherNumber} onChange={(e) => setVoucherNumber(e.target.value)} placeholder="e.g. 42" />
              </FieldGroup>
            </div>
            <FieldGroup label="Cheque Book Reference">
              <Input value={chequeBookReference} onChange={(e) => setChequeBookReference(e.target.value)} placeholder="The issuing chequebook's own Reference field" />
            </FieldGroup>
            <Button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700">
              {loading ? "Searching..." : "Search"}
            </Button>

            {results !== null && (
              results.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No matching voucher found.</p>
              ) : (
                <div className="space-y-2 pt-2">
                  {results.map((v) => (
                    <div key={v.Id} className="border border-gray-200 rounded-lg p-3 text-sm space-y-0.5">
                      <p><span className="font-semibold text-gray-600">Leaf:</span> {v.PaddedVoucherNumber} &middot; <span className="font-semibold text-gray-600">Status:</span> {v.StatusDescription}</p>
                      <p><span className="font-semibold text-gray-600">Payee:</span> {v.Payee || "—"} &middot; <span className="font-semibold text-gray-600">Amount:</span> {typeof v.Amount === "number" ? v.Amount.toLocaleString() : "—"}</p>
                      <p><span className="font-semibold text-gray-600">Reference:</span> {v.Reference || "—"}</p>
                    </div>
                  ))}
                </div>
              )
            )}
          </form>
        </div>
      </div>
    </>
  );
}

export default function ChequeBooks() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editItem, setEditItem] = useState(null);
  const [matchOpen, setMatchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize] = useState(20);
  const [itemsCount, setItemsCount] = useState(0);

  const fetchItems = () => {
    setLoading(true);
    listChequeBooks({ text: search, type: typeFilter === "" ? undefined : Number(typeFilter), pageIndex, pageSize })
      .then((page) => {
        setItems(page?.pageCollection || page?.PageCollection || []);
        setItemsCount(page?.itemsCount || page?.ItemsCount || 0);
      })
      .catch((error) => {
        setItems([]);
        setItemsCount(0);
        Swal.fire("Error", apiErrorMessage(error, "Unable to load cheque books."), "error");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, typeFilter, pageIndex]);

  const handleSearchChange = (e) => { setSearch(e.target.value); setPageIndex(0); };
  const handleTypeChange = (v) => { setTypeFilter(v === "all" ? "" : v); setPageIndex(0); };

  const hasNextPage = itemsCount ? (pageIndex + 1) * pageSize < itemsCount : items.length === pageSize;

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
      <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FaBook /> Cheque Books
        </h2>
        <div className="flex items-center gap-2">
          <Button onClick={() => setMatchOpen(true)} variant="outline" className="flex items-center gap-2">
            <FaSearch /> Match Voucher
          </Button>
          <Link
            to="/Accounts/ChequeBooks/create"
            className="inline-flex items-center gap-2 rounded-md bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-sm font-medium text-white"
          >
            <FaPlus /> Issue Cheque Book
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap justify-between items-center mb-4 gap-3">
        <Input
          value={search}
          onChange={handleSearchChange}
          placeholder="Search by customer, account, reference..."
          className="max-w-xs"
        />
        <Select value={typeFilter === "" ? "all" : typeFilter} onValueChange={handleTypeChange}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {TYPE_OPTIONS.map((o) => <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-gray-200 p-4 rounded-sm">
        <div className="grid grid-cols-12 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4">
          <span className="col-span-3">Customer</span>
          <span className="col-span-2">Account</span>
          <span className="col-span-2">Type / Serial</span>
          <span className="col-span-1">Status</span>
          <span className="col-span-4 text-right">Actions</span>
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
                  <span className="col-span-3 font-medium text-indigo-700 truncate">{item.CustomerAccountCustomerFullName || "—"}</span>
                  <span className="col-span-2 text-xs font-mono text-gray-500 truncate">{item.FullAccountNumber || "—"}</span>
                  <span className="col-span-2 text-sm text-gray-700">{item.TypeDescription || "—"} &middot; {item.PaddedSerialNumber}</span>
                  <span className="col-span-1 flex flex-col gap-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold w-fit ${item.IsActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {item.IsActive ? "Active" : "Inactive"}
                    </span>
                    {item.IsLocked && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold w-fit bg-red-100 text-red-600">Locked</span>
                    )}
                  </span>
                  <div className="col-span-4 flex justify-end gap-2">
                    <Link to={`/Accounts/ChequeBooks/${item.Id}/vouchers`}>
                      <Button size="sm" variant="outline" className="flex items-center gap-1">
                        <FaListUl className="text-indigo-600" /> Vouchers
                      </Button>
                    </Link>
                    <Button size="sm" variant="outline" onClick={() => setEditItem(item)} className="flex items-center gap-1">
                      <FaEdit className="text-indigo-600" /> Edit
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-center mt-4">
            <img src={NotFoundImage} alt="Not Found" className="mx-auto w-42" />
            <p className="font-medium text-gray-400">No cheque books found.</p>
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

      <EditChequeBookDrawer open={!!editItem} onClose={() => setEditItem(null)} onSuccess={fetchItems} item={editItem} />
      <MatchVoucherModal open={matchOpen} onClose={() => setMatchOpen(false)} />
    </div>
  );
}
