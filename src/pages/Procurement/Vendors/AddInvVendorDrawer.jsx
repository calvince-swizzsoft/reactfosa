import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import Swal from "sweetalert2";

export default function AddInvVendorDrawer({ open, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    VendorCode: "",
    VendorName: "",
    TaxId: "",
    Address: "",
    Phone: "",
    Email: "",
    IsActive: true,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_APP_PRO_URL}/api/vendors`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to add vendor");

      Swal.fire("Success", "Vendor added successfully!", "success");

      // reset form
      setFormData({
        VendorCode: "",
        VendorName: "",
        TaxId: "",
        Address: "",
        Phone: "",
        Email: "",
        IsActive: true,
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to add vendor.", "error");
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
            className="fixed top-5 right-5 w-[480px] max-h-[95vh] bg-white shadow-xl z-50 flex flex-col rounded-2xl p-3 overflow-hidden"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {/* Header */}
            <div className="p-4 flex justify-between items-center bg-indigo-600 rounded-2xl m-2">
              <h2 className="font-bold text-lg text-white">Add Vendor</h2>
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>

            {/* Form */}
            <div className="p-3 flex-1 overflow-y-auto">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Vendor Code</Label>
                  <Input
                    placeholder="Enter vendor code"
                    value={formData.VendorCode}
                    onChange={(e) =>
                      setFormData({ ...formData, VendorCode: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label>Vendor Name</Label>
                  <Input
                    placeholder="Enter vendor name"
                    value={formData.VendorName}
                    onChange={(e) =>
                      setFormData({ ...formData, VendorName: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label>Tax ID</Label>
                  <Input
                    placeholder="Enter tax id"
                    value={formData.TaxId}
                    onChange={(e) =>
                      setFormData({ ...formData, TaxId: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Address</Label>
                  <Input
                    placeholder="Enter address"
                    value={formData.Address}
                    onChange={(e) =>
                      setFormData({ ...formData, Address: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    placeholder="Enter phone number"
                    value={formData.Phone}
                    onChange={(e) =>
                      setFormData({ ...formData, Phone: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    placeholder="Enter email"
                    value={formData.Email}
                    onChange={(e) =>
                      setFormData({ ...formData, Email: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Vendor balance</Label>
                  <Input
                    type="text"
                    placeholder="Vendor Balance"
                    value="00.00"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={formData.IsActive}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, IsActive: checked })
                    }
                  />
                  <Label>Active</Label>
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                >
                  {loading ? "Saving..." : "Save Vendor"}
                </Button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
