import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Swal from "sweetalert2";
import { FaTrash, FaChevronDown, FaChevronUp } from "react-icons/fa";
import { IoIosArrowDropleftCircle } from "react-icons/io";

export default function UpdateSalesInvoiceDrawer({ open, onClose, onSuccess, invoice }) {
  const [formData, setFormData] = useState({
    Id: "",
    No: 0,
    CustomerNo: 0,
    CustomerName: "",
    CustomerAddress: "",
    DocumentDate: new Date().toISOString().split("T")[0],
    PostingDate: new Date().toISOString().split("T")[0],
    DueDate: new Date().toISOString().split("T")[0],
    ApprovalStatus: "Pending",
    SalesInvoiceLines: [],
  });

  const [loading, setLoading] = useState(false);
  const [showLinesDrawer, setShowLinesDrawer] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [invoiceTypes, setInvoiceTypes] = useState([]);
  const [chartOfAccounts, setChartOfAccounts] = useState([]);

  // Preload invoice
  useEffect(() => {
    if (invoice) {
      setFormData({
        Id: invoice.Id ?? "",
        No: invoice.No ?? 0,
        CustomerNo: invoice.CustomerNo ?? 0,
        CustomerName: invoice.CustomerName ?? "",
        CustomerAddress: invoice.CustomerAddress ?? "",
        DocumentDate: invoice.DocumentDate?.split?.("T")?.[0] ?? new Date().toISOString().split("T")[0],
        PostingDate: invoice.PostingDate?.split?.("T")?.[0] ?? new Date().toISOString().split("T")[0],
        DueDate: invoice.DueDate?.split?.("T")?.[0] ?? new Date().toISOString().split("T")[0],
        ApprovalStatus: invoice.ApprovalStatus ?? "Pending",
        SalesInvoiceLines: Array.isArray(invoice.SalesInvoiceLines)
          ? invoice.SalesInvoiceLines.map((l) => ({
              SalesInvoiceId: l.SalesInvoiceId ?? invoice.Id,
              SalesInvoiceNo: l.SalesInvoiceNo ?? invoice.No,
              Type: l.Type ?? 0,
              TypeDescription: l.TypeDescription ?? "",
              No: l.No ?? 0,
              Description: l.Description ?? "",
              Quantity: l.Quantity ?? 0,
              TotalValue: l.TotalValue ?? 0,
              CreditChartOfAccountId: l.CreditChartOfAccountId ?? "00000000-0000-0000-0000-000000000000",
            }))
          : [],
      });
    }
  }, [invoice]);

  // Fetch invoice types + chart of accounts
  useEffect(() => {
    fetch(`${import.meta.env.VITE_APP_FIN_URL}/api/values/GetPurchaseInvoiceEntryTypes`, {
      headers: { "ngrok-skip-browser-warning": "true" },
    })
      .then((r) => r.json())
      .then((data) => setInvoiceTypes(Array.isArray(data) ? data : data.Data || data))
      .catch((err) => {
        console.error("Error fetching invoice types:", err);
        setInvoiceTypes([]);
      });

    fetch(`${import.meta.env.VITE_APP_FIN_URL}/api/values/GetChartOfAccount`, {
      headers: { "ngrok-skip-browser-warning": "true" },
    })
      .then((r) => r.json())
      .then((data) => {
        const accounts = Array.isArray(data) ? data : data.Data || [];
        setChartOfAccounts(accounts);
      })
      .catch((err) => {
        console.error("Error fetching chart of accounts:", err);
        setChartOfAccounts([]);
      });
  }, []);

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleLineChange = (index, field, value) => {
    const updated = [...formData.SalesInvoiceLines];
    if (field === "Quantity" || field === "TotalValue") {
      updated[index][field] = parseFloat(value) || 0;
    } else if (field === "Type") {
      updated[index][field] = parseInt(value) || 0;
    } else {
      updated[index][field] = value;
    }
    setFormData((prev) => ({ ...prev, SalesInvoiceLines: updated }));
  };

  const addLine = () => {
    setFormData((prev) => ({
      ...prev,
      SalesInvoiceLines: [
        ...prev.SalesInvoiceLines,
        {
          SalesInvoiceId: prev.Id,
          SalesInvoiceNo: prev.No,
          Type: 0,
          TypeDescription: "",
          No: prev.SalesInvoiceLines.length + 1,
          Description: "",
          Quantity: 0,
          TotalValue: 0,
          CreditChartOfAccountId: "00000000-0000-0000-0000-000000000000",
        },
      ],
    }));
    setExpandedIndex(formData.SalesInvoiceLines.length);
  };

  const removeLine = (index) => {
    const updated = [...formData.SalesInvoiceLines];
    updated.splice(index, 1);
    const renumbered = updated.map((l, i) => ({ ...l, No: i + 1 }));
    setFormData((prev) => ({ ...prev, SalesInvoiceLines: renumbered }));
    setExpandedIndex(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_APP_FIN_URL}/api/values/UpdateSalesInvoice`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to update sales invoice");

      Swal.fire("Success", data?.message || "Invoice updated successfully", "success");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      Swal.fire("Error", err?.message || "Update failed", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            className="fixed top-5 right-3 w-[500px] bg-white shadow-xl z-50 flex flex-col rounded-2xl p-3"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="p-4 flex justify-between items-center bg-indigo-600 rounded-2xl m-2">
              <h2 className="font-bold text-lg text-white">Update Sales Invoice</h2>
              <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
            </div>

            <div className="p-3 flex-1 overflow-y-auto">
              <form onSubmit={handleSubmit} className="space-y-4">
                <input type="hidden" value={formData.Id} />

                <div>
                  <Label>Customer No</Label>
                  <Input
                    type="number"
                    value={formData.CustomerNo}
                    onChange={(e) => handleFieldChange("CustomerNo", parseInt(e.target.value) || 0)}
                  />
                </div>

                <div>
                  <Label>Customer Name</Label>
                  <Input
                    value={formData.CustomerName ?? ""}
                    onChange={(e) => handleFieldChange("CustomerName", e.target.value)}
                  />
                </div>

                <div>
                  <Label>Customer Address</Label>
                  <Input
                    value={formData.CustomerAddress ?? ""}
                    onChange={(e) => handleFieldChange("CustomerAddress", e.target.value)}
                  />
                </div>

                <div className="flex gap-2">
                  <div>
                    <Label>Document Date</Label>
                    <Input
                      type="date"
                      value={formData.DocumentDate}
                      onChange={(e) => handleFieldChange("DocumentDate", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Posting Date</Label>
                    <Input
                      type="date"
                      value={formData.PostingDate}
                      onChange={(e) => handleFieldChange("PostingDate", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Due Date</Label>
                    <Input
                      type="date"
                      value={formData.DueDate}
                      onChange={(e) => handleFieldChange("DueDate", e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label>Approval Status</Label>
                  <Select
                    value={formData.ApprovalStatus}
                    onValueChange={(val) => handleFieldChange("ApprovalStatus", val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Approved">Approved</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  type="button"
                  onClick={() => setShowLinesDrawer(true)}
                  className="bg-gray-700 w-full flex justify-between gap-2"
                >
                  <IoIosArrowDropleftCircle /> Edit Invoice Lines ({formData.SalesInvoiceLines.length})
                </Button>

                <Button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700">
                  {loading ? "Updating..." : "Update Invoice"}
                </Button>
              </form>
            </div>
          </motion.div>

          {/* Lines Drawer */}
          <AnimatePresence>
            {showLinesDrawer && (
              <>
                <motion.div
                  className="fixed inset-0 bg-black z-48"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.3 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowLinesDrawer(false)}
                />
                <motion.div
                  className="fixed top-5 right-[520px] w-[450px] max-h-[90vh] bg-white shadow-xl z-48 flex flex-col rounded-2xl p-3"
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  <div className="p-4 flex justify-between items-center bg-indigo-600 rounded-2xl m-2">
                    <h2 className="font-bold text-lg text-white">Invoice Lines</h2>
                    <Button variant="outline" size="sm" onClick={() => setShowLinesDrawer(false)}>Close</Button>
                  </div>

                  <div className="p-3 flex-1 overflow-y-auto space-y-2">
                    {formData.SalesInvoiceLines.map((line, idx) => (
                      <div key={idx} className="border rounded-lg">
                        <div
                          className="flex justify-between items-center p-2 bg-gray-100 cursor-pointer"
                          onClick={() => setExpandedIndex(expandedIndex === idx ? null : idx)}
                        >
                          <span className="font-semibold">Line {idx + 1} - {line.Description || "New Line"}</span>
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              className="text-red-600 hover:text-red-800"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeLine(idx);
                              }}
                            >
                              <FaTrash />
                            </button>
                            {expandedIndex === idx ? <FaChevronUp /> : <FaChevronDown />}
                          </div>
                        </div>

                        <AnimatePresence>
                          {expandedIndex === idx && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden p-2 space-y-2"
                            >
                              <div>
                                <Label>Type</Label>
                                <Select
                                  value={String(line.Type ?? 0)}
                                  onValueChange={(val) => handleLineChange(idx, "Type", parseInt(val))}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select Type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {invoiceTypes.map((t) => (
                                      <SelectItem key={t.Value ?? t.Id} value={String(t.Value ?? "")}>
                                        {t.Text ?? String(t)}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div>
                                <Label>Credit Account</Label>
                                <Select
                                  value={line.CreditChartOfAccountId ?? ""}
                                  onValueChange={(val) => handleLineChange(idx, "CreditChartOfAccountId", val)}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select Account" />
                                  </SelectTrigger>
                                  <SelectContent className="max-h-100 overflow-y-auto">
                                    {chartOfAccounts.map((acc, i) => (
                                      <SelectItem key={acc.Id ?? i} value={String(acc.Id)}>
                                        {acc.AccountName ?? acc.Name ?? `Account ${i + 1}`}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <Input placeholder="Description" value={line.Description} onChange={(e) => handleLineChange(idx, "Description", e.target.value)} />
                              <Input type="number" placeholder="Quantity" value={line.Quantity} onChange={(e) => handleLineChange(idx, "Quantity", e.target.value)} />
                              <Input type="number" placeholder="Total Value" value={line.TotalValue} onChange={(e) => handleLineChange(idx, "TotalValue", e.target.value)} />
                              <Input placeholder="Type Description" value={line.TypeDescription} onChange={(e) => handleLineChange(idx, "TypeDescription", e.target.value)} />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}

                    <Button type="button" onClick={addLine} className="bg-indigo-600 w-full">+ Add Line</Button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
}
