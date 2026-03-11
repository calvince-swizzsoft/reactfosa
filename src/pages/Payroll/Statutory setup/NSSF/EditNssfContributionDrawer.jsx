import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import Swal from "sweetalert2";
import Base_Url from "../../../../apis/BaseApi";

export default function EditNssfContributionDrawer({ open, onClose, onSuccess, contribution }) {
  const [formData, setFormData] = useState({
    id: "",
    tier: "Tier I",
    lowerLimit: "",
    upperLimit: "",
    rate: "",
    effectiveFrom: "",
    effectiveTo: "",
    createdBy: "PayrollManager", 
  });
  const [loading, setLoading] = useState(false);

  // Prefill from selected contribution
  useEffect(() => {
    if (contribution) {
      setFormData({
        id: contribution.Id,
        tier: contribution.Tier,
        lowerLimit: contribution.LowerLimit,
        upperLimit: contribution.UpperLimit,
        rate: contribution.Rate,
        effectiveFrom: contribution.EffectiveFrom?.split("T")[0] || "",
        effectiveTo: contribution.EffectiveTo ? contribution.EffectiveTo.split("T")[0] : "",
        createdBy: contribution.CreatedBy || "PayrollManager",
      });
    }
  }, [contribution]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await Base_Url.put(`/nssfrates/update/${formData.id}`, {
        tier: formData.tier,
        lowerLimit: parseFloat(formData.lowerLimit),
        upperLimit: parseFloat(formData.upperLimit),
        rate: parseFloat(formData.rate),
        effectiveFrom: formData.effectiveFrom,
        effectiveTo: formData.effectiveTo || null,
        createdBy: formData.createdBy,
      });

      if (res.status !== 200) throw new Error("Failed to update contribution");

      Swal.fire("Success", "NSSF Contribution updated!", "success");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to update contribution.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && contribution && (
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
            <div className="p-4 flex justify-between items-center bg-blue-600 rounded-2xl m-2">
              <h2 className="font-bold text-lg text-white">Edit NSSF Contribution</h2>
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
                  <Label>Effective To</Label>
                  <Input
                    type="date"
                    value={formData.effectiveTo || ""}
                    onChange={(e) => handleChange("effectiveTo", e.target.value)}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? "Updating..." : "Update Contribution"}
                </Button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
