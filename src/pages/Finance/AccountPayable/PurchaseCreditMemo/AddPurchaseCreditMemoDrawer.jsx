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

// export default function AddPurchaseCreditMemoDrawer({ open, onClose, onSuccess }) {
//   const [formData, setFormData] = useState({
//     VendorNo: "",
//     VendorName: "",
//     VendorAddress: "",
//     DocumentDate: new Date().toISOString().split("T")[0],
//     PostingDate: new Date().toISOString().split("T")[0],
//     DueDate: new Date().toISOString().split("T")[0],
//     ApprovalStatus: "",
//     PurchaseCreditMemoLines: [
//       {
//         Type: 1,
//         No: "",
//         CreditChartOfAccountId: "",
//         Description: "",
//         Quantity: "",
//         TotalAmount: "",
//       },
//     ],
//   });

//   const [loading, setLoading] = useState(false);
//   const [showLinesDrawer, setShowLinesDrawer] = useState(false);
//   const [expandedIndex, setExpandedIndex] = useState(null);
//   const [chartOfAccounts, setChartOfAccounts] = useState([]);
//   const [memoTypes, setMemoTypes] = useState([]);

//   const handleLineChange = (index, field, value) => {
//     const updatedLines = [...formData.PurchaseCreditMemoLines];
//     updatedLines[index][field] =
//       field === "Quantity" || field === "TotalAmount"
//         ? parseFloat(value) || 0
//         : value;

//     setFormData({
//       ...formData,
//       PurchaseCreditMemoLines: updatedLines,
//     });
//   };

//   const addLine = () => {
//     setFormData({
//       ...formData,
//       PurchaseCreditMemoLines: [
//         ...formData.PurchaseCreditMemoLines,
//         { Type: 1, No: "", CreditChartOfAccountId: "", Description: "", Quantity: "", TotalAmount: "" },
//       ],
//     });
//     setExpandedIndex(formData.PurchaseCreditMemoLines.length);
//   };

//   const removeLine = (index) => {
//     const updatedLines = formData.PurchaseCreditMemoLines.filter((_, i) => i !== index);
//     setFormData({ ...formData, PurchaseCreditMemoLines: updatedLines });
//     setExpandedIndex(null);
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     try {
//       const res = await fetch(
//         "https://0e05b3ea37cd.ngrok-free.app/api/values/AddPurchaseCreditMemo",
//         {
//           method: "POST",
//           headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "true" },
//           body: JSON.stringify(formData),
//         }
//       );
//       const data = await res.json();

//       console.log(data);
//       if (!res.ok || !data.success) throw new Error(data.message || "Failed to add credit memo");

//       Swal.fire("Success", data.message, "success");

//       // reset form
//       setFormData({
//         VendorNo: "",
//         VendorName: "",
//         VendorAddress: "",
//         DocumentDate: new Date().toISOString().split("T")[0],
//         PostingDate: new Date().toISOString().split("T")[0],
//         DueDate: new Date().toISOString().split("T")[0],
//         ApprovalStatus: "",
//         PurchaseCreditMemoLines: [
//           { Type: 1, No: "", CreditChartOfAccountId: "", Description: "", Quantity: "", TotalAmount: "" },
//         ],
//       });

//       if (onSuccess) onSuccess();
//       onClose();
//     } catch (err) {
//       Swal.fire("Error", err.message, "error");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     // Fetch Chart of Accounts
//     fetch("https://0e05b3ea37cd.ngrok-free.app/api/values/GetChartOfAccount",{
//          headers: { "ngrok-skip-browser-warning": "true" }
//     })
//       .then((res) => res.json())
//       .then((data) => setChartOfAccounts(Array.isArray(data) ? data : data.Data || []))
//       .catch(() => setChartOfAccounts([]));

//     // Fetch Memo Types if needed
//     fetch("https://0e05b3ea37cd.ngrok-free.app/api/values/GetPurchaseInvoiceEntryTypes",{
//          headers: { "ngrok-skip-browser-warning": "true" }
//     })
//       .then((res) => res.json())
//       .then((data) => setMemoTypes(data || []))
//       .catch(() => setMemoTypes([]));
//   }, []);

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
//               <h2 className="font-bold text-lg text-white">Add Purchase Credit Memo</h2>
//               <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
//             </div>

//             <div className="p-3 flex-1 overflow-y-auto">
//               <form onSubmit={handleSubmit} className="space-y-4">
//                 <div>
//                   <Label>Vendor No</Label>
//                   <Input
//                     type="number"
//                     value={formData.VendorNo}
//                     onChange={(e) => setFormData({ ...formData, VendorNo: e.target.value })}
//                   />
//                 </div>
//                 <div>
//                   <Label>Vendor Name</Label>
//                   <Input
//                     value={formData.VendorName}
//                     onChange={(e) => setFormData({ ...formData, VendorName: e.target.value })}
//                   />
//                 </div>
//                 <div>
//                   <Label>Vendor Address</Label>
//                   <Input
//                     value={formData.VendorAddress}
//                     onChange={(e) => setFormData({ ...formData, VendorAddress: e.target.value })}
//                   />
//                 </div>

//                 <div className="flex gap-2">
//                   <div>
//                     <Label>Document Date</Label>
//                     <Input
//                       type="date"
//                       value={formData.DocumentDate}
//                       onChange={(e) => setFormData({ ...formData, DocumentDate: e.target.value })}
//                     />
//                   </div>
//                   <div>
//                     <Label>Posting Date</Label>
//                     <Input
//                       type="date"
//                       value={formData.PostingDate}
//                       onChange={(e) => setFormData({ ...formData, PostingDate: e.target.value })}
//                     />
//                   </div>
//                   <div>
//                     <Label>Due Date</Label>
//                     <Input
//                       type="date"
//                       value={formData.DueDate}
//                       onChange={(e) => setFormData({ ...formData, DueDate: e.target.value })}
//                     />
//                   </div>
//                 </div>

//                 <Select
//                   value={formData.ApprovalStatus}
//                   onValueChange={(value) => setFormData({ ...formData, ApprovalStatus: value })}
//                 >
//                   <SelectTrigger>
//                     <SelectValue placeholder="Select Status" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="Approved">Approved</SelectItem>
//                     <SelectItem value="Pending">Pending</SelectItem>
//                     <SelectItem value="Rejected">Rejected</SelectItem>
//                   </SelectContent>
//                 </Select>

//                 <Button
//                   type="button"
//                   onClick={() => setShowLinesDrawer(true)}
//                   className="bg-gray-700 w-full flex justify-between gap-2"
//                 >
//                   <IoIosArrowDropleftCircle /> Add Credit Memo Lines ({formData.PurchaseCreditMemoLines.length})
//                 </Button>

//                 <Button
//                   type="submit"
//                   disabled={loading}
//                   className="w-full bg-indigo-600 hover:bg-indigo-700"
//                 >
//                   {loading ? "Saving..." : "Save Credit Memo"}
//                 </Button>
//               </form>
//             </div>
//           </motion.div>

//           {/* Lines Drawer */}
//           <AnimatePresence>
//             {showLinesDrawer && (
//               <>
//                 <motion.div
//                   className="fixed inset-0 bg-black z-48"
//                   initial={{ opacity: 0 }}
//                   animate={{ opacity: 0.3 }}
//                   exit={{ opacity: 0 }}
//                   onClick={() => setShowLinesDrawer(false)}
//                 />
//                 <motion.div
//                   className="fixed top-5 right-[520px] w-[450px] max-h-[90vh] bg-white shadow-xl z-48 flex flex-col rounded-2xl p-3"
//                   initial={{ x: "100%" }}
//                   animate={{ x: 0 }}
//                   exit={{ x: "100%" }}
//                   transition={{ type: "spring", stiffness: 300, damping: 30 }}
//                 >
//                   <div className="p-4 flex justify-between items-center bg-indigo-600 rounded-2xl m-2">
//                     <h2 className="font-bold text-lg text-white">Credit Memo Lines</h2>
//                     <Button variant="outline" size="sm" onClick={() => setShowLinesDrawer(false)}>Close</Button>
//                   </div>

//                   <div className="p-3 flex-1 overflow-y-auto space-y-2">
//                     {formData.PurchaseCreditMemoLines.map((line, idx) => (
//                       <div key={idx} className="border rounded-lg">
//                         <div
//                           className="flex justify-between items-center p-2 bg-gray-100 cursor-pointer"
//                           onClick={() => setExpandedIndex(expandedIndex === idx ? null : idx)}
//                         >
//                           <span className="font-semibold">Line {idx + 1} - {line.Description || "New Line"}</span>
//                           <div className="flex items-center gap-3">
//                             <button type="button" className="text-red-600 hover:text-red-800" onClick={(e) => { e.stopPropagation(); removeLine(idx); }}>
//                               <FaTrash />
//                             </button>
//                             {expandedIndex === idx ? <FaChevronUp /> : <FaChevronDown />}
//                           </div>
//                         </div>

//                         <AnimatePresence>
//                           {expandedIndex === idx && (
//                             <motion.div
//                               initial={{ height: 0, opacity: 0 }}
//                               animate={{ height: "auto", opacity: 1 }}
//                               exit={{ height: 0, opacity: 0 }}
//                               className="overflow-hidden p-2 space-y-2"
//                             >
//                               <Select
//                                 value={line.Type || ""}
//                                 onValueChange={(val) => handleLineChange(idx, "Type", val)}
//                               >
//                                 <SelectTrigger>
//                                   <SelectValue placeholder="Select Type" />
//                                 </SelectTrigger>
//                                 <SelectContent>
//                                   {memoTypes.map((t) => (
//                                     <SelectItem key={t.Value} value={t.Value}>{t.Text}</SelectItem>
//                                   ))}
//                                 </SelectContent>
//                               </Select>

//                               <Select
//                                 value={line.CreditChartOfAccountId || ""}
//                                 onValueChange={(val) => handleLineChange(idx, "CreditChartOfAccountId", val)}
//                               >
//                                 <SelectTrigger>
//                                   <SelectValue placeholder="Select Account" />
//                                 </SelectTrigger>
//                                 <SelectContent className="max-h-100 overflow-y-auto">
//                                   {chartOfAccounts.map((acc, index) => (
//                                     <SelectItem key={`${acc.Id}-${index}`} value={String(acc.Id)}>
//                                       {acc.AccountName}
//                                     </SelectItem>
//                                   ))}
//                                 </SelectContent>
//                               </Select>

//                               <Input
//                                 placeholder="Description"
//                                 value={line.Description}
//                                 onChange={(e) => handleLineChange(idx, "Description", e.target.value)}
//                               />
//                               <Input
//                                 type="number"
//                                 placeholder="Quantity"
//                                 value={line.Quantity}
//                                 onChange={(e) => handleLineChange(idx, "Quantity", e.target.value)}
//                               />
//                               <Input
//                                 type="number"
//                                 placeholder="Total Amount"
//                                 value={line.TotalAmount}
//                                 onChange={(e) => handleLineChange(idx, "TotalAmount", e.target.value)}
//                               />
//                             </motion.div>
//                           )}
//                         </AnimatePresence>
//                       </div>
//                     ))}

//                     <Button type="button" onClick={addLine} className="bg-indigo-600 w-full">+ Add Line</Button>
//                   </div>
//                 </motion.div>
//               </>
//             )}
//           </AnimatePresence>
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

export default function AddPurchaseCreditMemoDrawer({ open, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    VendorNo: "",
    VendorName: "",
    VendorAddress: "",
    DocumentDate: new Date().toISOString().split("T")[0],
    PostingDate: new Date().toISOString().split("T")[0],
    DueDate: new Date().toISOString().split("T")[0],
    ApprovalStatus: "",
    PurchaseCreditMemoLines: [
      { Type: 1, No: "", CreditChartOfAccountId: "", Description: "", Quantity: "", TotalAmount: "" },
    ],
  });

  const [purchaseInvoices, setPurchaseInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showLinesDrawer, setShowLinesDrawer] = useState(false);
  const [expandedIndices, setExpandedIndices] = useState([]); // track multiple expanded lines
  const [chartOfAccounts, setChartOfAccounts] = useState([]);
  const [memoTypes, setMemoTypes] = useState([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState("");



  
  // Fetch data
  useEffect(() => {
    fetch(`${import.meta.env.VITE_APP_FIN_URL}/api/values/GetPurchaseInvoices`, {
      headers: { "ngrok-skip-browser-warning": "true" }
    })
      .then(res => res.json())
      .then(data => setPurchaseInvoices(data.Data || []))
      .catch(() => setPurchaseInvoices([]));

    fetch(`${import.meta.env.VITE_APP_FIN_URL}/api/values/GetChartOfAccount`, {
      headers: { "ngrok-skip-browser-warning": "true" }
    })
      .then(res => res.json())
      .then(data => setChartOfAccounts(Array.isArray(data) ? data : data.Data || []))
      .catch(() => setChartOfAccounts([]));

    fetch(`${import.meta.env.VITE_APP_FIN_URL}/api/values/GetPurchaseInvoiceEntryTypes`, {
      headers: { "ngrok-skip-browser-warning": "true" }
    })
      .then(res => res.json())
      .then(data => setMemoTypes(data || []))
      .catch(() => setMemoTypes([]));
  }, []);

  // Map selected invoice to form and open lines drawer
  const handleInvoiceSelect = (invoiceId) => {
    const invoice = purchaseInvoices.find(inv => inv.Id === invoiceId);
    if (!invoice) return;

    setSelectedInvoiceId(invoiceId); // ✅ set selected ID
    setFormData({
      VendorNo: invoice.VendorNo,
      VendorName: invoice.VendorName,
      VendorAddress: invoice.VendorAddress,
      DocumentDate: invoice.DocumentDate.split("T")[0],
      PostingDate: invoice.PostingDate.split("T")[0],
      DueDate: invoice.DueDate.split("T")[0],
      ApprovalStatus: invoice.ApprovalStatus,
      PurchaseCreditMemoLines: invoice.PurchaseInvoiceLines.map(line => ({
        Type: line.Type,
        No: line.No,
        CreditChartOfAccountId: line.DebitChartOfAccountId,
        Description: line.Description,
        Quantity: line.Quantity,
        TotalAmount: line.TotalAmount,
      }))
    });

    // Open drawer and expand all lines
    setShowLinesDrawer(true);
    setExpandedIndices(invoice.PurchaseInvoiceLines.map((_, i) => i));
  };

  // Handle line updates
  const handleLineChange = (index, field, value) => {
    const updatedLines = [...formData.PurchaseCreditMemoLines];
    updatedLines[index][field] =
      field === "Quantity" || field === "TotalAmount"
        ? parseFloat(value) || 0
        : value;
    setFormData({ ...formData, PurchaseCreditMemoLines: updatedLines });
  };

  const addLine = () => {
    setFormData({
      ...formData,
      PurchaseCreditMemoLines: [
        ...formData.PurchaseCreditMemoLines,
        { Type: 1, No: "", CreditChartOfAccountId: "", Description: "", Quantity: "", TotalAmount: "" },
      ],
    });
    setExpandedIndices(prev => [...prev, formData.PurchaseCreditMemoLines.length]);
  };

  const removeLine = (index) => {
    const updatedLines = formData.PurchaseCreditMemoLines.filter((_, i) => i !== index);
    setFormData({ ...formData, PurchaseCreditMemoLines: updatedLines });
    setExpandedIndices(prev => prev.filter(i => i !== index));
  };

  const toggleLineExpand = (index) => {
    setExpandedIndices(prev => prev.includes(index)
      ? prev.filter(i => i !== index)
      : [...prev, index]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_APP_FIN_URL}/api/values/AddPurchaseCreditMemo`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "true" },
          body: JSON.stringify(formData),
        }
      );
      const data = await res.json();

      if (!res.ok || !data.success) throw new Error(data.message || "Failed to add credit memo");

      Swal.fire("Success", data.message, "success");

      // reset form
      setFormData({
        VendorNo: "",
        VendorName: "",
        VendorAddress: "",
        DocumentDate: new Date().toISOString().split("T")[0],
        PostingDate: new Date().toISOString().split("T")[0],
        DueDate: new Date().toISOString().split("T")[0],
        ApprovalStatus: "",
        PurchaseCreditMemoLines: [
          { Type: 1, No: "", CreditChartOfAccountId: "", Description: "", Quantity: "", TotalAmount: "" },
        ],
      });
      setExpandedIndices([]);
      if (onSuccess) onSuccess();
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
              <h2 className="font-bold text-lg text-white">Add Purchase Credit Memo</h2>
              <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
            </div>

            <div className="p-3 flex-1 overflow-y-auto">
              <form onSubmit={handleSubmit} className="space-y-4">

                {/* Purchase Invoice Selector */}
                <Select
                    value={selectedInvoiceId}
                    onValueChange={(val) => handleInvoiceSelect(val)}
                    >
                    <SelectTrigger>
                        <SelectValue placeholder="Select Purchase Invoice">
                        {selectedInvoiceId && purchaseInvoices.find(inv => inv.Id === selectedInvoiceId)?.VendorName}
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="max-h-60 overflow-y-auto">
                        {purchaseInvoices.map(inv => (
                        <SelectItem key={inv.Id} value={inv.Id}>
                            {inv.VendorName} - {inv.No}
                        </SelectItem>
                        ))}
                    </SelectContent>
                    </Select>

                {/* Vendor Info */}
                <div>
                  <Label>Vendor No</Label>
                  <Input type="number" value={formData.VendorNo} readOnly />
                </div>
                <div>
                  <Label>Vendor Name</Label>
                  <Input value={formData.VendorName} readOnly />
                </div>
                <div>
                  <Label>Vendor Address</Label>
                  <Input value={formData.VendorAddress} readOnly />
                </div>

                {/* Dates */}
                <div className="flex gap-2">
                  <div>
                    <Label>Document Date</Label>
                    <Input type="date" value={formData.DocumentDate} onChange={(e) => setFormData({ ...formData, DocumentDate: e.target.value })} />
                  </div>
                  <div>
                    <Label>Posting Date</Label>
                    <Input type="date" value={formData.PostingDate} onChange={(e) => setFormData({ ...formData, PostingDate: e.target.value })} />
                  </div>
                  <div>
                    <Label>Due Date</Label>
                    <Input type="date" value={formData.DueDate} onChange={(e) => setFormData({ ...formData, DueDate: e.target.value })} />
                  </div>
                </div>

                <Select value={formData.ApprovalStatus} onValueChange={(val) => setFormData({ ...formData, ApprovalStatus: val })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Approved">Approved</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>

                <Button type="button" onClick={() => setShowLinesDrawer(true)} className="bg-gray-700 w-full flex justify-between gap-2">
                  <IoIosArrowDropleftCircle /> Credit Memo Lines ({formData.PurchaseCreditMemoLines.length})
                </Button>

                <Button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700">
                  {loading ? "Saving..." : "Save Credit Memo"}
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
                      <div key={idx} className="border rounded-lg">
                        <div
                          className="flex justify-between items-center p-2 bg-gray-100 cursor-pointer"
                          onClick={() => toggleLineExpand(idx)}
                        >
                          <span className="font-semibold">Line {idx + 1} - {line.Description || "New Line"}</span>
                          <div className="flex items-center gap-3">
                            <button type="button" className="text-red-600 hover:text-red-800" onClick={(e) => { e.stopPropagation(); removeLine(idx); }}>
                              <FaTrash />
                            </button>
                            {expandedIndices.includes(idx) ? <FaChevronUp /> : <FaChevronDown />}
                          </div>
                        </div>

                        <AnimatePresence>
                          {expandedIndices.includes(idx) && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden p-2 space-y-2"
                            >
                             <Select
                                value={String(line.Type) || ""}
                                onValueChange={(val) => handleLineChange(idx, "Type", parseInt(val))}
                                >
                                <SelectTrigger>
                                    <SelectValue>
                                    {line.Type && memoTypes.find(t => String(t.Value) === String(line.Type))?.Text}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    {memoTypes.map((t) => (
                                    <SelectItem key={t.Value} value={String(t.Value)}>
                                        {t.Text}
                                    </SelectItem>
                                    ))}
                                </SelectContent>
                                </Select>


                              <Select value={line.CreditChartOfAccountId || ""} onValueChange={(val) => handleLineChange(idx, "CreditChartOfAccountId", val)}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select Account" />
                                </SelectTrigger>
                                <SelectContent className="max-h-100 overflow-y-auto">
                                  {chartOfAccounts.map((acc, index) => (
                                    <SelectItem key={`${acc.Id}-${index}`} value={String(acc.Id)}>
                                      {acc.AccountName}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>

                              <Input placeholder="Description" value={line.Description} onChange={(e) => handleLineChange(idx, "Description", e.target.value)} />
                              <Input type="number" placeholder="Quantity" value={line.Quantity} onChange={(e) => handleLineChange(idx, "Quantity", e.target.value)} />
                              <Input type="number" placeholder="Total Amount" value={line.TotalAmount} onChange={(e) => handleLineChange(idx, "TotalAmount", e.target.value)} />
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
