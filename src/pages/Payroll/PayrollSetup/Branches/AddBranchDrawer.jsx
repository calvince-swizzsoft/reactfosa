import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Swal from "sweetalert2";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import Base_Url from "../../../../apis/BaseApi";

export default function AddBranchDrawer({ open, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    BranchName: "",
    BranchNumber: "",
    BankCode: "",
  });
  const [loading, setLoading] = useState(false);
  const [banks, setBanks] = useState([]);

  // Fetch banks for dropdown
  useEffect(() => {
    const fetchBanks = async () => {
      setLoading(true);
      try {
        const res = await Base_Url.get("/employee-banks");
        setBanks(res.data?.data || []);
      } catch (error) {
        console.error("Failed to fetch banks:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBanks();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await Base_Url.post("/employee-branches", formData);

      console.log(res.data);
      if (res.data.success) {
        Swal.fire("Success", res.data.message, "success");
      } else {
        Swal.fire("Error", res.data.message, "error");
      }

      //Swal.fire("Success", "Branch added successfully!", "success");

      setFormData({ BranchName: "", BranchNumber: "", BankCode: "" });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to add branch.", "error");
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
              <h2 className="font-bold text-lg text-white">Add Branch</h2>
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>

            <div className="p-3 flex-1">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Branch Name</Label>
                  <Input
                    placeholder="Enter branch name"
                    value={formData.BranchName}
                    onChange={(e) =>
                      setFormData({ ...formData, BranchName: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label>Branch Number</Label>
                  <Input
                    placeholder="Enter branch number"
                    value={formData.BranchNumber}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        BranchNumber: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div>
                  <Label>Bank</Label>
                  <Select
                    value={formData.BankCode}
                    onValueChange={(val) =>
                      setFormData({ ...formData, BankCode: val })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Bank" />
                    </SelectTrigger>
                    <SelectContent>
                      {banks.map((bank) => (
                        <SelectItem key={bank.Code} value={bank.BankCode}>
                          {bank.Name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                >
                  {loading ? "Saving..." : "Save Branch"}
                </Button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
