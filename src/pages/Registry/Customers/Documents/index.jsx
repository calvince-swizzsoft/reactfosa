import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Swal from "sweetalert2";
import NotFoundImage from "/assets/scopefinding.png";
import { FaEllipsisV, FaEdit, FaDownload, FaPlus, FaChevronLeft, FaChevronRight, FaFileAlt, FaSearch } from "react-icons/fa";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { listDocuments, updateDocument, downloadDocument } from "./api";
import CustomerLookupModal from "./CustomerLookupModal";

const DOCUMENT_TYPES = { 0: "General", 1: "Collateral" };

const formatDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
};

const customerName = (item) =>
  [item.IndividualFirstName, item.IndividualLastName].filter(Boolean).join(" ") ||
  item.NonIndividualDescription ||
  item.Description ||
  "—";

function FieldGroup({ label, children }) {
  return (
    <div>
      <Label className="text-sm font-semibold text-gray-700">{label}</Label>
      {children}
    </div>
  );
}

function EditDocumentDrawer({ open, onClose, onSuccess, item }) {
  const [customer, setCustomer] = useState(null);
  const [type, setType] = useState("0");
  const [fileTitle, setFileTitle] = useState("");
  const [fileDescription, setFileDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    if (item) {
      setCustomer({ Id: item.CustomerId, IndividualFirstName: item.CustomerIndividualFirstName, IndividualLastName: item.CustomerIndividualLastName, NonIndividualDescription: item.CustomerNonIndividualDescription });
      setType(String(item.Type ?? 0));
      setFileTitle(item.FileTitle || "");
      setFileDescription(item.FileDescription || "");
    }
  }, [item]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateDocument(item.Id, {
        customerId: customer?.Id ?? customer?.id,
        type: Number(type),
        fileTitle,
        fileDescription,
      });
      Swal.fire("Success", "Document updated successfully", "success");
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
          <motion.div className="fixed inset-0 bg-black z-40" initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div className="fixed top-5 right-3 w-[420px] bg-white shadow-xl z-50 flex flex-col rounded-2xl p-3" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
            <div className="p-4 flex justify-between items-center bg-indigo-600 rounded-2xl m-2">
              <h2 className="font-bold text-lg text-white">Edit Document</h2>
              <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <p className="text-xs text-gray-400">
                The attached file itself can't be swapped here — upload a new document instead if you need to replace it.
              </p>

              <FieldGroup label="Document Type">
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">General</SelectItem>
                    <SelectItem value="1">Collateral</SelectItem>
                  </SelectContent>
                </Select>
              </FieldGroup>

              <FieldGroup label="Customer">
                <button
                  type="button"
                  onClick={() => setPickerOpen(true)}
                  className="w-full flex items-center justify-between rounded-md border border-gray-300 py-2 px-3 text-sm text-left hover:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <span className={customer ? "text-gray-800" : "text-gray-400"}>
                    {customer ? customerName(customer) : "Look up customer..."}
                  </span>
                  <FaSearch className="text-gray-400" />
                </button>
              </FieldGroup>

              <FieldGroup label="Title">
                <Input value={fileTitle} onChange={(e) => setFileTitle(e.target.value)} required placeholder="e.g. National ID Scan" />
              </FieldGroup>

              <FieldGroup label="Description">
                <Input value={fileDescription} onChange={(e) => setFileDescription(e.target.value)} required placeholder="e.g. Front and back, certified copy" />
              </FieldGroup>

              <Button type="button" variant="outline" className="w-full flex items-center justify-center gap-2" onClick={() => downloadDocument(item.Id, item.FileTitle).catch((err) => Swal.fire("Error", err.message, "error"))}>
                <FaDownload /> Download Current File
              </Button>

              <Button type="submit" disabled={loading || !customer} className="w-full bg-indigo-600 hover:bg-indigo-700">
                {loading ? "Saving..." : "Update Document"}
              </Button>
            </form>
          </motion.div>

          {pickerOpen && (
            <CustomerLookupModal onSelect={setCustomer} onClose={() => setPickerOpen(false)} />
          )}
        </>
      )}
    </AnimatePresence>
  );
}

export default function CustomerDocuments() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editItem, setEditItem] = useState(null);
  const [search, setSearch] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize] = useState(20);
  const [itemsCount, setItemsCount] = useState(0);

  const fetchItems = () => {
    setLoading(true);
    listDocuments({ text: search, pageIndex, pageSize })
      .then(({ items: results, itemsCount: count }) => { setItems(results); setItemsCount(count); })
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

  const handleDownload = (item) => {
    downloadDocument(item.Id, item.FileTitle).catch((err) => Swal.fire("Error", err.message, "error"));
  };

  const hasNextPage = itemsCount ? (pageIndex + 1) * pageSize < itemsCount : items.length === pageSize;

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
      <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FaFileAlt /> Documents
        </h2>
        <Link
          to="/Registry/Customers/Documents/create"
          className="inline-flex items-center gap-2 rounded-md bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-sm font-medium text-white"
        >
          <FaPlus /> Upload Document
        </Link>
      </div>

      <div className="flex flex-wrap justify-between items-center mb-4 gap-3">
        <Input
          value={search}
          onChange={handleSearchChange}
          placeholder="Search by title, description, or customer..."
          className="max-w-xs"
        />
      </div>

      <div className="bg-gray-200 p-4 rounded-sm">
        <div className="grid grid-cols-12 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4">
          <span className="col-span-3">Title</span>
          <span className="col-span-2">Customer</span>
          <span className="col-span-1">Type</span>
          <span className="col-span-3">Description</span>
          <span className="col-span-1">Uploaded</span>
          <span className="col-span-2 text-right">Actions</span>
        </div>

        {loading ? (
          <div className="space-y-2 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="grid grid-cols-12 gap-2 bg-gray-50 p-6 rounded">
                {Array.from({ length: 12 }).map((_, j) => (
                  <div key={j} className="h-4 bg-gray-200 rounded"></div>
                ))}
              </div>
            ))}
          </div>
        ) : items.length > 0 ? (
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.Id} className="bg-white rounded-lg shadow-lg border">
                <div className="grid grid-cols-12 gap-2 items-center py-4 px-6 hover:shadow-xl transition-all">
                  <span className="col-span-3 font-medium text-indigo-700 truncate">{item.FileTitle}</span>
                  <span className="col-span-2 text-sm text-gray-700 truncate">{item.CustomerFullName?.trim() || "—"}</span>
                  <span className="col-span-1">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${item.Type === 1 ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"}`}>
                      {item.TypeDescription || DOCUMENT_TYPES[item.Type] || "—"}
                    </span>
                  </span>
                  <span className="col-span-3 text-sm text-gray-500 truncate">{item.FileDescription || "—"}</span>
                  <span className="col-span-1 text-xs text-gray-500">{formatDate(item.CreatedDate)}</span>
                  <div className="col-span-2 flex justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><FaEllipsisV className="text-gray-500" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleDownload(item)}>
                          <FaDownload className="mr-2 text-indigo-600" /> Download
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setEditItem(item)}>
                          <FaEdit className="mr-2 text-indigo-600" /> Edit
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-center mt-4">
            <img src={NotFoundImage} alt="Not Found" className="mx-auto w-42" />
            <p className="font-medium text-gray-400">No documents found.</p>
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

      <EditDocumentDrawer open={!!editItem} onClose={() => setEditItem(null)} onSuccess={fetchItems} item={editItem} />
    </div>
  );
}
