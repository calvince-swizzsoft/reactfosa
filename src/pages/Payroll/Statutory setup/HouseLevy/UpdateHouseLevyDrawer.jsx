import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Swal from "sweetalert2";
import Base_Url from "../../../../apis/BaseApi";

export default function UpdateHouseLevyDrawer({ open, onClose, onSuccess, levy }) {
  const [formData, setFormData] = useState({
    rate: "",
    startDate: "",
    endDate: "",
    createdBy: "Payroll Manager",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (levy) {
      setFormData({
        rate: levy.rate,
        startDate: levy.startDate,
        endDate: levy.endDate,
        createdBy: "Payroll Manager",
      });
    }
  }, [levy]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        rate: parseFloat(formData.rate),
        startDate: formData.startDate,
        endDate: formData.endDate,
        createdBy: formData.createdBy,
      };

      const res = await Base_Url.put(`/housinglevyrates/update/${levy.id}`, payload);

      if (res.status !== 200)
        throw new Error("Failed to update housing levy rate");

      Swal.fire("Success!", "Housing levy rate updated successfully.", "success");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      Swal.fire("Error!", err.response?.data?.message || err.message, "error");
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
            className="fixed top-5 right-5 w-[480px] bg-white shadow-xl z-50 flex flex-col rounded-2xl p-3"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="p-4 flex justify-between items-center bg-green-600 rounded-2xl m-2">
              <h2 className="font-bold text-lg text-white">
                Update Housing Levy Rate
              </h2>
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>

            <div className="p-3 flex-1">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Rate (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    name="rate"
                    value={formData.rate}
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
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {loading ? "Updating..." : "Update Rate"}
                </Button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
