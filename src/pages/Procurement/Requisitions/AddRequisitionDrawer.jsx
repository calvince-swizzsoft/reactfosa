
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Swal from "sweetalert2";
import { FaTrash, FaChevronDown, FaChevronUp } from "react-icons/fa";
import { IoIosArrowDropleftCircle } from "react-icons/io";

export default function AddRequisitionDrawer({ open, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    RequestedBy: "",
    RequestedByFullname: "",
    DepartmentId: "",
    DepartmentName: "",
    Purpose: "",
    RequestDate: new Date().toISOString().split("T")[0],
    TotalAmount: 0,
    ProjectId: "",
    Projectcode: "",
    ProjectDescription: "",
    Lines: [
      {
        PRLineId: 0,
        RequisitionId: 0,
        ItemId: "",
        ItemDescription: "",
        Quantity: null,
        UnitPrice: null,
        AccountCode: "",
        BudgetLine: "",
        Budgetdescription: "",
      },
    ],
  });

  const [loading, setLoading] = useState(false);
  const [showLinesDrawer, setShowLinesDrawer] = useState(false);
  const [showEmployeesDrawer, setShowEmployeesDrawer] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [items, setItems] = useState([]);

  // 🆕 new states for project + budget lines
  const [projects, setProjects] = useState([]);
  const [selectedBudgets, setSelectedBudgets] = useState([]);
  const [budgetLines, setBudgetLines] = useState([]);

  // Fetch employees
  useEffect(() => {
    if (showEmployeesDrawer) {
      fetch(`${import.meta.env.VITE_APP_PRO_URL}/api/requisitions/employees`, {
        headers: { "ngrok-skip-browser-warning": "true" },
      })
        .then((res) => res.json())
        .then((data) => setEmployees(data))
        .catch((err) => console.error("Failed to fetch employees", err));
    }
  }, [showEmployeesDrawer]);

  // Fetch items
  useEffect(() => {
    if (showLinesDrawer) {
      fetch(`${import.meta.env.VITE_APP_INV_URL}/api/items`, {
        headers: { "ngrok-skip-browser-warning": "true" },
      })
        .then((res) => res.json())
        .then((data) => setItems(data.data || []))
        .catch((err) => console.error("Failed to fetch items", err));
    }
  }, [showLinesDrawer]);

  // 🆕 Fetch Projects with Budgets and Lines
  useEffect(() => {
    fetch(`${import.meta.env.VITE_APP_PRO_URL}/api/BudgetManagement/GetAllProjectWithBudgetsAndLines`, {
      headers: { "ngrok-skip-browser-warning": "true" },
    })
      .then((res) => res.json())
      .then((data) => setProjects(data || []))
      .catch((err) => console.error("Failed to fetch projects", err));
  }, []);

  const handleSelectEmployee = (emp) => {
    setFormData({
      ...formData,
      RequestedBy: emp.Id,
      RequestedByFullname: emp.Customer.FullName,
      DepartmentId: emp.DepartmentId,
      DepartmentName: emp.DepartmentDescription,
    });
    setShowEmployeesDrawer(false);
  };


  // 🆕 Handle Project Change
  const handleProjectSelect = (e) => {
    const selectedId = parseInt(e.target.value);
    const selectedProject = projects.find((p) => p.ProjectId === selectedId);

    if (selectedProject) {
      setFormData({
        ...formData,
        ProjectId: selectedProject.ProjectId,
        Projectcode: selectedProject.ProjectCode,
        ProjectDescription: selectedProject.ProjectName,
      });

      // flatten budget lines
      const allLines = selectedProject.Budgets.flatMap((b) => b.BudgetLines);
      setBudgetLines(allLines);
    }
  };

  const handleLineChange = (index, field, value) => {
    const updatedLines = [...formData.Lines];
    updatedLines[index][field] =
      field === "Quantity" || field === "UnitPrice"
        ? parseFloat(value) || 0
        : value;

    const lineTotals = updatedLines.map(
      (line) =>
        (parseFloat(line.Quantity) || 0) * (parseFloat(line.UnitPrice) || 0)
    );
    const totalAmount = lineTotals.reduce((sum, t) => sum + t, 0);

    setFormData({
      ...formData,
      Lines: updatedLines,
      TotalAmount: totalAmount,
    });
  };

  const addLine = () => {
    setFormData({
      ...formData,
      Lines: [
        ...formData.Lines,
        {
          PRLineId: 0,
          RequisitionId: 0,
          ItemId: "",
          ItemDescription: "",
          Quantity: null,
          UnitPrice: null,
          AccountCode: "",
          BudgetLine: "",
          Budgetdescription: "",
        },
      ],
    });
    setExpandedIndex(formData.Lines.length);
  };

  const removeLine = (index) => {
    const updatedLines = formData.Lines.filter((_, i) => i !== index);
    setFormData({ ...formData, Lines: updatedLines });
    setExpandedIndex(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_APP_PRO_URL}/api/requisitions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
          },
          body: JSON.stringify(formData),
        }
      );

      if (!res.ok) throw new Error("Failed to add requisition");

      Swal.fire("Success", "Requisition added successfully!", "success");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to add requisition.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black z-49"
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
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="p-4 flex justify-between items-center bg-indigo-600 rounded-2xl m-2">
              <h2 className="font-bold text-lg text-white">Add Requisition</h2>
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>

            <div className="p-3 flex-1 overflow-y-auto">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Requested By (Auto from Employee) */}
                <div className="hidden">
                  <Label>Requested By (Id)</Label>
                  <Input value={formData.RequestedBy} readOnly />
                </div>
                <div>
                  <Label>Full Name</Label>
                  <Input value={formData.RequestedByFullname} readOnly />
                </div>
                <div>
                  <Label>Department</Label>
                  <Input value={formData.DepartmentName} readOnly />
                </div>

                <Button
                  type="button"
                  className="bg-gray-700 w-full"
                  onClick={() => setShowEmployeesDrawer(true)}
                >
                  Select Employee
                </Button>

                {/* 🆕 Project Dropdown */}
                <div>
                  <Label>Select Project</Label>
                  <select
                    className="border p-2 w-full rounded"
                    value={formData.ProjectId}
                    onChange={handleProjectSelect}
                  >
                    <option value="">-- Select Project --</option>
                    {projects.map((proj) => (
                      <option key={proj.ProjectId} value={proj.ProjectId}>
                        {proj.ProjectCode} - {proj.ProjectName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label>Purpose</Label>
                  <Input
                    placeholder="Purpose of requisition"
                    value={formData.Purpose}
                    onChange={(e) =>
                      setFormData({ ...formData, Purpose: e.target.value })
                    }
                    required
                  />
                </div>

                <Button
                  type="button"
                  onClick={() => setShowLinesDrawer(true)}
                  className="bg-gray-700 w-full flex justify-between gap-2"
                >
                  <IoIosArrowDropleftCircle /> Add Requisition Lines (
                  {formData.Lines.length})
                </Button>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                >
                  {loading ? "Saving..." : "Save Requisition"}
                </Button>
              </form>
            </div>
          </motion.div>


          {/* Employee Selector Sub-Drawer */}
          <AnimatePresence>
            {showEmployeesDrawer && (
              <>
                <motion.div
                  className="fixed inset-0 bg-black z-40"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.3 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowEmployeesDrawer(false)}
                />
                <motion.div
                  className="fixed top-5 right-[520px] w-[400px] max-h-[90vh] bg-white shadow-xl z-49 flex flex-col rounded-2xl p-3"
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  <div className="p-4 flex justify-between items-center bg-indigo-600 rounded-2xl m-2">
                    <h2 className="font-bold text-lg text-white">
                      Select Employee
                    </h2>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowEmployeesDrawer(false)}
                    >
                      Close
                    </Button>
                  </div>
                  <div className="p-3 flex-1 overflow-y-auto space-y-2">
                    {employees.length <= 0 && <div>loading...</div>}
                    {employees.map((emp) => (
                      <div
                        key={emp.Id}
                        className="p-2 border rounded-lg hover:bg-gray-100 cursor-pointer shadow-lg"
                        onClick={() => handleSelectEmployee(emp)}
                      >
                        <p className="font-semibold">
                          {emp.Customer.FullName}
                        </p>
                        <p className="text-sm text-gray-600">
                          Dept: {emp.DepartmentDescription}
                        </p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </>
            )}

          </AnimatePresence>

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
                  <h2 className="font-bold text-lg text-white">
                    Requisition Lines
                  </h2>
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
                        onClick={() =>
                          setExpandedIndex(
                            expandedIndex === idx ? null : idx
                          )
                        }
                      >
                        <span className="font-semibold">
                          Line {idx + 1} -{" "}
                          {line.ItemDescription || "New Item"}
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
                          {expandedIndex === idx ? (
                            <FaChevronUp />
                          ) : (
                            <FaChevronDown />
                          )}
                        </div>
                      </div>
                      {/* Collapsible content */}
                      <AnimatePresence>
                        {expandedIndex === idx && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden p-2 space-y-2"
                          >
                            {/* Item selector */}
                            <Label>Item</Label>
                            <select
                              className="border rounded p-2 w-full"
                              value={line.ItemId}
                              onChange={(e) => {
                                const selectedItem = items.find(
                                  (it) => it.Id === e.target.value
                                );
                                if (selectedItem) {
                                  handleLineChange(
                                    idx,
                                    "ItemId",
                                    selectedItem.Id
                                  );
                                  handleLineChange(
                                    idx,
                                    "ItemDescription",
                                    selectedItem.Description
                                  );
                                  handleLineChange(
                                    idx,
                                    "UnitPrice",
                                    selectedItem.InventoryBalance
                                  );
                                  handleLineChange(
                                    idx,
                                    "AccountCode",
                                    selectedItem.ItemNo
                                  );
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


                            <Label>BudgetLine</Label>
                            <select
                              className="border p-2 w-full rounded"
                              value={line.BudgetLine} // <-- ADD THIS LINE
                              onChange={(e) => {
                                const selectedLine = budgetLines.find(
                                  (b) => b.BudgetLineId === parseInt(e.target.value)
                                );
                                if (selectedLine) {
                                  handleLineChange(idx, "BudgetLine", selectedLine.BudgetLineId);
                                  handleLineChange(idx, "Budgetdescription", selectedLine.Description);
                                } else {
                                  handleLineChange(idx, "BudgetLine", "");
                                  handleLineChange(idx, "Budgetdescription", "");
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
                              onChange={(e) =>
                                handleLineChange(idx, "Quantity", e.target.value)
                              }
                            />
                            <Label>Unit Price</Label>
                            <Input
                              type="number"
                              placeholder="Unit Price"
                              value={line.UnitPrice}
                              onChange={(e) =>
                                handleLineChange(idx, "UnitPrice", e.target.value)
                              }
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                  <Button
                    type="button"
                    className="bg-indigo-600 w-full"
                    onClick={addLine}
                  >
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
