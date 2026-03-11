
// import { useState } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import Swal from "sweetalert2";
// import { IoIosArrowDropleftCircle } from "react-icons/io";

// export default function AddProjectWithBudgetsAndLines({ open, onClose, onSuccess }) {
//   const [loading, setLoading] = useState(false);
//   const [budgetDrawerOpen, setBudgetDrawerOpen] = useState(false);
//   const [lineDrawerOpen, setLineDrawerOpen] = useState(false);
//   const [selectedBudgetIndex, setSelectedBudgetIndex] = useState(null);

//   const [formData, setFormData] = useState({
//     ProjectCode: "",
//     ProjectName: "",
//     ProjectManager: "",
//     StartDate: "",
//     EndDate: "",
//     BudgetAmount: "",
//     Department: "",
//     Budgets: [],
//   });

//   const handleChange = (field, value) =>
//     setFormData((prev) => ({ ...prev, [field]: value }));

//   const handleBudgetChange = (index, field, value) => {
//     const updated = [...formData.Budgets];
//     updated[index] = { ...updated[index], [field]: value };
//     setFormData({ ...formData, Budgets: updated });
//   };

//   const addBudget = () => {
//     const newBudget = {
//       BudgetCode: "",
//       BudgetTitle: "",
//       FiscalYear: "",
//       TotalAmount: "",
//       ApprovedAmount: "",
//       ApprovalStatus: "Pending",
//       CreatedBy: "Admin",
//       CreatedDate: new Date().toISOString().split("T")[0],
//       BudgetLines: [],
//     };
//     setFormData({ ...formData, Budgets: [...formData.Budgets, newBudget] });
//   };

//   const removeBudget = (index) => {
//     const updated = formData.Budgets.filter((_, i) => i !== index);
//     setFormData({ ...formData, Budgets: updated });
//   };

//   const addBudgetLine = (budgetIndex) => {
//     setSelectedBudgetIndex(budgetIndex);
//     setLineDrawerOpen(true);
//   };

//   const saveBudgetLines = (linesArray) => {
//     const updated = [...formData.Budgets];
//     updated[selectedBudgetIndex].BudgetLines = linesArray;
//     setFormData({ ...formData, Budgets: updated });
//     setLineDrawerOpen(false);
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     try {
//       const res = await fetch(
//         `${import.meta.env.VITE_APP_PRO_URL}/api/BudgetManagement/CreateProjectWithBudgetsAndLines`,
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             "ngrok-skip-browser-warning": "true",
//           },
//           body: JSON.stringify(formData),
//         }
//       );
//       if (!res.ok) throw new Error("Failed to create project with budgets");

//       Swal.fire("Success", "Project with Budgets and Lines created!", "success");
//       if (onSuccess) onSuccess();
//       onClose();
//     } catch (err) {
//       console.error(err);
//       Swal.fire("Error", "Failed to create project.", "error");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <AnimatePresence>
//       {open && (
//         <>
//           {/* Overlay */}
//           <motion.div
//             className="fixed inset-0 bg-black z-40"
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 0.4 }}
//             exit={{ opacity: 0 }}
//             onClick={onClose}
//           />

//           {/* MAIN DRAWER — Create Project */}
//           <motion.div
//             className="fixed top-5 right-5 w-[500px] max-h-[95vh] bg-white shadow-2xl z-50 flex flex-col rounded-2xl p-3 overflow-hidden"
//             initial={{ x: "100%" }}
//             animate={{ x: 0 }}
//             exit={{ x: "100%" }}
//             transition={{ type: "spring", stiffness: 300, damping: 30 }}
//           >
//             <div className="p-4 flex justify-between items-center bg-indigo-600 rounded-2xl m-2">
//               <h2 className="font-bold text-lg text-white">Create Project</h2>
//               <Button variant="outline" size="sm" onClick={onClose}>
//                 Close
//               </Button>
//             </div>

//             <div className="p-3 flex-1 overflow-y-auto">
//               <form onSubmit={handleSubmit} className="space-y-3">
//                 <div>
//                   <Label>Project Code</Label>
//                   <Input
//                     value={formData.ProjectCode}
//                     onChange={(e) => handleChange("ProjectCode", e.target.value)}
//                   />
//                 </div>
//                 <div>
//                   <Label>Project Name</Label>
//                   <Input
//                     value={formData.ProjectName}
//                     onChange={(e) => handleChange("ProjectName", e.target.value)}
//                   />
//                 </div>
//                 <div>
//                   <Label>Project Manager</Label>
//                   <Input
//                     value={formData.ProjectManager}
//                     onChange={(e) => handleChange("ProjectManager", e.target.value)}
//                   />
//                 </div>

//                 <div className="grid grid-cols-2 gap-2">
//                   <div>
//                     <Label>Start Date</Label>
//                     <Input
//                       type="date"
//                       value={formData.StartDate}
//                       onChange={(e) => handleChange("StartDate", e.target.value)}
//                     />
//                   </div>
//                   <div>
//                     <Label>End Date</Label>
//                     <Input
//                       type="date"
//                       value={formData.EndDate}
//                       onChange={(e) => handleChange("EndDate", e.target.value)}
//                     />
//                   </div>
//                 </div>

//                 <div>
//                   <Label>Budget Amount</Label>
//                   <Input
//                     type="number"
//                     value={formData.BudgetAmount}
//                     onChange={(e) => handleChange("BudgetAmount", e.target.value)}
//                   />
//                 </div>

//                 <div>
//                   <Label>Department</Label>
//                   <Input
//                     value={formData.Department}
//                     onChange={(e) => handleChange("Department", e.target.value)}
//                   />
//                 </div>

//                 <Button
//                   type="button"
//                   className="w-full bg-gray-700 hover:bg-gray-800 mt-3 flex justify-between"
//                   onClick={() => setBudgetDrawerOpen(true)}
//                 >
//                   <IoIosArrowDropleftCircle /> Add Budgets
//                 </Button>

//                 <Button
//                   type="submit"
//                   disabled={loading}
//                   className="w-full bg-indigo-600 hover:bg-indigo-700 mt-3"
//                 >
//                   {loading ? "Submitting..." : "Create Project"}
//                 </Button>
//               </form>
//             </div>
//           </motion.div>

//           {/* SECOND DRAWER — Add Budgets */}
//           <AnimatePresence>
//             {budgetDrawerOpen && (
//               <motion.div
//                 className="fixed top-5 right-[530px] w-[450px] max-h-[95vh] bg-white shadow-2xl z-45 flex flex-col rounded-2xl p-3 overflow-hidden"
//                 initial={{ x: "100%" }}
//                 animate={{ x: 0 }}
//                 exit={{ x: "100%" }}
//                 transition={{ type: "spring", stiffness: 300, damping: 30 }}
//               >
//                 <div className="p-4 flex justify-between items-center bg-indigo-600 rounded-2xl m-2">
//                   <h2 className="font-bold text-lg text-white">Budgets</h2>
//                   <Button variant="outline" size="sm" onClick={() => setBudgetDrawerOpen(false)}>
//                     Close
//                   </Button>
//                 </div>

//                 <div className="p-3 flex-1 overflow-y-auto">
//                   {formData.Budgets.map((budget, index) => (
//                     <div key={index} className="border rounded-lg p-3 mb-3 bg-gray-50 space-y-2">
//                       <Label>Budget Code</Label>
//                       <Input
//                         value={budget.BudgetCode}
//                         onChange={(e) => handleBudgetChange(index, "BudgetCode", e.target.value)}
//                       />
//                       <Label>Budget Title</Label>
//                       <Input
//                         value={budget.BudgetTitle}
//                         onChange={(e) => handleBudgetChange(index, "BudgetTitle", e.target.value)}
//                       />
//                       <Label>Fiscal Year</Label>
//                       <Input
//                         type="number"
//                         value={budget.FiscalYear}
//                         onChange={(e) => handleBudgetChange(index, "FiscalYear", e.target.value)}
//                       />

//                       <div className="flex justify-between mt-3">
//                         <Button
//                           type="button"
//                           className="bg-indigo-600 hover:bg-indigo-700"
//                           onClick={() => addBudgetLine(index)}
//                         >
//                           Add Budget Lines
//                         </Button>

//                         <Button
//                           type="button"
//                           variant="destructive"
//                           className="bg-red-600 hover:bg-red-700"
//                           onClick={() => removeBudget(index)}
//                         >
//                           Remove
//                         </Button>
//                       </div>
//                     </div>
//                   ))}

//                   <Button
//                     type="button"
//                     className="mt-3 w-full bg-indigo-600 hover:bg-indigo-700"
//                     onClick={addBudget}
//                   >
//                     Add Budget
//                   </Button>
//                 </div>
//               </motion.div>
//             )}
//           </AnimatePresence>

//           {/* THIRD DRAWER — Add Multiple Budget Lines */}
//           <AnimatePresence>
//             {lineDrawerOpen && (
//               <AddBudgetLineDrawer
//                 onClose={() => setLineDrawerOpen(false)}
//                 onSave={saveBudgetLines}
//               />
//             )}
//           </AnimatePresence>
//         </>
//       )}
//     </AnimatePresence>
//   );
// }

// /* Subcomponent — Drawer 3 for adding multiple Budget Lines */
// function AddBudgetLineDrawer({ onClose, onSave }) {
//   const [budgetLines, setBudgetLines] = useState([]);

//   const handleLineChange = (index, field, value) => {
//     const updated = [...budgetLines];
//     updated[index] = { ...updated[index], [field]: value };
//     setBudgetLines(updated);
//   };

//   const addLine = () => {
//     setBudgetLines([
//       ...budgetLines,
//       {
//         AccountCode: "",
//         Description: "",
//         AllocatedAmount: "",
//         SpentAmount: "",
//         Department: "",
//         Category: "",
//         Status: "Active",
//       },
//     ]);
//   };

//   const removeLine = (index) => {
//     const updated = budgetLines.filter((_, i) => i !== index);
//     setBudgetLines(updated);
//   };

//   return (
//     <motion.div
//       className="fixed top-5 right-[1000px] w-[450px] max-h-[95vh] bg-white shadow-2xl z-50 flex flex-col rounded-2xl p-3 overflow-hidden"
//       initial={{ x: "100%" }}
//       animate={{ x: 0 }}
//       exit={{ x: "100%" }}
//       transition={{ type: "spring", stiffness: 300, damping: 30 }}
//     >
//       <div className="p-4 flex justify-between items-center bg-indigo-600 rounded-2xl m-2">
//         <h2 className="font-bold text-lg text-white">Budget Lines</h2>
//         <Button variant="outline" size="sm" onClick={onClose}>
//           Close
//         </Button>
//       </div>

//       <div className="p-3 flex-1 overflow-y-auto">
//         {budgetLines.map((line, index) => (
//           <div key={index} className="border rounded-lg p-3 mb-3 bg-gray-50 space-y-2">
//             <Label>Account Code</Label>
//             <Input
//               value={line.AccountCode}
//               onChange={(e) => handleLineChange(index, "AccountCode", e.target.value)}
//             />
//             <Label>Description</Label>
//             <Input
//               value={line.Description}
//               onChange={(e) => handleLineChange(index, "Description", e.target.value)}
//             />
//             <Label>Allocated Amount</Label>
//             <Input
//               type="number"
//               value={line.AllocatedAmount}
//               onChange={(e) => handleLineChange(index, "AllocatedAmount", e.target.value)}
//             />
//             <Label>Spent Amount</Label>
//             <Input
//               type="number"
//               value={line.SpentAmount}
//               onChange={(e) => handleLineChange(index, "SpentAmount", e.target.value)}
//             />
//             <Label>Department</Label>
//             <Input
//               value={line.Department}
//               onChange={(e) => handleLineChange(index, "Department", e.target.value)}
//             />
//             <Label>Category</Label>
//             <Input
//               value={line.Category}
//               onChange={(e) => handleLineChange(index, "Category", e.target.value)}
//             />

//             <Button
//               type="button"
//               variant="destructive"
//               className="mt-2 bg-red-600 hover:bg-red-700 w-full"
//               onClick={() => removeLine(index)}
//             >
//               Remove Line
//             </Button>
//           </div>
//         ))}

//         <Button
//           type="button"
//           className="w-full bg-gray-700 hover:bg-gray-800 mt-3"
//           onClick={addLine}
//         >
//           Add Budget Line
//         </Button>

//         <Button
//           type="button"
//           className="w-full bg-indigo-600 hover:bg-indigo-700 mt-3"
//           onClick={() => onSave(budgetLines)}
//         >
//           Save All Lines
//         </Button>
//       </div>
//     </motion.div>
//   );
// }



import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Swal from "sweetalert2";

export default function AddProjectWithBudgetLines({ open, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [lineDrawerOpen, setLineDrawerOpen] = useState(false);
  const [budgetLines, setBudgetLines] = useState([]);

  const [formData, setFormData] = useState({
    ProjectCode: "",
    ProjectName: "",
    ProjectManager: "",
    StartDate: "",
    EndDate: "",
    BudgetAmount: "",
    Department: "",
    FiscalYear: "",
  });

  const handleChange = (field, value) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      ProjectCode: formData.ProjectCode,
      ProjectName: formData.ProjectName,
      ProjectManager: formData.ProjectManager,
      StartDate: formData.StartDate,
      EndDate: formData.EndDate,
      BudgetAmount: formData.BudgetAmount,
      Department: formData.Department,
      Budgets: [
        {
          BudgetCode: formData.ProjectCode,
          BudgetTitle: formData.ProjectName,
          FiscalYear: formData.FiscalYear,
          TotalAmount: formData.BudgetAmount,
          ApprovedAmount: formData.BudgetAmount,
          ApprovalStatus: "Pending",
          CreatedBy: "Admin",
          CreatedDate: new Date().toISOString().split("T")[0],
          BudgetLines: budgetLines,
        },
      ],
    };

    console.log(payload)
    try {
      const res = await fetch(
        `${import.meta.env.VITE_APP_PRO_URL}/api/BudgetManagement/CreateProjectWithBudgetsAndLines`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
          },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) throw new Error("Failed to create project");

      Swal.fire("Success", "Project and Budget Lines created successfully!", "success");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to create project.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 bg-black z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* MAIN DRAWER */}
          <motion.div
            className="fixed top-5 right-5 w-[500px] max-h-[95vh] bg-white shadow-2xl z-50 flex flex-col rounded-2xl p-3 overflow-hidden"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="p-4 flex justify-between items-center bg-indigo-600 rounded-2xl m-2">
              <h2 className="font-bold text-lg text-white">Create Project & Budget</h2>
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>

            <div className="p-3 flex-1 overflow-y-auto">
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <Label>Project Code</Label>
                  <Input
                    value={formData.ProjectCode}
                    onChange={(e) => handleChange("ProjectCode", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Project Name</Label>
                  <Input
                    value={formData.ProjectName}
                    onChange={(e) => handleChange("ProjectName", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Project Manager</Label>
                  <Input
                    value={formData.ProjectManager}
                    onChange={(e) => handleChange("ProjectManager", e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={formData.StartDate}
                      onChange={(e) => handleChange("StartDate", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={formData.EndDate}
                      onChange={(e) => handleChange("EndDate", e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-1">
                  {/* <div>
                    <Label>Fiscal Year</Label>
                    <Input
                      type="number"
                      value={formData.FiscalYear}
                      onChange={(e) => handleChange("FiscalYear", e.target.value)}
                    />
                  </div> */}
                  <div>
                    <Label>Budget Amount</Label>
                    <Input
                      type="number"
                      value={formData.BudgetAmount}
                      onChange={(e) => handleChange("BudgetAmount", e.target.value)}
                    />
                  </div>
                </div>

                {/* <div>
                  <Label>Department</Label>
                  <Input
                    value={formData.Department}
                    onChange={(e) => handleChange("Department", e.target.value)}
                  />
                </div> */}

                <Button
                  type="button"
                  className="w-full bg-gray-700 hover:bg-gray-800 mt-3"
                  onClick={() => setLineDrawerOpen(true)}
                >
                  Add Budget Lines
                </Button>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 mt-3"
                >
                  {loading ? "Submitting..." : "Create Project"}
                </Button>
              </form>
            </div>
          </motion.div>

          {/* SECOND DRAWER — Budget Lines */}
          <AnimatePresence>
            {lineDrawerOpen && (
              <AddBudgetLineDrawer
                onClose={() => setLineDrawerOpen(false)}
                onSave={setBudgetLines}
              />
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
}

/* Subdrawer for Adding Multiple Budget Lines */
function AddBudgetLineDrawer({ onClose, onSave }) {
  const [lines, setLines] = useState([]);

  const handleChange = (index, field, value) => {
    const updated = [...lines];
    updated[index] = { ...updated[index], [field]: value };
    setLines(updated);
  };

  const addLine = () => {
    setLines([
      ...lines,
      {
        AccountCode: "",
        Description: "",
        AllocatedAmount: "",
        SpentAmount: "",
        Department: "",
        Category: "",
        Status: "Active",
      },
    ]);
  };

  const removeLine = (index) => {
    setLines(lines.filter((_, i) => i !== index));
  };

  return (
    <motion.div
      className="fixed top-5 right-[530px] w-[450px] max-h-[95vh] bg-white shadow-2xl z-50 flex flex-col rounded-2xl p-3 overflow-hidden"
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="p-4 flex justify-between items-center bg-indigo-600 rounded-2xl m-2">
        <h2 className="font-bold text-lg text-white">Budget Lines</h2>
        <Button variant="outline" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>

      <div className="p-3 flex-1 overflow-y-auto">
        {lines.map((line, index) => (
          <div key={index} className="border rounded-lg p-3 mb-3 bg-gray-50 space-y-2">
            <Label>Account Code</Label>
            <Input
              value={line.AccountCode}
              onChange={(e) => handleChange(index, "AccountCode", e.target.value)}
            />
            <Label>Description</Label>
            <Input
              value={line.Description}
              onChange={(e) => handleChange(index, "Description", e.target.value)}
            />
            {/* <Label>Allocated Amount</Label>
            <Input
              type="number"
              value={line.AllocatedAmount}
              onChange={(e) => handleChange(index, "AllocatedAmount", e.target.value)}
            />
            <Label>Spent Amount</Label>
            <Input
              type="number"
              value={line.SpentAmount}
              onChange={(e) => handleChange(index, "SpentAmount", e.target.value)}
            />
            <Label>Department</Label>
            <Input
              value={line.Department}
              onChange={(e) => handleChange(index, "Department", e.target.value)}
            />
            <Label>Category</Label>
            <Input
              value={line.Category}
              onChange={(e) => handleChange(index, "Category", e.target.value)}
            /> */}

            <Button
              type="button"
              variant="destructive"
              className="mt-2 bg-red-600 hover:bg-red-700 w-full"
              onClick={() => removeLine(index)}
            >
              Remove Line
            </Button>
          </div>
        ))}

        <Button
          type="button"
          className="w-full bg-gray-700 hover:bg-gray-800 mt-3"
          onClick={addLine}
        >
          Add Budget Line
        </Button>

        <Button
          type="button"
          className="w-full bg-indigo-600 hover:bg-indigo-700 mt-3"
          onClick={() => {
            onSave(lines);
            onClose();
          }}
        >
          Save Lines
        </Button>
      </div>
    </motion.div>
  );
}
