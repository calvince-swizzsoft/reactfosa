import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Swal from "sweetalert2";
import Base_Url from "../../../../../apis/BaseApi";

export default function EditPayeReliefDrawer({
  open,
  onClose,
  onSuccess,
  relief,
}) {
  const [formData, setFormData] = useState({
    id: "",
    monthlyRelief: "",
    startDate: "",
    endDate: "",
    createdBy: "FinanceOfficer", // default value
  });
  const [loading, setLoading] = useState(false);

  // Populate form when editing
  useEffect(() => {
    if (relief) {
      setFormData({
        id: relief.Id,
        monthlyRelief: relief.MonthlyRelief,
        startDate: relief.StartDate ? relief.StartDate.split("T")[0] : "",
        endDate: relief.EndDate ? relief.EndDate.split("T")[0] : "",
        createdBy: relief.CreatedBy || "FinanceOfficer",
      });
    }
  }, [relief]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        monthlyRelief: Number(formData.monthlyRelief),
        startDate: formData.startDate,
        endDate: formData.endDate || null,
        createdBy: formData.createdBy,
      };

      const res = await Base_Url.put(
        `/payepersonalrelief/update/${formData.id}`,
        payload
      );

      if (res.status !== 200)
        throw new Error("Failed to update personal relief");

      Swal.fire("Success!", "Personal relief updated successfully.", "success");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      Swal.fire("Error!", err.message, "error");
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

          {/* Drawer Panel */}
          <motion.div
            className="fixed top-5 right-5 w-[480px] bg-white shadow-xl z-50 flex flex-col rounded-2xl p-3"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {/* Header */}
            <div className="p-4 flex justify-between items-center bg-indigo-600 rounded-2xl m-2">
              <h2 className="font-bold text-lg text-white">
                Edit Personal Relief
              </h2>
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>

            {/* Form */}
            <div className="p-3 flex-1">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Monthly Relief</Label>
                  <Input
                    type="number"
                    step="0.01"
                    name="monthlyRelief"
                    value={formData.monthlyRelief}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <Label>End Date (optional)</Label>
                  <Input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <Label>Created By</Label>
                  <Input
                    type="text"
                    name="createdBy"
                    value={formData.createdBy}
                    onChange={handleChange}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                >
                  {loading ? "Updating..." : "Update Relief"}
                </Button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
