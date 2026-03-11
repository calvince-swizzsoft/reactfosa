import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Swal from "sweetalert2";
import { IoIosArrowDropleftCircle } from "react-icons/io";



export default function AddRFQ({ open, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [lineDrawerOpen, setLineDrawerOpen] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [Employees, setEmployees] = useState(false);
  const [Locations, setLocations] = useState(false);
  const [Vendors, setVendors] = useState(false);
  const [items, setItems] = useState([]);
  const [projects, setProjects] = useState([]);
  const [budgetLines, setBudgetLines] = useState([]);



  const [formData, setFormData] = useState({
    RFQNumber: "",
    ItemDescription: "",
    Quantity: 1,
    ExpectedDeliveryDate: "",
    Priority: "",
    Department: "",
    RequestedBy: "",
    EstimatedBudget: "",
    DeliveryLocation: "",
    AdditionalNotes: "",
    VendorIds: [],
    Lines: [],
  });

  const handleChange = (field, value) => {
    if (field === "RequestedBy") {
      const selectedEmp = Employees.find((emp) => emp.Customer.FullName === value);
      setFormData((prev) => ({
        ...prev,
        RequestedBy: value,
        Department: selectedEmp ? selectedEmp.DepartmentDescription : "",
      }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };


  // Fetch employees
  useEffect(() => {
    fetchLocations();
    FetchEmployees(); 
    fetchVendors();
    fetchItems();
    fetchProjects();
  }, []);

  //Vendors
  const fetchVendors = () => {
    fetch(`${import.meta.env.VITE_APP_PRO_URL}/api/vendors`, {
      headers: { "ngrok-skip-browser-warning": "true" },
    })
      .then((res) => res.json())
      .then((data) => {
        setVendors(data.data || []);
      })
      .catch((err) => console.error("Failed to fetch vendors", err));
  };
  //Employee
  const FetchEmployees = () => {
    fetch(`${import.meta.env.VITE_APP_PRO_URL}/api/requisitions/employees`, {
      headers: { "ngrok-skip-browser-warning": "true" },
    })
      .then((res) => res.json())
      .then((data) => setEmployees(data || []))
      .catch((err) => console.error("Failed to fetch employees", err));
  }

  //location
  const fetchLocations = () => {
    fetch(`${import.meta.env.VITE_APP_INV_URL}/api/locations`, {
      headers: { "ngrok-skip-browser-warning": "true" },
    })
      .then((res) => res.json())
      .then((data) => {
        setLocations(data.data || []);
      })
      .catch((err) => console.error("Failed to fetch Location"));
  };

  //items
  const fetchItems = () => {
    fetch(`${import.meta.env.VITE_APP_INV_URL}/api/items`, {
      headers: { "ngrok-skip-browser-warning": "true" },
    })
      .then((res) => res.json())
      .then((data) => setItems(data.data || []))
      .catch((err) => console.error("Failed to fetch items", err));
  };

  // Fetch Projects with Budgets and Lines
  const fetchProjects = () => {
    fetch(`${import.meta.env.VITE_APP_PRO_URL}/api/BudgetManagement/GetAllProjectWithBudgetsAndLines`, {
      headers: { "ngrok-skip-browser-warning": "true" },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data && data) {
          setProjects(data || []);
        }
      })
      .catch((err) => console.error("Failed to fetch projects", err));
  };


  // --- Vendor Multi-select ---
  const handleVendorSelection = (vendorId) => {
    setFormData((prev) => {
      const updated = prev.VendorIds.includes(vendorId)
        ? prev.VendorIds.filter((id) => id !== vendorId)
        : [...prev.VendorIds, vendorId];
      return { ...prev, VendorIds: updated };
    });
  };


  // --- Line Items Logic ---
  const handleLineChange = (index, field, value) => {
    const updatedLines = [...formData.Lines];
    updatedLines[index] = {
      ...updatedLines[index],
      [field]: value,
    };

    const qty = Number(updatedLines[index].Quantity) || 0;
    const price = Number(updatedLines[index].EstimatedUnitPrice) || 0;
    updatedLines[index].EstimatedTotal = qty * price;

    setFormData({ ...formData, Lines: updatedLines });
  };


  const addLine = () => {
    const newLine = {
      ItemId: "",
      ItemCode: "",
      ItemDescription: "",
      Quantity: 1,
      UnitOfMeasure: "",
      EstimatedUnitPrice: "",
      EstimatedTotal: 0,
      BudgetLineId: "",
      BudgetDescription: "",
      Notes: "",
    };
    setFormData({
      ...formData,
      Lines: [...formData.Lines, newLine],
    });
    setExpandedIndex(formData.Lines.length);
  };


  const removeLine = (index) => {
    const updatedLines = [...formData.Lines];
    updatedLines.splice(index, 1);
    setFormData({ ...formData, Lines: updatedLines });
    if (expandedIndex === index) setExpandedIndex(null);
  };

  // --- Submit Logic ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const now = new Date().toISOString();

      const payload = {
        Id: 0,
        VendorId: 0,
        VendorName: "sample string 3",
        ItemDescription: formData.ItemDescription,
        Quantity: Number(formData.Quantity),
        ExpectedDeliveryDate: formData.ExpectedDeliveryDate || now,
        CreatedDate: now,
        Status: "Pending",
        projectid: 1,
        RFQNumber: formData.RFQNumber,
        Priority: formData.Priority,
        Department: formData.Department,
        RequestedBy: formData.RequestedBy,
        EstimatedBudget: Number(formData.EstimatedBudget),
        DeliveryLocation: formData.DeliveryLocation,
        AdditionalNotes: formData.AdditionalNotes,
        // Lines: formData.Lines.map((line) => ({
        //   Id: 0,
        //   RFQId: 0,
        //   projectid: 1,
        //   projectDescription: "N/A",
        //   BudgetDescription: "N/A",
        //   BudgetLineId: Number(line.BudgetLineId) || 0,
        //   ItemCode: line.ItemCode,
        //   ItemDescription: line.ItemDescription,
        //   Quantity: Number(line.Quantity),
        //   UnitOfMeasure: line.UnitOfMeasure,
        //   EstimatedUnitPrice: Number(line.EstimatedUnitPrice),
        //   EstimatedTotal: Number(line.EstimatedTotal),
        //   CreatedDate: now,
        //   Notes: line.Notes,
        // })),
        Lines: formData.Lines.map((line) => ({
          Id: 0,
          RFQId: 0,
          projectid: line.projectId || 0,
          projectDescription: line.projectDescription || "N/A",
          BudgetLineId: Number(line.BudgetLineId) || 0,
          BudgetDescription: line.BudgetDescription || "N/A",
          ItemCode: line.ItemCode,
          ItemDescription: line.ItemDescription,
          Quantity: Number(line.Quantity),
          UnitOfMeasure: line.UnitOfMeasure,
          EstimatedUnitPrice: Number(line.EstimatedUnitPrice),
          EstimatedTotal: Number(line.EstimatedTotal),
          CreatedDate: now,
          Notes: line.Notes,
        })),

        VendorIds: formData.VendorIds.length ? formData.VendorIds : [1, 2],
      };

      const res = await fetch(`${import.meta.env.VITE_APP_PRO_URL}/api/rfq/CreateRFQ`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to create RFQ");

      Swal.fire("Success", "RFQ created successfully!", "success");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to create RFQ.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("FormData monitoring:", formData);

  }, [formData]);

  console.log(projects);

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

          {/* Main Drawer */}
          <motion.div
            className="fixed top-5 right-5 w-[600px] max-h-[95vh] bg-white shadow-xl z-50 flex flex-col rounded-2xl p-3 overflow-hidden"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="p-4 flex justify-between items-center bg-indigo-600 rounded-2xl m-2">
              <h2 className="font-bold text-lg text-white">Create RFQ</h2>
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>

            <div className="p-3 flex-1 overflow-y-auto">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* RFQ Fields */}
                <div>
                  <Label>RFQ Number</Label>
                  <Input
                    className="bg-white border-2 border-gray-300"
                    value={formData.RFQNumber}
                    onChange={(e) => handleChange("RFQNumber", e.target.value)}
                    required
                  />
                </div>

                {/* <div>
                  <Label>Item Description</Label>
                  <Input
                    className="bg-white border-2 border-gray-300"
                    value={formData.ItemDescription}
                    onChange={(e) => handleChange("ItemDescription", e.target.value)}
                  />
                </div> */}

                <div>
                  <Label>Expected Delivery Date</Label>
                  <Input
                    type="date"
                    className="bg-white border-2 border-gray-300"
                    value={formData.ExpectedDeliveryDate}
                    onChange={(e) => handleChange("ExpectedDeliveryDate", e.target.value)}
                  />
                </div>

                <div>
                  <Label>Priority</Label>
                  <Input
                    className="bg-white border-2 border-gray-300"
                    value={formData.Priority}
                    onChange={(e) => handleChange("Priority", e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Requested By</Label>
                    <select
                      className="border p-2 w-full rounded"
                      value={formData.RequestedBy}
                      onChange={(e) => handleChange("RequestedBy", e.target.value)}
                    >
                      <option value="">-- Select Requester --</option>
                      {Employees && Employees.map((emp) => (
                        <option key={emp.Id} value={emp.Customer.FullName}>
                          {emp.Customer.FullName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Department</Label>
                    <Input
                      className="bg-white border-2 border-gray-300"
                      value={formData.Department}
                      onChange={(e) => handleChange("Department", e.target.value)}
                      readOnly // optional to prevent manual editing
                    />
                  </div>
                </div>



                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Estimated Budget</Label>
                    <Input
                      type="number"
                      className="bg-white border-2 border-gray-300"
                      value={formData.EstimatedBudget}
                      onChange={(e) => handleChange("EstimatedBudget", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Delivery Location</Label>
                    <select
                      className=" bg-white border-2 border-gray-300 p-2 w-full rounded"
                      value={formData.DeliveryLocation}
                      onChange={(e) => handleChange("DeliveryLocation", e.target.value)}
                    >
                      <option value="">-- Select Locations--</option>
                      {Locations && Locations.map((Loc) => (
                        <option key={Loc.Id} value={Loc.Description}>
                          {Loc.Description}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <Label>Additional Notes</Label>
                  <Input
                    className="bg-white border-2 border-gray-300"
                    value={formData.AdditionalNotes}
                    onChange={(e) => handleChange("AdditionalNotes", e.target.value)}
                  />
                </div>

                {/* Vendor Selection */}
                <div>
                  <Label>Select Vendor</Label>
                  <select
                    className="mt-3 bg-white border-2 border-gray-300 p-2 w-full rounded"
                    value={formData.VendorId || ""}
                    onChange={(e) => {
                      const id = Number(e.target.value);
                      const selectedVendor = Vendors.find((v) => v.VendorId === id);

                      if (selectedVendor) {
                        setFormData((prev) => ({
                          ...prev,
                          VendorId: selectedVendor.VendorId,
                          VendorName: selectedVendor.VendorName,
                          VendorIds: prev.VendorIds.includes(selectedVendor.VendorId)
                            ? prev.VendorIds
                            : [...prev.VendorIds, selectedVendor.VendorId],
                        }));
                      }
                    }}
                  >
                    <option value="">-- Select Vendor --</option>
                    {Vendors.map((vendor) => (
                      <option key={vendor.VendorId} value={vendor.VendorId}>
                        {vendor.VendorName}
                      </option>
                    ))}
                  </select>

                  {/* Show selected vendors visually */}
                  {formData.VendorIds.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {formData.VendorIds.map((id) => {
                        const vendor = Vendors.find((v) => v.VendorId === id);
                        return (
                          <span
                            key={id}
                            className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm flex items-center gap-1"
                          >
                            {vendor ? vendor.VendorName : `Vendor ${id}`}
                            <button
                              type="button"
                              className="text-red-500 hover:text-red-700"
                              onClick={() =>
                                setFormData((prev) => ({
                                  ...prev,
                                  VendorIds: prev.VendorIds.filter((vid) => vid !== id),
                                }))
                              }
                            >
                              ✕
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>


                {/* Line Items Trigger */}
                <Button
                  type="button"
                  className="w-full bg-gray-600 hover:bg-gray-700 mt-4 flex justify-between"
                  onClick={() => setLineDrawerOpen(true)}
                >
                  <IoIosArrowDropleftCircle /> Add RFQ Line Items
                </Button>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 mt-4"
                >
                  {loading ? "Submitting..." : "Create RFQ"}
                </Button>
              </form>
            </div>
          </motion.div>


          {/* Line Items Drawer */}
          <AnimatePresence>
            {lineDrawerOpen && (
              <motion.div
                className="fixed top-5 right-[640px] w-[480px] max-h-[95vh] bg-white shadow-xl z-45 flex flex-col rounded-2xl p-3 overflow-hidden"
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <div className="p-4 flex justify-between items-center bg-indigo-600 rounded-2xl m-2">
                  <h2 className="font-bold text-lg text-white">RFQ Line Items</h2>
                  <Button variant="outline" size="sm" onClick={() => setLineDrawerOpen(false)}>
                    Close
                  </Button>
                </div>

                <div className="p-3 flex-1 overflow-y-auto">


                  {formData.Lines.map((line, index) => (
                    <div key={index} className="border rounded-lg mt-3">
                      <div
                        className="flex justify-between items-center p-3 bg-gray-600 text-white rounded-lg cursor-pointer"
                        onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                      >
                        <span className="font-medium">
                          {line.ItemDescription || `Line ${index + 1}`}
                        </span>
                        <span>{expandedIndex === index ? "▲" : "▼"}</span>
                      </div>

                      <AnimatePresence>
                        {expandedIndex === index && (
                          <motion.div
                            className="p-3 space-y-3 bg-gray-100"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                          >
                            {/* 🔹 Autofill from Items API */}
                            <div>
                              <div>
                                <Label>Item</Label>
                                <select
                                  className="border rounded p-2 w-full"
                                  value={line.ItemId || ""}
                                  onChange={(e) => {
                                    const selectedItem = items.find(
                                      (it) => it.Id === e.target.value
                                    );

                                    if (selectedItem) {
                                      setFormData((prev) => {
                                        const updatedLines = [...prev.Lines];
                                        const updatedLine = {
                                          ...updatedLines[index],
                                          ItemId: selectedItem.Id,
                                          ItemCode: selectedItem.ItemNo,
                                          ItemDescription: selectedItem.Description,
                                          UnitOfMeasure: selectedItem.UnitOfMeasureDescription || "",
                                          EstimatedUnitPrice: selectedItem.UnitPrice || selectedItem.InventoryBalance || 0,
                                        };

                                        updatedLine.EstimatedTotal =
                                          (Number(updatedLine.Quantity) || 0) *
                                          (Number(updatedLine.EstimatedUnitPrice) || 0);

                                        updatedLines[index] = updatedLine;
                                        return { ...prev, Lines: updatedLines };
                                      });
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

                              </div>


                            </div>

                            <div>
                              <Label>Item Code</Label>
                              <Input
                                className="bg-white border-2 border-gray-300"
                                value={line.ItemCode}
                                onChange={(e) =>
                                  handleLineChange(index, "ItemCode", e.target.value)
                                }
                              />
                            </div>
                            <div>
                              <Label>Description</Label>
                              <Input
                                className="bg-white border-2 border-gray-300"
                                value={line.ItemDescription}
                                onChange={(e) =>
                                  handleLineChange(index, "ItemDescription", e.target.value)
                                }
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label>Quantity</Label>
                                <Input
                                  type="number"
                                  className="bg-white border-2 border-gray-300"
                                  value={line.Quantity}
                                  onChange={(e) =>
                                    handleLineChange(index, "Quantity", e.target.value)
                                  }
                                />
                              </div>
                              <div>
                                <Label>Unit Of Measure</Label>
                                <Input
                                  type="text"
                                  className="bg-white border-2 border-gray-300"
                                  value={line.UnitOfMeasure}
                                  onChange={(e) =>
                                    handleLineChange(index, "UnitOfMeasure", e.target.value)
                                  }
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label>Estimated Unit Price</Label>
                                <Input
                                  type="number"
                                  className="bg-white border-2 border-gray-300"
                                  value={line.EstimatedUnitPrice}
                                  onChange={(e) =>
                                    handleLineChange(index, "EstimatedUnitPrice", e.target.value)
                                  }
                                />
                              </div>
                              <div>
                                <Label>Estimated Total</Label>
                                <Input
                                  type="number"
                                  className="bg-gray-100 border-2 border-gray-300"
                                  value={line.EstimatedTotal}
                                  readOnly
                                />
                              </div>
                            </div>

                            {/* 🔹 Project & Budget Autofill Section */}
                            {/* 🔹 Project & Budget Autofill Section */}
                            <div className="grid grid-cols-1 gap-3">
                              {/* --- Project --- */}
                              <div>
                                <Label>Project</Label>
                                <select
                                  className="border p-2 w-full rounded bg-white"
                                  value={line.projectId || ""}
                                  onChange={(e) => {
                                    const selectedProjectId = Number(e.target.value);
                                    const selectedProject = projects.find(
                                      (p) => p.ProjectId === selectedProjectId
                                    );

                                    // extract all budget lines for this project
                                    const allBudgetLines = selectedProject?.Budgets?.flatMap(
                                      (b) => b.BudgetLines || []
                                    ) || [];

                                    setFormData((prev) => {
                                      const updatedLines = [...prev.Lines];
                                      updatedLines[index] = {
                                        ...updatedLines[index],
                                        projectId: selectedProjectId,
                                        projectDescription: selectedProject?.ProjectName || "",
                                        BudgetLineId: "",
                                        BudgetDescription: "",
                                        _budgetLines: allBudgetLines, // 👈 attach to this specific line
                                      };
                                      return { ...prev, Lines: updatedLines };
                                    });
                                  }}
                                >
                                  <option value="">-- Select Project --</option>
                                  {projects.map((p) => (
                                    <option key={p.ProjectId} value={p.ProjectId}>
                                      {p.ProjectCode} - {p.ProjectName}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {/* --- Budget Line --- */}
                              <div>
                                <Label>Budget Line</Label>
                                <select
                                  className="border p-2 w-full rounded bg-white"
                                  value={line.BudgetLineId || ""}
                                  onChange={(e) => {
                                    const selectedLineId = Number(e.target.value);
                                    const selectedLine = line._budgetLines?.find(
                                      (b) => b.BudgetLineId === selectedLineId
                                    );

                                    setFormData((prev) => {
                                      const updatedLines = [...prev.Lines];
                                      updatedLines[index] = {
                                        ...updatedLines[index],
                                        BudgetLineId: selectedLineId,
                                        BudgetDescription: selectedLine?.Description || "",
                                      };
                                      return { ...prev, Lines: updatedLines };
                                    });
                                  }}
                                  disabled={!line._budgetLines || line._budgetLines.length === 0}
                                >
                                  <option value="">-- Select Budget Line --</option>
                                  {line._budgetLines?.map((b) => (
                                    <option key={b.BudgetLineId} value={b.BudgetLineId}>
                                      {b.AccountCode} - {b.Description}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>



                            <div>
                              <Label>Notes</Label>
                              <Input
                                className="bg-white border-2 border-gray-300"
                                value={line.Notes}
                                onChange={(e) =>
                                  handleLineChange(index, "Notes", e.target.value)
                                }
                              />
                            </div>

                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="text-white"
                              onClick={() => removeLine(index)}
                            >
                              Remove Line
                            </Button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}


                  <Button
                    type="button"
                    className="mt-3 bg-indigo-600 hover:bg-indigo-700"
                    onClick={addLine}
                  >
                    Add Line
                  </Button>
                </div>


                <div className="p-3 border-t mt-3">
                  <Button
                    type="button"
                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                    onClick={() => setLineDrawerOpen(false)}
                  >
                    Done
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
