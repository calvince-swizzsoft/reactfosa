import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import payrollsetupApiConfig from "../../../../apis/payrollsetup/payrollsetupApiConfig";
import Swal from "sweetalert2";

export default function EditInsuranceCompany({
  open,
  onClose,
  onSuccess,
  company,
}) {
  const [formData, setFormData] = useState({
    name: "",
    address: "",
  });
  const [loading, setLoading] = useState(false);

  // Populate form with selected company data when modal opens
  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name || "",
        address: company.address || "",
      });
    }
  }, [company]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        Code: company.id, 
        Name: formData.name,
        Address: formData.address, 
      };

      const res = await payrollsetupApiConfig.put(`/employee-insurance-companies/${company.id}`, payload);
      if (res.status !== 200)
        throw new Error("Failed to update Insurance Company");

      Swal.fire(
        "Success",
        "Insurance company updated successfully!",
        "success"
      );

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error("Error updating insurance company:", err);
      Swal.fire("Error", "Failed to update Insurance Company.", "error");
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

          {/* Drawer */}
          <motion.div
            className="fixed top-5 right-5 w-[480px] bg-white shadow-xl z-50 flex flex-col rounded-2xl p-3"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="p-4 flex justify-between items-center bg-indigo-600 rounded-2xl m-2">
              <h2 className="font-bold text-lg text-white">
                Edit Insurance Company
              </h2>
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>

            <div className="p-3 flex-1">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Company Name</Label>
                  <Input
                    type="text"
                    placeholder="Enter Company Name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label>Address</Label>
                  <Input
                    type="text"
                    placeholder="Enter Address"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    required
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {loading ? "Updating..." : "Update Insurance Company"}
                </Button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
