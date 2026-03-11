import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Swal from "sweetalert2";
import Base_Url from "../../../../../apis/BaseApi";

export default function EditPayeTaxBandDrawer({
  open,
  onClose,
  onSuccess,
  taxBand,
}) {
  const [formData, setFormData] = useState({
    Id: "",
    LowerLimit: "",
    UpperLimit: "",
    Rate: "",
    StartDate: "",
    EndDate: "",
  });
  const [loading, setLoading] = useState(false);

  // Populate form when editing
  useEffect(() => {
    if (taxBand) {
      setFormData({
        Id: taxBand.Id,
        LowerLimit: taxBand.LowerLimit,
        UpperLimit: taxBand.UpperLimit ?? "",
        Rate: taxBand.Rate,
        StartDate: taxBand.StartDate ?? "",
        EndDate: taxBand.EndDate ?? "",
      });
    }
  }, [taxBand]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await Base_Url.put(
        `/payetaxbands/update/${formData.Id}`,
        {
          LowerLimit: Number(formData.LowerLimit),
          UpperLimit: formData.UpperLimit === "" ? null : Number(formData.UpperLimit),
          Rate: Number(formData.Rate),
          StartDate: formData.StartDate,
          EndDate: formData.EndDate === "" ? null : formData.EndDate,
        }
      );

      if (res.status !== 200) throw new Error("Failed to update tax band");

      Swal.fire("Success!", "Tax band updated successfully.", "success");
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
              <h2 className="font-bold text-lg text-white">Edit PAYE Tax Band</h2>
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>

            {/* Form */}
            <div className="p-3 flex-1">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Lower Limit</Label>
                  <Input
                    type="number"
                    name="LowerLimit"
                    value={formData.LowerLimit}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <Label>Upper Limit</Label>
                  <Input
                    type="number"
                    name="UpperLimit"
                    value={formData.UpperLimit}
                    onChange={handleChange}
                    placeholder="Leave blank for no limit"
                  />
                </div>

                <div>
                  <Label>Rate (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    name="Rate"
                    value={formData.Rate}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    name="StartDate"
                    value={formData.StartDate}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    name="EndDate"
                    value={formData.EndDate}
                    onChange={handleChange}
                    placeholder="Leave blank if no end date"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                >
                  {loading ? "Updating..." : "Update Tax Band"}
                </Button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
