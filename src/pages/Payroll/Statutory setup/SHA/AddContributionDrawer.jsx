import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Swal from "sweetalert2";
import Base_Url from "../../../../apis/BaseApi";

export default function AddContributionDrawer({ open, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    rate: "",
    effectiveFrom: "",
    effectiveTo:"",
    createdBy:"AdminUser"
  });
  const [loading, setLoading] = useState(false);


  console.log(formData);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await Base_Url.post("/sha-rates/create",formData);
      console.log("Response: ",res)
      if (res.status !== 200) throw new Error("Failed to add contribution");

      Swal.fire("Success", "Contribution added successfully!", "success");
      setFormData({ ContributionRate: "", Contributionamount: "" });

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
              <h2 className="font-bold text-lg text-white">Add Contribution</h2>
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>

            <div className="p-3 flex-1">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Contribution Rate (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Enter rate"
                    value={formData.ContributionRate}
                    onChange={(e) =>
                      setFormData({ ...formData, rate: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label>Effective From</Label>
                  <Input
                    type="Date"
                    placeholder="Enter Start Date: "
                    value={formData.Contributionamount}
                    onChange={(e) =>
                      setFormData({ ...formData, effectiveFrom: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label>Effective To: </Label>
                  <Input
                    type="Date"
                    placeholder="Enter End Date: "
                    value={formData.Contributionamount}
                    onChange={(e) =>
                      setFormData({ ...formData, effectiveTo: e.target.value })
                    }
                    required
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
