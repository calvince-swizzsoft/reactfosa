// import { useState, useEffect } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import Swal from "sweetalert2";
// import { FaTrash, FaChevronDown, FaChevronUp } from "react-icons/fa";
// import { IoIosArrowDropleftCircle } from "react-icons/io";

// export default function UpdatePurchaseCreditMemoDrawer({ open, onClose, onSuccess, creditMemo}) {
//   const [formData, setFormData] = useState({
//     Id: "",
//     VendorNo: 0,
//     VendorName: "",
//     VendorAddress: "",
//     DocumentDate: new Date().toISOString().split("T")[0],
//     PostingDate: new Date().toISOString().split("T")[0],
//     DueDate: new Date().toISOString().split("T")[0],
//     ApprovalStatus: "Pending",
//     PurchaseInvoiceId: "",
//     PurchaseCreditMemoLines: [],
//   });

//   const [loading, setLoading] = useState(false);
//   const [showLinesDrawer, setShowLinesDrawer] = useState(false);
//   const [expandedIndex, setExpandedIndex] = useState(null);
//   const [memoTypes, setMemoTypes] = useState([]);
//   const [chartOfAccounts, setChartOfAccounts] = useState([]);

//   // Preload credit memo
//   useEffect(() => {
//     if (creditMemo) {
//       setFormData({
//         Id: creditMemo.Id ?? "",
//         VendorNo: creditMemo.VendorNo ?? 0,
//         VendorName: creditMemo.VendorName ?? "",
//         VendorAddress: creditMemo.VendorAddress ?? "",
//         DocumentDate: creditMemo.DocumentDate?.split?.("T")?.[0] ?? creditMemo.DocumentDate ?? new Date().toISOString().split("T")[0],
//         PostingDate: creditMemo.PostingDate?.split?.("T")?.[0] ?? creditMemo.PostingDate ?? new Date().toISOString().split("T")[0],
//         DueDate: creditMemo.DueDate?.split?.("T")?.[0] ?? creditMemo.DueDate ?? new Date().toISOString().split("T")[0],
//         ApprovalStatus: creditMemo.ApprovalStatus ?? "Pending",
//         PurchaseInvoiceId: creditMemo.PurchaseInvoiceId ?? "",
//         PurchaseCreditMemoLines: Array.isArray(creditMemo.PurchaseCreditMemoLines)
//           ? creditMemo.PurchaseCreditMemoLines
//           : [],
//       });
//     }
//   }, [creditMemo]);

//   const handleFieldChange = (field, value) => {
//     setFormData((prev) => ({ ...prev, [field]: value }));
//   };

//   const handleLineChange = (index, field, value) => {
//     const updated = [...formData.PurchaseCreditMemoLines];
//     if (field === "Quantity" || field === "TotalAmount") {
//       updated[index][field] = parseFloat(value) || 0;
//     } else if (field === "Type") {
//       updated[index][field] = parseInt(value) || 0;
//     } else {
//       updated[index][field] = value;
//     }
//     setFormData((prev) => ({ ...prev, PurchaseCreditMemoLines: updated }));
//   };

//   const addLine = () => {
//     setFormData((prev) => ({
//       ...prev,
//       PurchaseCreditMemoLines: [
//         ...prev.PurchaseCreditMemoLines,
//         {
//           Type: 0,
//           No: prev.PurchaseCreditMemoLines.length + 1,
//           CreditChartOfAccountId: "",
//           Description: "",
//           Quantity: 0,
//           TotalAmount: 0,
//         },
//       ],
//     }));
//     setExpandedIndex(formData.PurchaseCreditMemoLines.length);
//   };

//   const removeLine = (index) => {
//     const updated = [...formData.PurchaseCreditMemoLines];
//     updated.splice(index, 1);
//     setFormData((prev) => ({ ...prev, PurchaseCreditMemoLines: updated }));
//     setExpandedIndex(null);
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     try {
//       const res = await fetch(
//         "https://0e05b3ea37cd.ngrok-free.app/api/values/UpdatePurchaseCreditMemo",
//         {
//           method: "PUT",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify(formData),
//         }
//       );
//       const data = await res.json();
//       if (!res.ok) throw new Error(data?.message || "Failed to update credit memo");
//       Swal.fire("Success", data?.message || "Credit Memo updated", "success");
//       if (onSuccess) onSuccess();
//       onClose();
//     } catch (err) {
//       Swal.fire("Error", err.message || "Update failed", "error");
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (!open) return null;



//   useEffect(() => {
//   // Fetch Chart of Accounts
//   fetch("https://0e05b3ea37cd.ngrok-free.app/api/values/GetChartOfAccount", {
//        headers: { "ngrok-skip-browser-warning": "true" }
//   })
//     .then((res) => res.json())
//     .then((data) => setChartOfAccounts(Array.isArray(data) ? data : data.Data || []))
//     .catch(() => setChartOfAccounts([]));

//   // Fetch Memo Types
//   fetch("https://0e05b3ea37cd.ngrok-free.app/api/values/GetPurchaseInvoiceEntryTypes", {
//        headers: { "ngrok-skip-browser-warning": "true" }
//   })
//     .then((res) => res.json())
//     .then((data) => setMemoTypes(data || []))
//     .catch(() => setMemoTypes([]));
// }, []);


//   return (
//     <AnimatePresence>
//       {open && (
//         <>
//           <motion.div
//             className="fixed inset-0 bg-black z-40"
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 0.4 }}
//             exit={{ opacity: 0 }}
//             onClick={onClose}
//           />
//           <motion.div
//             className="fixed top-5 right-3 w-[500px] bg-white shadow-xl z-50 flex flex-col rounded-2xl p-3"
//             initial={{ x: "100%" }}
//             animate={{ x: 0 }}
//             exit={{ x: "100%" }}
//             transition={{ type: "spring", stiffness: 300, damping: 30 }}
//           >
//             <div className="p-4 flex justify-between items-center bg-indigo-600 rounded-2xl m-2">
//               <h2 className="font-bold text-lg text-white">Update Purchase Credit Memo</h2>
//               <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
//             </div>

//             <div className="p-3 flex-1 overflow-y-auto">
//               <form onSubmit={handleSubmit} className="space-y-4">
//                 <Input type="hidden" value={formData.Id} />

//                 <div>
//                   <Label>Vendor No</Label>
//                   <Input type="number" value={formData.VendorNo} onChange={e => handleFieldChange("VendorNo", parseInt(e.target.value) || 0)} />
//                 </div>

//                 <div>
//                   <Label>Vendor Name</Label>
//                   <Input value={formData.VendorName} onChange={e => handleFieldChange("VendorName", e.target.value)} />
//                 </div>

//                 <div>
//                   <Label>Vendor Address</Label>
//                   <Input value={formData.VendorAddress} onChange={e => handleFieldChange("VendorAddress", e.target.value)} />
//                 </div>

//                 <div className="flex gap-2">
//                   <div>
//                     <Label>Document Date</Label>
//                     <Input type="date" value={formData.DocumentDate} onChange={e => handleFieldChange("DocumentDate", e.target.value)} />
//                   </div>
//                   <div>
//                     <Label>Posting Date</Label>
//                     <Input type="date" value={formData.PostingDate} onChange={e => handleFieldChange("PostingDate", e.target.value)} />
//                   </div>
//                   <div>
//                     <Label>Due Date</Label>
//                     <Input type="date" value={formData.DueDate} onChange={e => handleFieldChange("DueDate", e.target.value)} />
//                   </div>
//                 </div>

//                 <div>
//                   <Label>Approval Status</Label>
//                   <Select value={formData.ApprovalStatus} onValueChange={val => handleFieldChange("ApprovalStatus", val)}>
//                     <SelectTrigger><SelectValue placeholder="Select Status" /></SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="Approved">Approved</SelectItem>
//                       <SelectItem value="Pending">Pending</SelectItem>
//                       <SelectItem value="Rejected">Rejected</SelectItem>
//                     </SelectContent>
//                   </Select>
//                 </div>

//                 <Button type="button" onClick={() => setShowLinesDrawer(true)} className="bg-gray-700 w-full flex justify-between gap-2">
//                   <IoIosArrowDropleftCircle /> Edit Credit Memo Lines ({formData.PurchaseCreditMemoLines.length})
//                 </Button>

//                 <Button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700">
//                   {loading ? "Updating..." : "Update Credit Memo"}
//                 </Button>
//               </form>
//             </div>
//           </motion.div>

//           {/* Lines Drawer */}
//           {/* Lines Drawer */}
// <AnimatePresence>
//   {showLinesDrawer && (
//     <>
//       <motion.div
//         className="fixed inset-0 bg-black z-48"
//         initial={{ opacity: 0 }}
//         animate={{ opacity: 0.3 }}
//         exit={{ opacity: 0 }}
//         onClick={() => setShowLinesDrawer(false)}
//       />
//       <motion.div
//         className="fixed top-5 right-[520px] w-[450px] max-h-[90vh] bg-white shadow-xl z-48 flex flex-col rounded-2xl p-3"
//         initial={{ x: "100%" }}
//         animate={{ x: 0 }}
//         exit={{ x: "100%" }}
//         transition={{ type: "spring", stiffness: 300, damping: 30 }}
//       >
//         <div className="p-4 flex justify-between items-center bg-indigo-600 rounded-2xl m-2">
//           <h2 className="font-bold text-lg text-white">Credit Memo Lines</h2>
//           <Button variant="outline" size="sm" onClick={() => setShowLinesDrawer(false)}>Close</Button>
//         </div>

//         <div className="p-3 flex-1 overflow-y-auto space-y-2">
//           {formData.PurchaseCreditMemoLines.map((line, idx) => (
//             <div key={line.Id || idx} className="border rounded-lg">
//               <div className="flex justify-between items-center p-2 bg-gray-100 cursor-pointer"
//                 onClick={() => setExpandedIndex(expandedIndex === idx ? null : idx)}>
//                 <span className="font-semibold">Line {idx + 1} - {line.Description || "New Line"}</span>
//                 <div className="flex items-center gap-3">
//                   <button type="button" className="text-red-600 hover:text-red-800" onClick={e => { e.stopPropagation(); removeLine(idx); }}>
//                     <FaTrash />
//                   </button>
//                   {expandedIndex === idx ? <FaChevronUp /> : <FaChevronDown />}
//                 </div>
//               </div>

//               <AnimatePresence>
//                 {expandedIndex === idx && (
//                   <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden p-2 space-y-2">
                    
//                     {/* Type Dropdown */}
//                     <Select
//                       value={line.Type?.toString() || ""}
//                       onValueChange={(val) => handleLineChange(idx, "Type", parseInt(val))}
//                     >
//                       <SelectTrigger>
//                         <SelectValue placeholder="Select Type" />
//                       </SelectTrigger>
//                       <SelectContent>
//                         {memoTypes.map((t) => (
//                           <SelectItem key={t.Value} value={t.Value.toString()}>{t.Text}</SelectItem>
//                         ))}
//                       </SelectContent>
//                     </Select>

//                     {/* No Dropdown */}
//                     <Select
//                       value={line.No?.toString() || ""}
//                       onValueChange={(val) => handleLineChange(idx, "No", parseInt(val))}
//                     >
//                       <SelectTrigger>
//                         <SelectValue placeholder="Select No" />
//                       </SelectTrigger>
//                       <SelectContent>
//                         {formData.PurchaseCreditMemoLines.map((l, i) => (
//                           <SelectItem key={i} value={(i + 1).toString()}>{i + 1}</SelectItem>
//                         ))}
//                       </SelectContent>
//                     </Select>

//                     {/* Chart of Accounts Dropdown */}
//                     <Select
//                       value={line.CreditChartOfAccountId?.toString() || ""}
//                       onValueChange={(val) => handleLineChange(idx, "CreditChartOfAccountId", val)}
//                     >
//                       <SelectTrigger>
//                         <SelectValue placeholder="Select Account" />
//                       </SelectTrigger>
//                       <SelectContent className="max-h-100 overflow-y-auto">
//                         {chartOfAccounts.map((acc, index) => (
//                           <SelectItem key={`${acc.Id}-${index}`} value={acc.Id.toString()}>
//                             {acc.AccountName}
//                           </SelectItem>
//                         ))}
//                       </SelectContent>
//                     </Select>

//                     <Input placeholder="Description" value={line.Description} onChange={e => handleLineChange(idx, "Description", e.target.value)} />
//                     <Input type="number" placeholder="Quantity" value={line.Quantity} onChange={e => handleLineChange(idx, "Quantity", e.target.value)} />
//                     <Input type="number" placeholder="Total Amount" value={line.TotalAmount} onChange={e => handleLineChange(idx, "TotalAmount", e.target.value)} />
//                   </motion.div>
//                 )}
//               </AnimatePresence>
//             </div>
//           ))}
//           <Button type="button" onClick={addLine} className="bg-indigo-600 w-full">+ Add Line</Button>
//         </div>
//       </motion.div>
//     </>
//   )}
// </AnimatePresence>

//         </>
//       )}
//     </AnimatePresence>
//   );
// }












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
import { nanoid } from "nanoid";

export default function UpdatePurchaseCreditMemoDrawer({ open, onClose, onSuccess, creditMemo }) {
  const [formData, setFormData] = useState({
    Id: "",
    VendorNo: 0,
    VendorName: "",
    VendorAddress: "",
    DocumentDate: new Date().toISOString().split("T")[0],
    PostingDate: new Date().toISOString().split("T")[0],
    DueDate: new Date().toISOString().split("T")[0],
    ApprovalStatus: "Pending",
    PurchaseInvoiceId: "",
    PurchaseCreditMemoLines: [],
  });

  const [chartOfAccounts, setChartOfAccounts] = useState([]);
  const [memoTypes, setMemoTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showLinesDrawer, setShowLinesDrawer] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState(null);

  // Preload credit memo
  useEffect(() => {
    if (creditMemo) {
      setFormData({
        Id: creditMemo.Id ?? "",
        VendorNo: creditMemo.VendorNo ?? 0,
        VendorName: creditMemo.VendorName ?? "",
        VendorAddress: creditMemo.VendorAddress ?? "",
        DocumentDate: creditMemo.DocumentDate?.split?.("T")?.[0] ?? creditMemo.DocumentDate ?? new Date().toISOString().split("T")[0],
        PostingDate: creditMemo.PostingDate?.split?.("T")?.[0] ?? creditMemo.PostingDate ?? new Date().toISOString().split("T")[0],
        DueDate: creditMemo.DueDate?.split?.("T")?.[0] ?? creditMemo.DueDate ?? new Date().toISOString().split("T")[0],
        ApprovalStatus: creditMemo.ApprovalStatus ?? "Pending",
        PurchaseInvoiceId: creditMemo.PurchaseInvoiceId ?? "",
        PurchaseCreditMemoLines: Array.isArray(creditMemo.PurchaseCreditMemoLines)
          ? creditMemo.PurchaseCreditMemoLines.map(line => ({ ...line, uid: line.Id || nanoid() }))
          : [],
      });
    }
  }, [creditMemo]);

  // Fetch Chart of Accounts & Memo Types
  useEffect(() => {
    fetch(`${import.meta.env.VITE_APP_FIN_URL}/api/values/GetChartOfAccount`, {
      headers: { "ngrok-skip-browser-warning": "true" },
    })
      .then((res) => res.json())
      .then((data) => setChartOfAccounts(Array.isArray(data) ? data : data.Data || []))
      .catch(() => setChartOfAccounts([]));

    fetch(`${import.meta.env.VITE_APP_FIN_URL}/api/values/GetPurchaseInvoiceEntryTypes`, {
      headers: { "ngrok-skip-browser-warning": "true" },
    })
      .then((res) => res.json())
      .then((data) => setMemoTypes(data || []))
      .catch(() => setMemoTypes([]));
  }, []);

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleLineChange = (index, field, value) => {
    const updated = [...formData.PurchaseCreditMemoLines];
    if (field === "Quantity" || field === "TotalAmount") {
      updated[index][field] = parseFloat(value) || 0;
    } else if (field === "Type" || field === "No") {
      updated[index][field] = parseInt(value) || 0;
    } else {
      updated[index][field] = value;
    }
    setFormData((prev) => ({ ...prev, PurchaseCreditMemoLines: updated }));
  };

  const addLine = () => {
    setFormData((prev) => ({
      ...prev,
      PurchaseCreditMemoLines: [
        ...prev.PurchaseCreditMemoLines,
        {
          uid: nanoid(),
          Type: 0,
          No: prev.PurchaseCreditMemoLines.length + 1,
          CreditChartOfAccountId: "",
          Description: "",
          Quantity: 0,
          TotalAmount: 0,
        },
      ],
    }));
    setExpandedIndex(formData.PurchaseCreditMemoLines.length);
  };

  const removeLine = (index) => {
    const updated = [...formData.PurchaseCreditMemoLines];
    updated.splice(index, 1);
    setFormData((prev) => ({ ...prev, PurchaseCreditMemoLines: updated }));
    setExpandedIndex(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_APP_FIN_URL}/api/values/UpdatePurchaseCreditMemo`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to update credit memo");
      Swal.fire("Success", data?.message || "Credit Memo updated", "success");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      Swal.fire("Error", err.message || "Update failed", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-black z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed top-5 right-3 w-[500px] bg-white shadow-xl z-50 flex flex-col rounded-2xl p-3"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="p-4 flex justify-between items-center bg-indigo-600 rounded-2xl m-2">
              <h2 className="font-bold text-lg text-white">Update Purchase Credit Memo</h2>
              <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
            </div>

            <div className="p-3 flex-1 overflow-y-auto">
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input type="hidden" value={formData.Id} />

                <div>
                  <Label>Vendor No</Label>
                  <Input type="number" value={formData.VendorNo} onChange={e => handleFieldChange("VendorNo", parseInt(e.target.value) || 0)} />
                </div>

                <div>
                  <Label>Vendor Name</Label>
                  <Input value={formData.VendorName} onChange={e => handleFieldChange("VendorName", e.target.value)} />
                </div>

                <div>
                  <Label>Vendor Address</Label>
                  <Input value={formData.VendorAddress} onChange={e => handleFieldChange("VendorAddress", e.target.value)} />
                </div>

                <div className="flex gap-2">
                  <div>
                    <Label>Document Date</Label>
                    <Input type="date" value={formData.DocumentDate} onChange={e => handleFieldChange("DocumentDate", e.target.value)} />
                  </div>
                  <div>
                    <Label>Posting Date</Label>
                    <Input type="date" value={formData.PostingDate} onChange={e => handleFieldChange("PostingDate", e.target.value)} />
                  </div>
                  <div>
                    <Label>Due Date</Label>
                    <Input type="date" value={formData.DueDate} onChange={e => handleFieldChange("DueDate", e.target.value)} />
                  </div>
                </div>

                <div>
                  <Label>Approval Status</Label>
                  <Select value={formData.ApprovalStatus} onValueChange={val => handleFieldChange("ApprovalStatus", val)}>
                    <SelectTrigger><SelectValue placeholder="Select Status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Approved">Approved</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button type="button" onClick={() => setShowLinesDrawer(true)} className="bg-gray-700 w-full flex justify-between gap-2">
                  <IoIosArrowDropleftCircle /> Edit Credit Memo Lines ({formData.PurchaseCreditMemoLines.length})
                </Button>

                <Button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700">
                  {loading ? "Updating..." : "Update Credit Memo"}
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
                    <h2 className="font-bold text-lg text-white">Credit Memo Lines</h2>
                    <Button variant="outline" size="sm" onClick={() => setShowLinesDrawer(false)}>Close</Button>
                  </div>

                  <div className="p-3 flex-1 overflow-y-auto space-y-2">
                    {formData.PurchaseCreditMemoLines.map((line, idx) => (
                      <div key={line.uid} className="border rounded-lg">
                        <div className="flex justify-between items-center p-2 bg-gray-100 cursor-pointer"
                          onClick={() => setExpandedIndex(expandedIndex === idx ? null : idx)}>
                          <span className="font-semibold">Line {idx + 1} - {line.Description || "New Line"}</span>
                          <div className="flex items-center gap-3">
                            <button type="button" className="text-red-600 hover:text-red-800" onClick={e => { e.stopPropagation(); removeLine(idx); }}>
                              <FaTrash />
                            </button>
                            {expandedIndex === idx ? <FaChevronUp /> : <FaChevronDown />}
                          </div>
                        </div>

                        <AnimatePresence>
                          {expandedIndex === idx && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden p-2 space-y-2">
                              
                              {/* Type Dropdown */}
                              <Select
                                value={line.Type?.toString() || ""}
                                onValueChange={(val) => handleLineChange(idx, "Type", parseInt(val))}
                              >
                                <SelectTrigger><SelectValue placeholder="Select Type" /></SelectTrigger>
                                <SelectContent>
                                  {memoTypes.map((t) => (
                                    <SelectItem key={t.Value} value={t.Value.toString()}>{t.Text}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>

                              {/* No Dropdown */}
                              <Select
                                value={line.No?.toString() || ""}
                                onValueChange={(val) => handleLineChange(idx, "No", parseInt(val))}
                              >
                                <SelectTrigger><SelectValue placeholder="Select No" /></SelectTrigger>
                                <SelectContent>
                                  {formData.PurchaseCreditMemoLines.map((l, i) => (
                                    <SelectItem key={l.uid} value={(i + 1).toString()}>{i + 1}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>

                              {/* Chart of Accounts Dropdown */}
                              <Select
                                value={line.CreditChartOfAccountId?.toString() || ""}
                                onValueChange={(val) => handleLineChange(idx, "CreditChartOfAccountId", val)}
                              >
                                <SelectTrigger><SelectValue placeholder="Select Account" /></SelectTrigger>
                                <SelectContent className="max-h-100 overflow-y-auto">
                                  {chartOfAccounts.map((acc, index) => (
                                    <SelectItem key={`${acc.Id}-${index}`} value={acc.Id.toString()}>
                                      {acc.AccountName}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>

                              <Input placeholder="Description" value={line.Description} onChange={e => handleLineChange(idx, "Description", e.target.value)} />
                              <Input type="number" placeholder="Quantity" value={line.Quantity} onChange={e => handleLineChange(idx, "Quantity", e.target.value)} />
                              <Input type="number" placeholder="Total Amount" value={line.TotalAmount} onChange={e => handleLineChange(idx, "TotalAmount", e.target.value)} />
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
