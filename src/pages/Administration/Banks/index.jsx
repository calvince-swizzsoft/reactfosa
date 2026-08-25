import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Swal from "sweetalert2";
import NotFoundImage from "/assets/scopefinding.png";
import { FaUniversity, FaEdit, FaPlus, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import BankBranchesFields, { emptyBranch } from "./BankBranchesFields";
import { listBanks, getBankBranches, updateBank } from "./api";
import { apiErrorMessage } from "@/lib/api";

function FieldGroup({ label, children }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function EditBankDrawer({ open, onClose, onSuccess, item }) {
  const [form, setForm] = useState({ Code: "", Description: "", Address: "", City: "", IbanNo: "", SwiftCode: "" });
  const [branches, setBranches] = useState([{ ...emptyBranch }]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!item) return;
    setForm({
      Code: item.Code ?? "",
      Description: item.Description || "",
      Address: item.Address || "",
      City: item.City || "",
      IbanNo: item.IbanNo || "",
      SwiftCode: item.SwiftCode || "",
    });
    setLoadingBranches(true);
    getBankBranches(item.Id)
      .then((rows) => setBranches(rows && rows.length ? rows : [{ ...emptyBranch }]))
      .catch((error) => {
        setBranches([{ ...emptyBranch }]);
        Swal.fire("Error", apiErrorMessage(error, "Unable to load bank branches."), "error");
      })
      .finally(() => setLoadingBranches(false));
  }, [item]);

  const handleChange = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateBank(
        item.Id,
        { ...form, Code: Number(form.Code) || 0 },
        branches.filter((b) => b.Description.trim())
      );
      Swal.fire("Success", "Bank updated successfully", "success");
      onSuccess();
      onClose();
    } catch (err) {
      Swal.fire("Error", apiErrorMessage(err, "Unable to update the bank."), "error");
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
            className="fixed top-5 right-3 w-[560px] bg-white shadow-xl z-50 flex flex-col rounded-2xl p-3 max-h-[95vh] overflow-y-auto"
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="p-4 flex justify-between items-center bg-indigo-600 rounded-2xl m-2">
              <h2 className="font-bold text-lg text-white">Edit Bank</h2>
              <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-6">
              <div className="grid grid-cols-2 gap-3">
                <FieldGroup label="Bank Name">
                  <Input value={form.Description} onChange={(e) => handleChange("Description", e.target.value)} required />
                </FieldGroup>
                <FieldGroup label="Code">
                  <Input type="number" value={form.Code} onChange={(e) => handleChange("Code", e.target.value)} required />
                </FieldGroup>
                <FieldGroup label="Address">
                  <Input value={form.Address} onChange={(e) => handleChange("Address", e.target.value)} required />
                </FieldGroup>
                <FieldGroup label="City">
                  <Input value={form.City} onChange={(e) => handleChange("City", e.target.value)} required />
                </FieldGroup>
                <FieldGroup label="Swift Code">
                  <Input value={form.SwiftCode} onChange={(e) => handleChange("SwiftCode", e.target.value)} required />
                </FieldGroup>
                <FieldGroup label="IBAN No">
                  <Input value={form.IbanNo} onChange={(e) => handleChange("IbanNo", e.target.value)} required />
                </FieldGroup>
              </div>

              <div>
                <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                  {loadingBranches ? "Loading branches..." : "Branches"}
                </Label>
                <BankBranchesFields branches={branches} onChange={setBranches} />
              </div>

              <Button type="submit" disabled={loading || loadingBranches} className="w-full bg-indigo-600 hover:bg-indigo-700">
                {loading ? "Saving..." : "Update Bank"}
              </Button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default function Banks() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editItem, setEditItem] = useState(null);
  const [search, setSearch] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize] = useState(20);
  const [itemsCount, setItemsCount] = useState(0);

  const fetchItems = () => {
    setLoading(true);
    listBanks({ text: search, pageIndex, pageSize })
      .then((page) => {
        setItems(page?.pageCollection || page?.PageCollection || []);
        setItemsCount(page?.itemsCount || page?.ItemsCount || 0);
      })
      .catch((error) => {
        setItems([]);
        setItemsCount(0);
        Swal.fire("Error", apiErrorMessage(error, "Unable to load banks."), "error");
      })
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

  // No delete action here — IBankAppService has no delete operation
  // (bank-api-spec.md's history note: the old raw-SQL branch-delete was
  // deliberately not ported).

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
      <div className="flex justify-between items-center mb-6 bg-indigo-700 px-6 py-3 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FaUniversity /> Banks
        </h2>
        <Link
          to="/Administration/Banks/create"
          className="inline-flex items-center gap-2 rounded-md bg-indigo-500 hover:bg-indigo-600 px-4 py-2 text-sm font-medium text-white"
        >
          <FaPlus /> Add Bank
        </Link>
      </div>

      <div className="mb-3">
        <Input value={search} onChange={handleSearchChange} placeholder="Search by code or name..." className="max-w-xs" />
      </div>

      <div className="bg-gray-200 p-4 rounded-sm">
        <div className="grid grid-cols-12 gap-2 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-3">
          <span className="col-span-1">Code</span>
          <span className="col-span-3">Bank Name</span>
          <span className="col-span-2">City</span>
          <span className="col-span-2">Swift Code</span>
          <span className="col-span-2">IBAN No</span>
          <span className="col-span-2 text-right">Actions</span>
        </div>

        {loading ? (
          <div className="space-y-2 animate-pulse">
            {[1, 2, 3].map((i) => <div key={i} className="h-12 bg-gray-100 rounded-lg" />)}
          </div>
        ) : items.length > 0 ? (
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.Id} className="grid grid-cols-12 gap-2 items-center bg-white px-4 py-3 rounded-lg shadow border">
                <span className="col-span-1 font-mono text-xs text-gray-500">{item.PaddedCode}</span>
                <span className="col-span-3 font-medium text-indigo-700">{item.Description}</span>
                <span className="col-span-2 text-sm text-gray-600">{item.City || "—"}</span>
                <span className="col-span-2 text-sm text-gray-600">{item.SwiftCode || "—"}</span>
                <span className="col-span-2 text-sm text-gray-600">{item.IbanNo || "—"}</span>
                <div className="col-span-2 flex justify-end">
                  <Button size="sm" variant="outline" onClick={() => setEditItem(item)} className="flex items-center gap-1">
                    <FaEdit className="text-indigo-600" /> Edit
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center mt-4">
            <img src={NotFoundImage} alt="Not Found" className="mx-auto w-32 h-auto" />
            <p className="text-gray-400 mt-2">No banks found.</p>
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

      <EditBankDrawer open={!!editItem} onClose={() => setEditItem(null)} onSuccess={fetchItems} item={editItem} />
    </div>
  );
}
