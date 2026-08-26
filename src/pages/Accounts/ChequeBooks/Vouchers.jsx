import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import Swal from "sweetalert2";
import NotFoundImage from "/assets/scopefinding.png";
import { FaBook, FaChevronLeft, FaChevronRight, FaMoneyCheck, FaFlag } from "react-icons/fa";
import { getChequeBook, listVouchers, payVoucher, flagVoucher } from "./api";
import { PaymentVoucherStatus, PaymentVoucherManagementAction } from "../lib/chequeBookEnums";
import { apiErrorMessage } from "@/lib/api";

// Areas/Accounts/Controllers/ChequeBookController.cs — docs/api/chequebook-api-spec.md
// §6.6/§6.8/§6.9. Per-leaf voucher register for one chequebook — a
// chequebook can seed many leaves (numberOfVouchers), independently
// searchable/paged server-side, so this is its own route rather than
// crammed into the ChequeBooks edit drawer.

const STATUS_BADGE = {
  [PaymentVoucherStatus.Active]: "bg-gray-100 text-gray-600",
  [PaymentVoucherStatus.Paid]: "bg-green-100 text-green-700",
  [PaymentVoucherStatus.Flagged]: "bg-red-100 text-red-600",
};

function FieldGroup({ label, children }) {
  return (
    <div>
      <Label className="text-sm font-semibold text-gray-700">{label}</Label>
      {children}
    </div>
  );
}

// Fetch-edit-resubmit — the voucher row fetched from GET /{id}/vouchers is
// passed in whole and edited here, matching ChequeTypeController.Update's
// contract (docs/api/chequebook-api-spec.md §6.8). Only Payee/Amount/
// WriteDate/Reference are actually persisted by PayVoucher; everything
// else on the row travels along unchanged.
function PayVoucherDrawer({ open, onClose, onSuccess, voucher }) {
  const [form, setForm] = useState({ Payee: "", Amount: "", WriteDate: "", Reference: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !voucher) return;
    setForm({
      Payee: voucher.Payee || "",
      Amount: voucher.Amount || "",
      WriteDate: voucher.WriteDate ? voucher.WriteDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
      Reference: voucher.Reference || "",
    });
  }, [open, voucher]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.Payee.trim() || !form.Reference.trim() || !(Number(form.Amount) > 0)) {
      Swal.fire("Missing Fields", "Payee, reference, and an amount greater than zero are required.", "warning");
      return;
    }
    setLoading(true);
    try {
      await payVoucher(voucher.Id, {
        ...voucher,
        Payee: form.Payee,
        Amount: Number(form.Amount),
        WriteDate: form.WriteDate ? new Date(form.WriteDate).toISOString() : null,
        Reference: form.Reference,
      });
      Swal.fire("Success", "Voucher paid successfully", "success");
      onSuccess();
      onClose();
    } catch (err) {
      Swal.fire("Error", apiErrorMessage(err, "Unable to pay the voucher."), "error");
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
              <h2 className="font-bold text-lg text-white">Pay Voucher {voucher?.PaddedVoucherNumber}</h2>
              <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
              <div className="p-4 space-y-4 overflow-y-auto flex-1 min-h-0">
                <FieldGroup label="Payee">
                  <Input value={form.Payee} onChange={(e) => setForm((p) => ({ ...p, Payee: e.target.value }))} required placeholder="e.g. Jane Doe" />
                </FieldGroup>
                <FieldGroup label="Amount">
                  <Input type="number" min="0" value={form.Amount} onChange={(e) => setForm((p) => ({ ...p, Amount: e.target.value }))} required placeholder="e.g. 5000" />
                </FieldGroup>
                <FieldGroup label="Write Date">
                  <Input type="date" value={form.WriteDate} onChange={(e) => setForm((p) => ({ ...p, WriteDate: e.target.value }))} />
                </FieldGroup>
                <FieldGroup label="Reference">
                  <Input value={form.Reference} onChange={(e) => setForm((p) => ({ ...p, Reference: e.target.value }))} required placeholder="Voucher reference" />
                </FieldGroup>
              </div>
              <div className="p-4 pt-3 border-t shrink-0">
                <Button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700">
                  {loading ? "Paying..." : "Pay Voucher"}
                </Button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default function ChequeBookVouchers() {
  const { id } = useParams();
  const [chequeBook, setChequeBook] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize] = useState(20);
  const [itemsCount, setItemsCount] = useState(0);
  const [payVoucherItem, setPayVoucherItem] = useState(null);
  const [flaggingId, setFlaggingId] = useState(null);

  const fetchVouchers = () => {
    setLoading(true);
    listVouchers(id, { text: search, pageIndex, pageSize })
      .then((page) => {
        setItems(page?.pageCollection || page?.PageCollection || []);
        setItemsCount(page?.itemsCount || page?.ItemsCount || 0);
      })
      .catch((error) => {
        setItems([]);
        setItemsCount(0);
        Swal.fire("Error", apiErrorMessage(error, "Unable to load cheque-book vouchers."), "error");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    getChequeBook(id).then(setChequeBook).catch((error) => {
      setChequeBook(null);
      Swal.fire("Error", apiErrorMessage(error, "Unable to load the cheque book."), "error");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    fetchVouchers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, search, pageIndex]);

  const handleSearchChange = (e) => { setSearch(e.target.value); setPageIndex(0); };

  // Doesn't run full ValidateAll() server-side (§6.9) — only
  // Reference/ManagementAction are read, so resend the fetched row as-is
  // with ManagementAction flipped, no separate form needed.
  const handleToggleFlag = async (voucher) => {
    const flagging = voucher.Status !== PaymentVoucherStatus.Flagged;
    const confirm = await Swal.fire({
      title: `${flagging ? "Flag" : "Unflag"} voucher ${voucher.PaddedVoucherNumber}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: flagging ? "#dc2626" : "#4f46e5",
      confirmButtonText: flagging ? "Flag" : "Unflag",
    });
    if (!confirm.isConfirmed) return;
    setFlaggingId(voucher.Id);
    try {
      await flagVoucher(voucher.Id, {
        ...voucher,
        ManagementAction: flagging ? PaymentVoucherManagementAction.Flag : PaymentVoucherManagementAction.Unflag,
      });
      Swal.fire("Success", `Voucher ${flagging ? "flagged" : "unflagged"} successfully`, "success");
      fetchVouchers();
    } catch (err) {
      Swal.fire("Error", apiErrorMessage(err, "Unable to update the voucher flag."), "error");
    } finally {
      setFlaggingId(null);
    }
  };

  const hasNextPage = itemsCount ? (pageIndex + 1) * pageSize < itemsCount : items.length === pageSize;

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
      <div className="flex items-center justify-between gap-3 mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
        <div className="flex items-center gap-3">
          <FaBook className="text-white text-xl" />
          <div>
            <h2 className="text-xl font-bold text-white">Voucher Register</h2>
            {chequeBook && (
              <p className="text-xs text-white/70">
                {chequeBook.CustomerAccountCustomerFullName} &middot; {chequeBook.FullAccountNumber} &middot; {chequeBook.TypeDescription} &middot; Serial {chequeBook.PaddedSerialNumber}
              </p>
            )}
          </div>
        </div>
        <Link to="/Accounts/ChequeBooks" className="text-sm text-white/80 hover:text-white">
          &larr; Back to Cheque Books
        </Link>
      </div>

      <div className="flex flex-wrap justify-between items-center mb-4 gap-3">
        <Input
          value={search}
          onChange={handleSearchChange}
          placeholder="Search vouchers..."
          className="max-w-xs"
        />
      </div>

      <div className="bg-gray-200 p-4 rounded-sm">
        <div className="grid grid-cols-12 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4">
          <span className="col-span-1">Leaf</span>
          <span className="col-span-3">Payee</span>
          <span className="col-span-2">Amount</span>
          <span className="col-span-2">Reference</span>
          <span className="col-span-1">Status</span>
          <span className="col-span-3 text-right">Actions</span>
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
            {items.map((v) => {
              const isActive = v.Status === PaymentVoucherStatus.Active;
              const isPaid = v.Status === PaymentVoucherStatus.Paid;
              return (
                <div key={v.Id} className="bg-white rounded-lg shadow-lg border">
                  <div className="grid grid-cols-12 gap-2 items-center py-4 px-6 hover:shadow-xl transition-all">
                    <span className="col-span-1 font-mono text-xs text-gray-600">{v.PaddedVoucherNumber}</span>
                    <span className="col-span-3 font-medium text-indigo-700 truncate">{v.Payee || "—"}</span>
                    <span className="col-span-2 text-sm text-gray-700">{typeof v.Amount === "number" ? v.Amount.toLocaleString() : "—"}</span>
                    <span className="col-span-2 text-xs text-gray-500 truncate">{v.Reference || "—"}</span>
                    <span className="col-span-1">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${STATUS_BADGE[v.Status] || "bg-gray-100 text-gray-500"}`}>
                        {v.StatusDescription || "—"}
                      </span>
                    </span>
                    <div className="col-span-3 flex justify-end gap-2">
                      {isActive && (
                        <Button size="sm" onClick={() => setPayVoucherItem(v)} className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-1">
                          <FaMoneyCheck /> Pay
                        </Button>
                      )}
                      {!isPaid && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={flaggingId === v.Id}
                          onClick={() => handleToggleFlag(v)}
                          className={v.Status === PaymentVoucherStatus.Flagged ? "text-indigo-600" : "text-red-600"}
                        >
                          <FaFlag className="mr-1" /> {v.Status === PaymentVoucherStatus.Flagged ? "Unflag" : "Flag"}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-gray-500 text-center mt-4">
            <img src={NotFoundImage} alt="Not Found" className="mx-auto w-42" />
            <p className="font-medium text-gray-400">No vouchers found.</p>
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

      <PayVoucherDrawer
        open={!!payVoucherItem}
        onClose={() => setPayVoucherItem(null)}
        onSuccess={fetchVouchers}
        voucher={payVoucherItem}
      />
    </div>
  );
}
