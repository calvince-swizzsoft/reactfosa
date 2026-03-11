import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import Swal from "sweetalert2";
import Base_Url from "../../../../apis/BaseApi";

export default function AddNssfContributionDrawer({ open, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    tier: "Tier I",
    lowerLimit: "",
    upperLimit: "",
    rate: "",
    effectiveFrom: "",
    effectiveTo: "",
    createdBy: "SystemAdmin", // you can pass logged-in user if needed
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await Base_Url.post("/nssfrates/create", formData);

      if (res.status !== 200 && res.status !== 201) {
        throw new Error("Failed to add contribution");
      }

      Swal.fire("Success", "NSSF Contribution added!", "success");
      setFormData({
        tier: "Tier I",
        lowerLimit: "",
        upperLimit: "",
        rate: "",
        effectiveFrom: "",
        effectiveTo: "",
        createdBy: "SystemAdmin",
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to add contribution.", "error");
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
            <div className="p-4 flex justify-between items-center bg-indigo-600 rounded-2xl m-2">
              <h2 className="font-bold text-lg text-white">Add NSSF Contribution</h2>
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>

            <div className="p-3 flex-1">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Tier dropdown */}
                <div>
                  <Label>Tier</Label>
                  <Select
                    value={formData.tier}
                    onValueChange={(val) => handleChange("tier", val)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Tier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Tier I">Tier I</SelectItem>
                      <SelectItem value="Tier II">Tier II</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Lower Limit */}
                <div>
                  <Label>Lower Limit</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.lowerLimit}
                    onChange={(e) => handleChange("lowerLimit", e.target.value)}
                    required
                  />
                </div>

                {/* Upper Limit */}
                <div>
                  <Label>Upper Limit</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.upperLimit}
                    onChange={(e) => handleChange("upperLimit", e.target.value)}
                    required
                  />
                </div>

                {/* Rate */}
                <div>
                  <Label>Rate (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.rate}
                    onChange={(e) => handleChange("rate", e.target.value)}
                    required
                  />
                </div>

                {/* Effective From */}
                <div>
                  <Label>Effective From</Label>
                  <Input
                    type="date"
                    value={formData.effectiveFrom}
                    onChange={(e) => handleChange("effectiveFrom", e.target.value)}
                    required
                  />
                </div>

                {/* Effective To */}
                <div>
                  <Label>Effective To (optional)</Label>
                  <Input
                    type="date"
                    value={formData.effectiveTo || ""}
                    onChange={(e) => handleChange("effectiveTo", e.target.value)}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                >
                  {loading ? "Saving..." : "Save Contribution"}
                </Button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
