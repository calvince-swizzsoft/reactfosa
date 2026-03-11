// // src/components/AddPurchaseOrderDrawer.jsx
// import { useState, useEffect } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import Swal from "sweetalert2";
// import { FaTrash, FaChevronDown, FaChevronUp } from "react-icons/fa";

// export default function AddPurchaseOrderDrawer({ open, onClose, onSuccess }) {
//     const [formData, setFormData] = useState({
//         PurchaseOrderId: 0,
//         PONumber: "",
//         SupplierId: "",
//         SupplierName: "",
//         OrderDate: new Date().toISOString(),
//         ExpectedDeliveryDate: new Date().toISOString(),
//         Currency: "",
//         Status: "Pending",
//         TotalAmount: 0,
//         Projectcode: "",
//         ProjectId: "",
//         ProjectDescription: "",
//         CreatedBy: "62b58ac6-81b3-44ec-b21f-14610e61c2c7",
//         Lines: [
//             {
//                 POLineId: 0,
//                 PurchaseOrderId: 0,
//                 LineNumber: 1,
//                 ItemId: "",
//                 ItemDescription: "",
//                 QuantityOrdered: 0,
//                 UnitPrice: 0,
//                 BudgetLine: "",
//                 Budgetdescription: "",
//                 ReceivedQuantity: 0,
//             },
//         ],
//     });

//     const [expandedIndex, setExpandedIndex] = useState(null);
//     const [loading, setLoading] = useState(false);
//     const [suppliers, setSuppliers] = useState([]);
//     const [items, setItems] = useState([]);
//     const [projects, setProjects] = useState([]);
//     const [budgetLines, setBudgetLines] = useState([]);

//     // Fetch Suppliers
//     useEffect(() => {
//         fetch(`${import.meta.env.VITE_APP_PRO_URL}/api/suppliers`, {
//             headers: { "ngrok-skip-browser-warning": "true" },
//         })
//             .then((res) => res.json())
//             .then((data) => setSuppliers(data || []))
//             .catch((err) => console.error("Failed to fetch suppliers", err));
//     }, []);

//     // Fetch Items
//     useEffect(() => {
//         fetch(`${import.meta.env.VITE_APP_INV_URL}/api/items`, {
//             headers: { "ngrok-skip-browser-warning": "true" },
//         })
//             .then((res) => res.json())
//             .then((data) => setItems(data.data || []))
//             .catch((err) => console.error("Failed to fetch items", err));
//     }, []);

//     // Fetch Projects and Budgets
//     useEffect(() => {
//         fetch(`${import.meta.env.VITE_APP_PRO_URL}/api/BudgetManagement/GetAllProjectWithBudgetsAndLines`, {
//             headers: { "ngrok-skip-browser-warning": "true" },
//         })
//             .then((res) => res.json())
//             .then((data) => setProjects(data || []))
//             .catch((err) => console.error("Failed to fetch projects", err));
//     }, []);

//     const handleProjectSelect = (e) => {
//         const projectId = parseInt(e.target.value);
//         const selectedProject = projects.find((p) => p.ProjectId === projectId);
//         if (selectedProject) {
//             setFormData({
//                 ...formData,
//                 ProjectId: selectedProject.ProjectId,
//                 Projectcode: selectedProject.ProjectCode,
//                 ProjectDescription: selectedProject.ProjectName,
//             });
//             const allLines = selectedProject.Budgets.flatMap((b) => b.BudgetLines);
//             setBudgetLines(allLines);
//         }
//     };

//     const handleLineChange = (index, field, value) => {
//         const updatedLines = [...formData.Lines];
//         updatedLines[index][field] =
//             field === "QuantityOrdered" || field === "UnitPrice"
//                 ? parseFloat(value) || 0
//                 : value;

//         const total = updatedLines.reduce(
//             (sum, l) => sum + (l.QuantityOrdered * l.UnitPrice || 0),
//             0
//         );

//         setFormData({ ...formData, Lines: updatedLines, TotalAmount: total });
//     };

//     const addLine = () => {
//         setFormData({
//             ...formData,
//             Lines: [
//                 ...formData.Lines,
//                 {
//                     POLineId: 0,
//                     PurchaseOrderId: 0,
//                     LineNumber: formData.Lines.length + 1,
//                     ItemId: "",
//                     ItemDescription: "",
//                     QuantityOrdered: 0,
//                     UnitPrice: 0,
//                     BudgetLine: "",
//                     Budgetdescription: "",
//                     ReceivedQuantity: 0,
//                 },
//             ],
//         });
//     };

//     const removeLine = (index) => {
//         const updatedLines = formData.Lines.filter((_, i) => i !== index);
//         setFormData({ ...formData, Lines: updatedLines });
//     };

//     const handleSubmit = async (e) => {
//         e.preventDefault();
//         setLoading(true);

//         try {
//             const res = await fetch("http://192.168.1.253:44327/api/purchaseorders/create", {
//                 method: "POST",
//                 headers: {
//                     "Content-Type": "application/json",
//                 },
//                 body: JSON.stringify(formData),
//             });

//             if (!res.ok) throw new Error("Failed to create purchase order");

//             Swal.fire("Success", "Purchase Order created successfully!", "success");
//             onSuccess?.();
//             onClose();
//         } catch (err) {
//             console.error(err);
//             Swal.fire("Error", "Failed to create purchase order.", "error");
//         } finally {
//             setLoading(false);
//         }
//     };

//     return (
//         <AnimatePresence>
//             {open && (
//                 <>
//                     <motion.div
//                         className="fixed inset-0 bg-black z-40"
//                         initial={{ opacity: 0 }}
//                         animate={{ opacity: 0.4 }}
//                         exit={{ opacity: 0 }}
//                         onClick={onClose}
//                     />
//                     <motion.div
//                         className="fixed top-5 right-3 w-[500px] bg-white shadow-xl z-50 flex flex-col rounded-2xl p-3"
//                         initial={{ x: "100%" }}
//                         animate={{ x: 0 }}
//                         exit={{ x: "100%" }}
//                     >
//                         <div className="p-4 flex justify-between items-center bg-indigo-600 rounded-2xl m-2">
//                             <h2 className="font-bold text-lg text-white">Add Purchase Order</h2>
//                             <Button variant="outline" size="sm" onClick={onClose}>
//                                 Close
//                             </Button>
//                         </div>

//                         <div className="p-3 flex-1 overflow-y-auto">
//                             <form onSubmit={handleSubmit} className="space-y-4">
//                                 <div>
//                                     <Label>PO Number</Label>
//                                     <Input
//                                         value={formData.PONumber}
//                                         onChange={(e) =>
//                                             setFormData({ ...formData, PONumber: e.target.value })
//                                         }
//                                         required
//                                     />
//                                 </div>

//                                 <div>
//                                     <Label>Supplier</Label>
//                                     <select
//                                         className="border p-2 w-full rounded"
//                                         value={formData.SupplierId}
//                                         onChange={(e) => {
//                                             const selected = suppliers.find(
//                                                 (s) => s.Id === parseInt(e.target.value)
//                                             );
//                                             setFormData({
//                                                 ...formData,
//                                                 SupplierId: selected?.Id,
//                                                 SupplierName: selected?.SupplierName,
//                                             });
//                                         }}
//                                     >
//                                         <option value="">-- Select Supplier --</option>
//                                         {suppliers.map((s) => (
//                                             <option key={s.Id} value={s.Id}>
//                                                 {s.SupplierName}
//                                             </option>
//                                         ))}
//                                     </select>
//                                 </div>

//                                 <div>
//                                     <Label>Currency</Label>
//                                     <Input
//                                         placeholder="USD / KES / EUR"
//                                         value={formData.Currency}
//                                         onChange={(e) =>
//                                             setFormData({ ...formData, Currency: e.target.value })
//                                         }
//                                         required
//                                     />
//                                 </div>

//                                 <div>
//                                     <Label>Select Project</Label>
//                                     <select
//                                         className="border p-2 w-full rounded"
//                                         value={formData.ProjectId}
//                                         onChange={handleProjectSelect}
//                                     >
//                                         <option value="">-- Select Project --</option>
//                                         {projects.map((p) => (
//                                             <option key={p.ProjectId} value={p.ProjectId}>
//                                                 {p.ProjectCode} - {p.ProjectName}
//                                             </option>
//                                         ))}
//                                     </select>
//                                 </div>

//                                 <div>
//                                     <Label>Status</Label>
//                                     <Input
//                                         value={formData.Status}
//                                         onChange={(e) =>
//                                             setFormData({ ...formData, Status: e.target.value })
//                                         }
//                                     />
//                                 </div>

//                                 {/* Lines Section */}
//                                 <div>
//                                     <h3 className="font-semibold mb-2">Order Lines</h3>
//                                     {formData.Lines.map((line, idx) => (
//                                         <div key={idx} className="border rounded-lg p-3 space-y-2">
//                                             <div
//                                                 className="flex justify-between items-center bg-gray-100 p-2 rounded cursor-pointer"
//                                                 onClick={() =>
//                                                     setExpandedIndex(expandedIndex === idx ? null : idx)
//                                                 }
//                                             >
//                                                 <span>
//                                                     Line {idx + 1} -{" "}
//                                                     {line.ItemDescription || "New Item"}
//                                                 </span>
//                                                 {expandedIndex === idx ? (
//                                                     <FaChevronUp />
//                                                 ) : (
//                                                     <FaChevronDown />
//                                                 )}
//                                             </div>

//                                             <AnimatePresence>
//                                                 {expandedIndex === idx && (
//                                                     <motion.div
//                                                         initial={{ height: 0, opacity: 0 }}
//                                                         animate={{ height: "auto", opacity: 1 }}
//                                                         exit={{ height: 0, opacity: 0 }}
//                                                         className="space-y-2"
//                                                     >
//                                                         <Label>Item</Label>
//                                                         <select
//                                                             className="border p-2 w-full rounded"
//                                                             value={line.ItemId}
//                                                             onChange={(e) => {
//                                                                 const selected = items.find(
//                                                                     (it) => it.Id === e.target.value
//                                                                 );
//                                                                 if (selected) {
//                                                                     handleLineChange(idx, "ItemId", selected.Id);
//                                                                     handleLineChange(
//                                                                         idx,
//                                                                         "ItemDescription",
//                                                                         selected.Description
//                                                                     );
//                                                                 }
//                                                             }}
//                                                         >
//                                                             <option value="">-- Select Item --</option>
//                                                             {items.map((it) => (
//                                                                 <option key={it.Id} value={it.Id}>
//                                                                     {it.ItemNo} - {it.Description}
//                                                                 </option>
//                                                             ))}
//                                                         </select>

//                                                         <Label>Quantity Ordered</Label>
//                                                         <Input
//                                                             type="number"
//                                                             value={line.QuantityOrdered}
//                                                             onChange={(e) =>
//                                                                 handleLineChange(
//                                                                     idx,
//                                                                     "QuantityOrdered",
//                                                                     e.target.value
//                                                                 )
//                                                             }
//                                                         />

//                                                         <Label>Unit Price</Label>
//                                                         <Input
//                                                             type="number"
//                                                             value={line.UnitPrice}
//                                                             onChange={(e) =>
//                                                                 handleLineChange(idx, "UnitPrice", e.target.value)
//                                                             }
//                                                         />

//                                                         <Label>Budget Line</Label>
//                                                         <select
//                                                             className="border p-2 w-full rounded"
//                                                             onChange={(e) => {
//                                                                 const selectedLine = budgetLines.find(
//                                                                     (b) =>
//                                                                         b.BudgetLineId === parseInt(e.target.value)
//                                                                 );
//                                                                 if (selectedLine) {
//                                                                     handleLineChange(
//                                                                         idx,
//                                                                         "BudgetLine",
//                                                                         selectedLine.BudgetLineId
//                                                                     );
//                                                                     handleLineChange(
//                                                                         idx,
//                                                                         "Budgetdescription",
//                                                                         selectedLine.Description
//                                                                     );
//                                                                 }
//                                                             }}
//                                                         >
//                                                             <option value="">-- Select Budget Line --</option>
//                                                             {budgetLines.map((b) => (
//                                                                 <option
//                                                                     key={b.BudgetLineId}
//                                                                     value={b.BudgetLineId}
//                                                                 >
//                                                                     {b.AccountCode} - {b.Description}
//                                                                 </option>
//                                                             ))}
//                                                         </select>

//                                                         <Button
//                                                             variant="destructive"
//                                                             size="sm"
//                                                             className="mt-2"
//                                                             onClick={() => removeLine(idx)}
//                                                         >
//                                                             <FaTrash className="mr-2" /> Remove
//                                                         </Button>
//                                                     </motion.div>
//                                                 )}
//                                             </AnimatePresence>
//                                         </div>
//                                     ))}
//                                     <Button type="button" onClick={addLine} className="w-full mt-2 bg-indigo-600">
//                                         + Add Line
//                                     </Button>
//                                 </div>

//                                 <Button
//                                     type="submit"
//                                     disabled={loading}
//                                     className="w-full bg-indigo-600 hover:bg-indigo-700"
//                                 >
//                                     {loading ? "Saving..." : "Save Purchase Order"}
//                                 </Button>
//                             </form>
//                         </div>
//                     </motion.div>
//                 </>
//             )}
//         </AnimatePresence>
//     );
// }






























































// import { useState, useEffect } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import Swal from "sweetalert2";
// import { FaTrash, FaEdit } from "react-icons/fa";

// // ✅ Sub Drawer Component for Order Line
// function SubOrderLineDrawer({ open, onClose, onSave, line, items, budgetLines }) {
//     const [localLine, setLocalLine] = useState(
//         line || {
//             ItemId: "",
//             ItemDescription: "",
//             QuantityOrdered: 0,
//             UnitPrice: 0,
//             BudgetLine: "",
//             Budgetdescription: "",
//         }
//     );

//     useEffect(() => {
//         setLocalLine(
//             line || {
//                 ItemId: "",
//                 ItemDescription: "",
//                 QuantityOrdered: 0,
//                 UnitPrice: 0,
//                 BudgetLine: "",
//                 Budgetdescription: "",
//             }
//         );
//     }, [line]);



//     if (!open) return null;

//     return (
//         <AnimatePresence>
//             <motion.div
//                 className="fixed inset-0 z-50 flex justify-end"
//                 initial={{ opacity: 0 }}
//                 animate={{ opacity: 1 }}
//                 exit={{ opacity: 0 }}
//             >
//                 <div className="bg-black opacity-40 w-full" onClick={onClose}></div>
//                 <motion.div
//                     initial={{ x: "100%" }}
//                     animate={{ x: 0 }}
//                     exit={{ x: "100%" }}
//                     className="bg-white w-[400px] h-full shadow-2xl p-5 flex flex-col"
//                 >
//                     <h3 className="font-bold text-lg mb-3 border-b pb-2">Order Line Details</h3>

//                     <div className="space-y-3 flex-1 overflow-y-auto">
//                         <div>
//                             <Label>Item</Label>
//                             <select
//                                 className="border p-2 w-full rounded"
//                                 value={localLine.Id}
//                                 onChange={(e) => {
//                                     const selected = items.find((it) => it.Id === e.target.value);
//                                     setLocalLine({
//                                         ...localLine,
//                                         ItemId: selected?.Id || "",
//                                         ItemDescription: selected?.Description || "",
//                                     });
//                                 }}
//                             >
//                                 <option value="">-- Select Item --</option>
//                                 {items.map((it) => (
//                                     <option key={it.Id} value={it.Id}>
//                                         {it.ItemNo} - {it.Description}
//                                     </option>
//                                 ))}
//                             </select>
//                         </div>

//                         <div>
//                             <Label>Quantity Ordered</Label>
//                             <Input
//                                 type="number"
//                                 value={localLine.QuantityOrdered}
//                                 onChange={(e) =>
//                                     setLocalLine({ ...localLine, QuantityOrdered: parseFloat(e.target.value) || 0 })
//                                 }
//                             />
//                         </div>

//                         <div>
//                             <Label>Unit Price</Label>
//                             <Input
//                                 type="number"
//                                 value={localLine.UnitPrice}
//                                 onChange={(e) =>
//                                     setLocalLine({ ...localLine, UnitPrice: parseFloat(e.target.value) || 0 })
//                                 }
//                             />
//                         </div>

//                         <div>
//                             <Label>Budget Line</Label>
//                             <select
//                                 className="border p-2 w-full rounded"
//                                 value={localLine.BudgetLine}
//                                 onChange={(e) => {
//                                     const selected = budgetLines.find(
//                                         (b) => b.BudgetLineId === parseInt(e.target.value)
//                                     );
//                                     setLocalLine({
//                                         ...localLine,
//                                         BudgetLine: selected?.BudgetLineId || "",
//                                         Budgetdescription: selected?.Description || "",
//                                     });
//                                 }}
//                             >
//                                 <option value="">-- Select Budget Line --</option>
//                                 {budgetLines.map((b) => (
//                                     <option key={b.BudgetLineId} value={b.BudgetLineId}>
//                                         {b.AccountCode} - {b.Description}
//                                     </option>
//                                 ))}
//                             </select>
//                         </div>
//                     </div>

//                     <div className="flex justify-end gap-2 mt-4 border-t pt-3">
//                         <Button variant="outline" onClick={onClose}>
//                             Cancel
//                         </Button>
//                         <Button
//                             className="bg-indigo-600"
//                             onClick={() => {
//                                 onSave(localLine);
//                                 onClose();
//                             }}
//                         >
//                             Save Line
//                         </Button>
//                     </div>
//                 </motion.div>
//             </motion.div>
//         </AnimatePresence>
//     );
// }

// export default function AddPurchaseOrderDrawer({ open, onClose, onSuccess }) {
//     const [formData, setFormData] = useState({
//         PONumber: "",
//         SupplierId: "",
//         SupplierName: "",
//         Currency: "",
//         Status: "Pending",
//         ProjectId: "",
//         Projectcode: "",
//         ProjectDescription: "",
//         Lines: [],
//     });

//     const [loading, setLoading] = useState(false);
//     const [suppliers, setSuppliers] = useState([]);
//     const [items, setItems] = useState([]);
//     const [projects, setProjects] = useState([]);
//     const [budgetLines, setBudgetLines] = useState([]);
//     const [subDrawerOpen, setSubDrawerOpen] = useState(false);
//     const [editingIndex, setEditingIndex] = useState(null);
//     const [currentLine, setCurrentLine] = useState(null);

//     // Fetch sample data (shortened)
//     useEffect(() => {
//         fetch(`${import.meta.env.VITE_APP_PRO_URL}/api/vendors`)
//             .then((r) => r.json())
//             .then((d) => setSuppliers(d.data || []));
//         fetch(`${import.meta.env.VITE_APP_INV_URL}/api/items`)
//             .then((r) => r.json())
//             .then((d) => setItems(d.data || []));
//         fetch(`${import.meta.env.VITE_APP_PRO_URL}/api/BudgetManagement/GetAllProjectWithBudgetsAndLines`)
//             .then((r) => r.json())
//             .then((d) => setProjects(d || []));
//     }, []);

//     const handleProjectSelect = (e) => {
//         const projectId = parseInt(e.target.value);
//         const selected = projects.find((p) => p.ProjectId === projectId);
//         if (selected) {
//             setFormData({
//                 ...formData,
//                 ProjectId: selected.ProjectId,
//                 Projectcode: selected.ProjectCode,
//                 ProjectDescription: selected.ProjectName,
//             });
//             const allLines = selected.Budgets.flatMap((b) => b.BudgetLines);
//             setBudgetLines(allLines);
//         }
//     };

//     const handleSaveLine = (lineData) => {
//         const updatedLines = [...formData.Lines];
//         if (editingIndex !== null) {
//             updatedLines[editingIndex] = lineData;
//         } else {
//             updatedLines.push({ ...lineData, LineNumber: updatedLines.length + 1 });
//         }

//         const total = updatedLines.reduce(
//             (sum, l) => sum + (l.QuantityOrdered * l.UnitPrice || 0),
//             0
//         );

//         setFormData({ ...formData, Lines: updatedLines, TotalAmount: total });
//         setEditingIndex(null);
//     };

//     const handleSubmit = async (e) => {
//         e.preventDefault();
//         setLoading(true);

//         try {
//             const res = await fetch(`${import.meta.env.VITE_APP_PRO_URL}/api/purchaseorders/create`, {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify(formData),
//             });

//             if (!res.ok) throw new Error("Failed to create purchase order");
//             Swal.fire("Success", "Purchase Order created successfully!", "success");
//             onSuccess?.();
//             onClose();
//         } catch (err) {
//             Swal.fire("Error", "Failed to create purchase order.", "error");
//         } finally {
//             setLoading(false);
//         }
//     };

//     return (
//         <AnimatePresence>
//             {open && (
//                 <>
//                     <motion.div
//                         className="fixed inset-0 bg-black z-40"
//                         initial={{ opacity: 0 }}
//                         animate={{ opacity: 0.4 }}
//                         exit={{ opacity: 0 }}
//                         onClick={onClose}
//                     />
//                     <motion.div
//                         className="fixed top-5 right-3 w-[500px] bg-white shadow-xl z-50 flex flex-col rounded-2xl p-3"
//                         initial={{ x: "100%" }}
//                         animate={{ x: 0 }}
//                         exit={{ x: "100%" }}
//                     >
//                         <div className="p-4 flex justify-between items-center bg-indigo-600 rounded-2xl m-2">
//                             <h2 className="font-bold text-lg text-white">Add Purchase Order</h2>
//                             <Button variant="outline" size="sm" onClick={onClose}>
//                                 Close
//                             </Button>
//                         </div>

//                         <div className="p-3 flex-1 overflow-y-auto">
//                             <form onSubmit={handleSubmit} className="space-y-4">
//                                 <div>
//                                     <Label>PO Number</Label>
//                                     <Input
//                                         value={formData.PONumber}
//                                         onChange={(e) => setFormData({ ...formData, PONumber: e.target.value })}
//                                     />
//                                 </div>

//                                 <div>
//                                     <Label>Supplier</Label>
//                                     <select
//                                         className="border p-2 w-full rounded"
//                                         value={formData.SupplierId}
//                                         onChange={(e) => {
//                                             const selected = suppliers.find((s) => s.Id === parseInt(e.target.value));
//                                             setFormData({
//                                                 ...formData,
//                                                 SupplierId: selected?.Id,
//                                                 SupplierName: selected?.SupplierName,
//                                             });
//                                         }}
//                                     >
//                                         <option value="">-- Select Supplier --</option>
//                                         {suppliers.map((s) => (
//                                             <option key={s.Id} value={s.Id}>
//                                                 {s.SupplierName}
//                                             </option>
//                                         ))}
//                                     </select>
//                                 </div>

//                                 <div>
//                                     <Label>Select Project</Label>
//                                     <select
//                                         className="border p-2 w-full rounded"
//                                         value={formData.ProjectId}
//                                         onChange={handleProjectSelect}
//                                     >
//                                         <option value="">-- Select Project --</option>
//                                         {projects.map((p) => (
//                                             <option key={p.ProjectId} value={p.ProjectId}>
//                                                 {p.ProjectCode} - {p.ProjectName}
//                                             </option>
//                                         ))}
//                                     </select>
//                                 </div>

//                                 {/* ✅ Lines List */}
//                                 <div>
//                                     <h3 className="font-semibold mb-2">Order Lines</h3>
//                                     {formData.Lines.map((line, idx) => (
//                                         <div
//                                             key={idx}
//                                             className="border rounded-lg p-3 mb-2 flex justify-between items-center"
//                                         >
//                                             <div>
//                                                 <p className="font-medium">{line.ItemDescription || "Unnamed Item"}</p>
//                                                 <p className="text-sm text-gray-600">
//                                                     Qty: {line.QuantityOrdered} | Price: {line.UnitPrice}
//                                                 </p>
//                                             </div>
//                                             <div className="flex gap-2">
//                                                 <Button
//                                                     variant="outline"
//                                                     size="sm"
//                                                     onClick={() => {
//                                                         setEditingIndex(idx);
//                                                         setCurrentLine(line);
//                                                         setSubDrawerOpen(true);
//                                                     }}
//                                                 >
//                                                     <FaEdit />
//                                                 </Button>
//                                                 <Button
//                                                     variant="destructive"
//                                                     size="sm"
//                                                     onClick={() =>
//                                                         setFormData({
//                                                             ...formData,
//                                                             Lines: formData.Lines.filter((_, i) => i !== idx),
//                                                         })
//                                                     }
//                                                 >
//                                                     <FaTrash />
//                                                 </Button>
//                                             </div>
//                                         </div>
//                                     ))}

//                                     <Button
//                                         type="button"
//                                         onClick={() => {
//                                             setEditingIndex(null);
//                                             setCurrentLine({
//                                                 ItemId: "",
//                                                 ItemDescription: "",
//                                                 QuantityOrdered: 0,
//                                                 UnitPrice: 0,
//                                                 BudgetLine: "",
//                                                 Budgetdescription: "",
//                                             });
//                                             setSubDrawerOpen(true);
//                                         }}
//                                         className="w-full bg-indigo-600 mt-2"
//                                     >
//                                         + Add Line
//                                     </Button>
//                                 </div>

//                                 <Button type="submit" disabled={loading} className="w-full bg-indigo-600">
//                                     {loading ? "Saving..." : "Save Purchase Order"}
//                                 </Button>
//                             </form>
//                         </div>
//                     </motion.div>

//                     {/* ✅ Sub Drawer */}
//                     <SubOrderLineDrawer
//                         open={subDrawerOpen}
//                         onClose={() => setSubDrawerOpen(false)}
//                         onSave={handleSaveLine}
//                         line={currentLine}
//                         items={items}
//                         budgetLines={budgetLines}
//                     />
//                 </>
//             )}
//         </AnimatePresence>
//     );
// }










































import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Swal from "sweetalert2";
import { FaTrash, FaChevronDown, FaChevronUp } from "react-icons/fa";

export default function AddPurchaseOrderDrawer({ open, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        PONumber: "",
        VendorId: "",
        VendorName: "",
        Currency: "",
        Status: "Pending",
        ProjectId: "",
        Projectcode: "",
        ProjectDescription: "",
        Lines: [],
    });

    const [loading, setLoading] = useState(false);
    const [vendors, setVendors] = useState([]);
    const [items, setItems] = useState([]);
    const [projects, setProjects] = useState([]);
    const [budgetLines, setBudgetLines] = useState([]);
    const [showLinesDrawer, setShowLinesDrawer] = useState(false);
    const [expandedIndex, setExpandedIndex] = useState(null);

    // ✅ Fetch vendors, items & projects
    useEffect(() => {
        fetch("http://192.168.1.253:44327/api/vendors")
            .then((r) => r.json())
            .then((d) => setVendors(Array.isArray(d) ? d : d.data || []));

        fetch(`${import.meta.env.VITE_APP_INV_URL}/api/items`)
            .then((r) => r.json())
            .then((d) => setItems(d.data || []));

        fetch(`${import.meta.env.VITE_APP_PRO_URL}/api/BudgetManagement/GetAllProjectWithBudgetsAndLines`)
            .then((r) => r.json())
            .then((d) => setProjects(Array.isArray(d) ? d : []));
    }, []);

    const handleProjectSelect = (e) => {
        const projectId = parseInt(e.target.value);
        const selected = projects.find((p) => p.ProjectId === projectId);
        if (selected) {
            setFormData({
                ...formData,
                ProjectId: selected.ProjectId,
                Projectcode: selected.ProjectCode,
                ProjectDescription: selected.ProjectName,
            });
            const allLines = selected.Budgets.flatMap((b) => b.BudgetLines);
            setBudgetLines(allLines);
        }
    };

    const handleLineChange = (index, field, value) => {
        const updated = [...formData.Lines];
        updated[index][field] = value;
        setFormData({ ...formData, Lines: updated });
    };

    const addLine = () => {
        setFormData({
            ...formData,
            Lines: [
                ...formData.Lines,
                {
                    ItemId: "",
                    ItemDescription: "",
                    Quantity: 0,
                    UnitPrice: 0,
                    BudgetLine: "",
                    Budgetdescription: "",
                },
            ],
        });
    };

    const removeLine = (index) => {
        const updated = formData.Lines.filter((_, i) => i !== index);
        setFormData({ ...formData, Lines: updated });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_APP_PRO_URL}/api/purchaseorders/create`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!res.ok) throw new Error("Failed to create purchase order");
            Swal.fire("Success", "Purchase Order created successfully!", "success");
            onSuccess?.();
            onClose();
        } catch (err) {
            Swal.fire("Error", "Failed to create purchase order.", "error");
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

                    {/* Main Drawer */}
                    <motion.div
                        className="fixed top-5 right-3 w-[500px] bg-white shadow-xl z-50 flex flex-col rounded-2xl p-3"
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                    >
                        <div className="p-4 flex justify-between items-center bg-indigo-600 rounded-2xl m-2">
                            <h2 className="font-bold text-lg text-white">Add Purchase Order</h2>
                            <Button variant="outline" size="sm" onClick={onClose}>
                                Close
                            </Button>
                        </div>

                        <div className="p-3 flex-1 overflow-y-auto">
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <Label>PO Number</Label>
                                    <Input
                                        value={formData.PONumber}
                                        onChange={(e) => setFormData({ ...formData, PONumber: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <Label>Vendor</Label>
                                    <select
                                        className="border p-2 w-full rounded"
                                        value={formData.VendorId}
                                        onChange={(e) => {
                                            const selected = vendors.find((v) => v.Id === parseInt(e.target.value));
                                            setFormData({
                                                ...formData,
                                                VendorId: selected?.Id,
                                                VendorName: selected?.SupplierName || selected?.VendorName,
                                            });
                                        }}
                                    >
                                        <option value="">-- Select Vendor --</option>
                                        {vendors.map((v) => (
                                            <option key={v.Id} value={v.Id}>
                                                {v.SupplierName || v.VendorName}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <Label>Project</Label>
                                    <select
                                        className="border p-2 w-full rounded"
                                        value={formData.ProjectId}
                                        onChange={handleProjectSelect}
                                    >
                                        <option value="">-- Select Project --</option>
                                        {projects.map((p) => (
                                            <option key={p.ProjectId} value={p.ProjectId}>
                                                {p.ProjectCode} - {p.ProjectName}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <Button
                                    type="button"
                                    className="bg-indigo-600 w-full"
                                    onClick={() => setShowLinesDrawer(true)}
                                >
                                    + Manage Order Lines
                                </Button>

                                <Button type="submit" disabled={loading} className="w-full bg-indigo-600">
                                    {loading ? "Saving..." : "Save Purchase Order"}
                                </Button>
                            </form>
                        </div>
                    </motion.div>

                    {/* Sub Drawer for Lines */}
                    <AnimatePresence>
                        {showLinesDrawer && (
                            <motion.div
                                className="fixed top-5 right-[520px] w-[450px] bg-white shadow-xl rounded-2xl p-3 z-50"
                                initial={{ x: "100%" }}
                                animate={{ x: 0 }}
                                exit={{ x: "100%" }}
                            >
                                <div className="p-4 flex justify-between items-center bg-indigo-600 rounded-2xl m-2">
                                    <h2 className="font-bold text-lg text-white">Purchase Order Lines</h2>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowLinesDrawer(false)}
                                    >
                                        Close
                                    </Button>
                                </div>

                                <div className="p-3 flex-1 overflow-y-auto space-y-2">
                                    {formData.Lines.map((line, idx) => (
                                        <div key={idx} className="border rounded-lg p-3 space-y-2">
                                            <div
                                                className="flex justify-between items-center p-2 bg-gray-100 cursor-pointer"
                                                onClick={() => setExpandedIndex(expandedIndex === idx ? null : idx)}
                                            >
                                                <span className="font-semibold">
                                                    Line {idx + 1} - {line.ItemDescription || "New Item"}
                                                </span>
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
                                                        <Label>Autofill Item</Label>
                                                        <select
                                                            className="border rounded p-2 w-full"
                                                            value={line.ItemId}
                                                            onChange={(e) => {
                                                                const selectedItem = items.find(
                                                                    (it) => it.Id === parseInt(e.target.value)
                                                                );
                                                                if (selectedItem) {
                                                                    handleLineChange(idx, "ItemId", selectedItem.Id);
                                                                    handleLineChange(idx, "ItemDescription", selectedItem.Description);
                                                                    handleLineChange(idx, "UnitPrice", selectedItem.InventoryBalance);
                                                                    handleLineChange(idx, "AccountCode", selectedItem.ItemNo);
                                                                }
                                                            }}
                                                        >
                                                            <option value="">-- Select Item --</option>
                                                            {items.map((it) => (
                                                                <option key={it.Id} value={it.Id}>
                                                                    {it.ItemNo} - {it.Description}
                                                                </option>
                                                            ))}
                                                        </select>

                                                        <Label>Budget Line</Label>
                                                        <select
                                                            className="border p-2 w-full rounded"
                                                            onChange={(e) => {
                                                                const selectedLine = budgetLines.find(
                                                                    (b) => b.BudgetLineId === parseInt(e.target.value)
                                                                );
                                                                if (selectedLine) {
                                                                    handleLineChange(idx, "BudgetLine", selectedLine.BudgetLineId);
                                                                    handleLineChange(idx, "Budgetdescription", selectedLine.Description);
                                                                }
                                                            }}
                                                        >
                                                            <option value="">-- Select Budget Line --</option>
                                                            {budgetLines.map((b) => (
                                                                <option key={b.BudgetLineId} value={b.BudgetLineId}>
                                                                    {b.AccountCode} - {b.Description}
                                                                </option>
                                                            ))}
                                                        </select>

                                                        <Label>Item Description</Label>
                                                        <Input
                                                            type="text"
                                                            placeholder="Item Description"
                                                            value={line.ItemDescription}
                                                            onChange={(e) =>
                                                                handleLineChange(idx, "ItemDescription", e.target.value)
                                                            }
                                                        />

                                                        <Label>Quantity</Label>
                                                        <Input
                                                            type="number"
                                                            placeholder="Quantity"
                                                            value={line.Quantity}
                                                            onChange={(e) => handleLineChange(idx, "Quantity", e.target.value)}
                                                        />

                                                        <Label>Unit Price</Label>
                                                        <Input
                                                            type="number"
                                                            placeholder="Unit Price"
                                                            value={line.UnitPrice}
                                                            onChange={(e) => handleLineChange(idx, "UnitPrice", e.target.value)}
                                                        />
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    ))}

                                    <Button type="button" className="bg-indigo-600 w-full" onClick={addLine}>
                                        + Add Line
                                    </Button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </>
            )}
        </AnimatePresence>
    );
}

























