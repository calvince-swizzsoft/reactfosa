import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Swal from "sweetalert2";
import { apiErrorMessage, apiJson } from "@/lib/api";

export default function EditInvUomDrawer({ open, onClose, onSuccess, uom }) {
  const [formData, setFormData] = useState({
    id: "",
    code: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (uom) {
      setFormData({
        id: uom.Id,
        code: uom.Code,
        description: uom.Description,
      });
    }
  }, [uom]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await apiJson(
        `${import.meta.env.VITE_APP_INV_URL}/api/unit-of-measure/${uom.Id}`,
        {
          method: "PUT",
          headers: {
            "ngrok-skip-browser-warning": "true",
          },
          body: JSON.stringify(formData),
        }
      );

      Swal.fire("Success", "Unit of Measure updated successfully!", "success");

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      Swal.fire("Error", apiErrorMessage(err, "Unable to update the unit of measure."), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && uom && (
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
              <h2 className="font-bold text-lg text-white">Edit UOM</h2>
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>

            <div className="p-3 flex-1">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Code</Label>
                  <Input
                    placeholder="Enter UOM Code"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Input
                    placeholder="Enter Description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    required
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? "Updating..." : "Update UOM"}
                </Button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
