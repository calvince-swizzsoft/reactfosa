import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Swal from "sweetalert2";
import Base_Url from "../../../../apis/BaseApi";

export default function EditBankDrawer({ open, onClose, onSuccess, bank }) {
  const [formData, setFormData] = useState({
    Code: "",
    Name: "",
    BankCode: "",
    PostalAddress: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (bank) {
      setFormData({
        Code: bank.Code,
        Name: bank.Name,
        BankCode: bank.BankCode,
        PostalAddress: bank.PostalAddress,
      });
    }
  }, [bank]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await Base_Url.put(
        `/employee-banks/${bank.Code}`, formData
      );
      if (res.data.success) {
        Swal.fire("Success", res.data.message, "success");
      } else {
        Swal.fire("Error", res.data.message, "error");
      }

      /// if (!res.ok) throw new Error("Failed to update bank");

      //Swal.fire("Success", "Bank updated successfully!", "success");

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to update bank.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && bank && (
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
              <h2 className="font-bold text-lg text-white">Edit Bank</h2>
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>

            <div className="p-3 flex-1">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Name</Label>
                  <Input
                    value={formData.Name}
                    onChange={(e) =>
                      setFormData({ ...formData, Name: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label>Bank Code</Label>
                  <Input
                    value={formData.BankCode}
                    onChange={(e) =>
                      setFormData({ ...formData, BankCode: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label>Postal Address</Label>
                  <Input
                    value={formData.PostalAddress}
                    onChange={(e) =>
                      setFormData({ ...formData, PostalAddress: e.target.value })
                    }
                    required
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? "Updating..." : "Update Bank"}
                </Button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
