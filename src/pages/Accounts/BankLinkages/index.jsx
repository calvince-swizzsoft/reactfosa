import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Swal from "sweetalert2";
import NotFoundImage from "/assets/scopefinding.png";
import { FaExchangeAlt, FaEdit, FaPlus, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import BankLinkageForm from "./BankLinkageForm";
import { listBankLinkages, updateBankLinkage } from "./api";

function EditBankLinkageDrawer({ open, onClose, onSuccess, item }) {
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (item) {
      setForm({
        BankId: item.BankId || "",
        BankName: item.BankName || "",
        BankAccountNumber: item.BankAccountNumber || "",
        BankBranchName: item.BankBranchName || "",
        BranchId: item.BranchId || "",
        BranchDescription: item.BranchDescription || "",
        ChartOfAccountId: item.ChartOfAccountId || "",
        ChartOfAccountAccountType: item.ChartOfAccountAccountType ?? "",
        ChartOfAccountAccountCode: item.ChartOfAccountAccountCode ?? "",
        ChartOfAccountAccountName: item.ChartOfAccountAccountName || "",
        ChartOfAccountCostCenterId: item.ChartOfAccountCostCenterId || "",
        Remarks: item.Remarks || "",
        IsLocked: !!item.IsLocked,
      });
    }
  }, [item]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateBankLinkage(item.Id, { ...form, ChartOfAccountCostCenterId: form.ChartOfAccountCostCenterId || null });
      Swal.fire("Success", "Bank linkage updated successfully", "success");
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
      {open && form && (
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
              <h2 className="font-bold text-lg text-white">Edit Bank Linkage</h2>
              <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
            </div>
            <div className="p-4">
              <BankLinkageForm form={form} setForm={setForm} loading={loading} submitLabel="Update Bank Linkage" onSubmit={handleSubmit} />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default function BankLinkages() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editItem, setEditItem] = useState(null);
  const [search, setSearch] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize] = useState(20);
  const [itemsCount, setItemsCount] = useState(0);

  const fetchItems = () => {
    setLoading(true);
    listBankLinkages({ text: search, pageIndex, pageSize })
      .then((page) => {
        setItems(page?.pageCollection || page?.PageCollection || []);
        setItemsCount(page?.itemsCount || page?.ItemsCount || 0);
      })
      .catch(() => { setItems([]); setItemsCount(0); })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, pageIndex]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPageIndex(0);
  };

  const hasNextPage = itemsCount ? (pageIndex + 1) * pageSize < itemsCount : items.length === pageSize;

  // No delete action — IBankLinkageAppService doesn't expose one
  // (bank-linkage-api-spec.md §5.6).
  //
  // bankLinkageBalance and the denormalized bank display fields
  // (address/city/swiftCode/ibanNo) are NOT populated by this controller
  // (§4) — only ValuesController.getBankWithLinkages computes those, so
  // this list intentionally doesn't show a live balance column the way
  // CashManagement.jsx's picker or the legacy combined screen do.

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
      <div className="flex justify-between items-center mb-6 bg-indigo-700 px-6 py-3 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FaExchangeAlt /> Bank Linkages
        </h2>
        <Link
          to="/Accounts/BankLinkages/create"
          className="inline-flex items-center gap-2 rounded-md bg-indigo-500 hover:bg-indigo-600 px-4 py-2 text-sm font-medium text-white"
        >
          <FaPlus /> Add Bank Linkage
        </Link>
      </div>

      <div className="mb-3">
        <Input value={search} onChange={handleSearchChange} placeholder="Search..." className="max-w-xs" />
      </div>

      <div className="bg-gray-200 p-4 rounded-sm">
        <div className="grid grid-cols-12 gap-2 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-3">
          <span className="col-span-3">Bank</span>
          <span className="col-span-2">Account Number</span>
          <span className="col-span-2">Our Branch</span>
          <span className="col-span-3">Chart of Account</span>
          <span className="col-span-1">Status</span>
          <span className="col-span-1 text-right">Actions</span>
        </div>

        {loading ? (
          <div className="space-y-2 animate-pulse">
            {[1, 2, 3].map((i) => <div key={i} className="h-12 bg-gray-100 rounded-lg" />)}
          </div>
        ) : items.length > 0 ? (
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.Id} className="grid grid-cols-12 gap-2 items-center bg-white px-4 py-3 rounded-lg shadow border">
                <span className="col-span-3 font-medium text-indigo-700 truncate">{item.BankName}</span>
                <span className="col-span-2 text-sm text-gray-600">{item.BankAccountNumber}</span>
                <span className="col-span-2 text-sm text-gray-600 truncate">{item.BranchDescription || "—"}</span>
                <span className="col-span-3 text-sm text-gray-600 truncate">{item.ChartOfAccountAccountName || "—"}</span>
                <span className="col-span-1">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${item.IsLocked ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}>
                    {item.IsLocked ? "Locked" : "Active"}
                  </span>
                </span>
                <div className="col-span-1 flex justify-end">
                  <Button size="sm" variant="outline" onClick={() => setEditItem(item)} className="flex items-center gap-1">
                    <FaEdit className="text-indigo-600" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center mt-4">
            <img src={NotFoundImage} alt="Not Found" className="mx-auto w-32 h-auto" />
            <p className="text-gray-400 mt-2">No bank linkages found.</p>
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

      <EditBankLinkageDrawer open={!!editItem} onClose={() => setEditItem(null)} onSuccess={fetchItems} item={editItem} />
    </div>
  );
}
