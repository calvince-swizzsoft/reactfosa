import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import payrollsetupApiConfig from "../../../../../apis/payrollsetup/payrollsetupApiConfig";
import Swal from "sweetalert2";

export default function EditAccountDrawer({ open, onClose, onSuccess, account }) {
  const [formData, setFormData] = useState({
    Code: "",
    Name: "",
    LinkedGLAccount: "",
    TaxableEarnings: false,
    AllowableDeductions: false,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (account) {
      setFormData({
        Code: account.Code || account.id || "",
        Name: account.Name || "",
        LinkedGLAccount: account.LinkedGLAccount || "",
        TaxableEarnings: account.TaxableEarnings || false,
        AllowableDeductions: account.AllowableDeductions || false,
      });
    }
  }, [account]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await payrollsetupApiConfig.put(`/account-details/${formData.Code}`, formData);
      if (res.status !== 200 && res.status !== 201)
        throw new Error("Failed to update Account");

      Swal.fire("Success", "Account updated successfully!", "success");

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to update the Account.", "error");
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
              <h2 className="font-bold text-lg text-white">Edit Account</h2>
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>

            <div className="p-3 flex-1">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name */}
                <div>
                  <Label>Account Name</Label>
                  <Input
                    placeholder="Enter Account Name"
                    value={formData.Name}
                    onChange={(e) =>
                      setFormData({ ...formData, Name: e.target.value })
                    }
                    required
                  />
                </div>

                {/* Linked GL */}
                <div>
                  <Label>Linked GL Account</Label>
                  <Input
                    placeholder="Enter Linked GL Account"
                    value={formData.LinkedGLAccount}
                    onChange={(e) =>
                      setFormData({ ...formData, LinkedGLAccount: e.target.value })
                    }
                    required
                  />
                </div>

                {/* Taxable Earnings */}
                <div className="flex py-3 items-center space-x-2">
                  <Label>Taxable Earnings</Label>
                  <Checkbox
                    checked={formData.TaxableEarnings}
                    className="ml-8"
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, TaxableEarnings: !!checked })
                    }
                  />
                </div>

                {/* Allowable Deductions */}
                <div className="flex pb-3 items-center space-x-2">
                  <Label>Allowable Deductions</Label>
                  <Checkbox
                    checked={formData.AllowableDeductions}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, AllowableDeductions: !!checked })
                    }
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                >
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
