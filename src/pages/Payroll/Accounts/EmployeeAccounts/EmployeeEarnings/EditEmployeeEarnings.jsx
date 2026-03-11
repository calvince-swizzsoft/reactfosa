import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Swal from "sweetalert2";
import payrollsetupApiConfig from "../../../../../apis/payrollsetup/payrollsetupApiConfig";

export default function EditEmployeeEarnings({ open, onClose, onSuccess, earning }) {
  const [formData, setFormData] = useState({
    id: "",
    employeeNumber: "",
    earningCode: "",
    startDate: "",
    endDate: "",
    amount: "",
  });
  const [loading, setLoading] = useState(false);

  // Pre-fill with current values (handle PascalCase or camelCase from backend)
  useEffect(() => {
    if (!earning) return;

    console.debug("Edit modal received earning:", earning); // helpful to debug

    setFormData({
      id: earning.Id ?? earning.id ?? "",
      employeeNumber: (earning.EmployeeNumber ?? earning.employeeNumber ?? "") + "",
      earningCode: (earning.EarningCode ?? earning.earningCode ?? "") + "",
      // ensure yyyy-mm-dd format for <input type="date">
      startDate: (earning.StartDate ?? earning.startDate ?? "").slice(0, 10),
      endDate: (earning.EndDate ?? earning.endDate ?? "") ? (earning.EndDate ?? earning.endDate).slice(0, 10) : "",
      amount: (earning.Amount ?? earning.amount ?? "") + "",
    });
  }, [earning]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Build payload matching API spec (lowercase keys as your example PUT showed)
      const payload = {
        id: Number(formData.id),
        employeeNumber: Number(formData.employeeNumber),
        earningCode: Number(formData.earningCode),
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
        amount: Number(formData.amount),
      };

      console.debug("EDIT PAYLOAD", payload);

      const res = await payrollsetupApiConfig.put(`/employee-earnings/${payload.id}`, payload);

      // Accept 200 or 204 just in case
      if (![200, 201, 204].includes(res.status)) {
        throw new Error(`Unexpected status ${res.status}`);
      }

      Swal.fire("Success", "Earning updated successfully!", "success");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error("Update earning error:", err?.response ?? err);
      Swal.fire("Error", "Failed to update earning.", "error");
    } finally {
      setLoading(false);
    }
  };

  // If modal opened but earning hasn't arrived yet, show nothing (or a small message)
  // You can keep this; or remove to render empty controls until earning arrives.
  if (open && !earning) {
    return (
      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg shadow">Loading record...</div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

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
              <h2 className="font-bold text-lg text-white">Update Employee Earning</h2>
              <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
            </div>

            <div className="p-3 flex-1">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Employee Number</Label>
                  <Input
                    type="number"
                    value={formData.employeeNumber}
                    onChange={(e) => setFormData({ ...formData, employeeNumber: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label>Earning Code</Label>
                  <Input
                    type="number"
                    value={formData.earningCode}
                    onChange={(e) => setFormData({ ...formData, earningCode: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label>End Date (optional)</Label>
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                  />
                </div>

                <Button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700">
                  {loading ? "Updating..." : "Update Earning"}
                </Button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
