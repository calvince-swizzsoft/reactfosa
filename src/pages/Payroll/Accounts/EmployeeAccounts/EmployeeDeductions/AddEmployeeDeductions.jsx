import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import payrollsetupApiConfig from "../../../../../apis/payrollsetup/payrollsetupApiConfig";
import Swal from "sweetalert2";

export default function AddEmployeeDeductions({ open, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    employeeNumber: "",
    deductionCode: "",
    startDate: "",
    endDate: "",
    amount: "",
  });
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [deductionCodes, setDeductionCodes] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Build payload for API (numbers where needed)
      const payload = {
        employeeNumber: Number(formData.employeeNumber),
        deductionCode: Number(formData.deductionCode),
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
        amount: Number(formData.amount),
      };

      const res = await payrollsetupApiConfig.post("/employee-deductions", payload);

      if (![200, 201].includes(res.status)) {
        throw new Error("Failed to add Deduction");
      }

      Swal.fire("Success", "Deduction added successfully!", "success");

      // Reset form
      setFormData({
        employeeNumber: "",
        deductionCode: "",
        startDate: "",
        endDate: "",
        amount: "",
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error("Add deduction error:", err);
      Swal.fire("Error", "Failed to add Deduction.", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch("https://186c1c091b40.ngrok-free.app/api/employee-profiles", {
        headers: { "ngrok-skip-browser-warning": "true" },
      });
      const json = await res.json();
      setEmployees(json.data || []);
    } catch (error) {
      console.error("Failed to load employees", error);
    }
  };

  const fetchDeductionsCode = async () => {
    try {
      const res = await fetch("https://186c1c091b40.ngrok-free.app/api/account-details/allowable-deductions", {
        headers: { "ngrok-skip-browser-warning": "true" },
      });
      const json = await res.json();
      setDeductionCodes(json.data || []);
    } catch (error) {
      console.error("Failed to load earning codes", error);
    }
  };

  useEffect(() => {
    if (open) {
      fetchEmployees();
      fetchDeductionsCode();
    }
  }, [open]);


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

          {/* Drawer */}
          <motion.div
            className="fixed top-5 right-5 w-[480px] bg-white shadow-xl z-50 flex flex-col rounded-2xl p-3"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="p-4 flex justify-between items-center bg-indigo-600 rounded-2xl m-2">
              <h2 className="font-bold text-lg text-white">Add Employee Deduction</h2>
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>

            <div className="p-3 flex-1">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Employee</Label>
                  <select
                    className="w-full border rounded-md p-2"
                    value={formData.employeeNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, employeeNumber: e.target.value })
                    }
                    required
                  >
                    <option value="">-- Select Employee --</option>

                    {employees.map((emp) => (
                      <option key={emp.EmployeeNumber} value={emp.EmployeeNumber}>
                        {emp.Name}
                      </option>
                    ))}
                  </select>
                </div>


                <div>
                  <Label>Deduction Code</Label>
                  <select
                    className="w-full border rounded-md p-2"
                    value={formData.deductionCode}
                    onChange={(e) =>
                      setFormData({ ...formData, deductionCode: e.target.value })
                    }
                    required
                  >
                    <option value="">-- Select Deduction --</option>

                    {deductionCodes.map((item) => (
                      <option key={item.Code} value={item.Code}>
                        {item.Name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label>End Date (optional)</Label>
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    placeholder="Enter Amount"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: e.target.value })
                    }
                    required
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                >
                  {loading ? "Saving..." : "Save Deduction"}
                </Button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
