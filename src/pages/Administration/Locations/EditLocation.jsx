import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Swal from "sweetalert2";
import { apiErrorMessage, apiJson, normalizeList } from "@/lib/api";

export default function EditLocation({ open, onClose, data, refresh }) {
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState([]);
  const [form, setForm] = useState({
    Id: "",
    Description: "",
    BranchId: "",
    IsLocked: false,
  });

  useEffect(() => {
    if (data) {
      setForm({
        Id: data.Id,
        Description: data.Description || "",
        BranchId: data.BranchId || "",
        IsLocked: data.IsLocked || false,
      });
    }
  }, [data]);

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const json = await apiJson(`${import.meta.env.VITE_APP_ADMIN_URL}/api/administration/branches`);
        // GET / now returns PageCollectionInfo<BranchDTO> (paged), not a
        // bare array.
        setBranches(normalizeList(json));
      } catch (err) {
        setBranches([]);
        Swal.fire("Error", apiErrorMessage(err, "Unable to load branches."), "error");
      }
    };
    fetchBranches();
  }, []);

  const update = (key, value) => {
    setForm({ ...form, [key]: value });
  };

  const handleUpdate = async () => {
    setLoading(true);
    try {
      await apiJson(`${import.meta.env.VITE_APP_ADMIN_URL}/api/administration/locations/${form.Id}`, {
        method: "PUT",
        body: JSON.stringify(form),
      });

      Swal.fire("Success!", "Location updated successfully", "success");
      refresh();
      onClose();
    } catch (err) {
      Swal.fire("Error", apiErrorMessage(err, "Unable to update the location."), "error");
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
            className="fixed top-3 right-3 w-[80vw] max-w-[950px] bg-white shadow-2xl z-50 flex flex-col rounded-2xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
          >
            <div className="bg-gray-200 m-2 rounded-xl">
              <div className="p-4 flex justify-between items-center bg-indigo-700 rounded-2xl m-2">
                <h2 className="font-bold text-xl text-white">Edit Location</h2>
                <Button variant="outline" size="sm" onClick={onClose}>
                  Close
                </Button>
              </div>

              <div className="p-5 overflow-y-auto h-[75vh] bg-gray-50 rounded-xl m-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Branch</Label>
                    <select
                      className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      value={form.BranchId}
                      onChange={(e) => update("BranchId", e.target.value)}
                    >
                      <option value="">Select Branch</option>
                      {branches.map((b) => (
                        <option key={b.Id} value={b.Id}>
                          {b.Description}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label>Name</Label>
                    <Input
                      value={form.Description}
                      onChange={(e) => update("Description", e.target.value)}
                    />
                  </div>

                  <div className="flex items-center gap-2 mt-4">
                    <input
                      type="checkbox"
                      checked={form.IsLocked}
                      onChange={(e) => update("IsLocked", e.target.checked)}
                    />
                    <Label>Is Locked?</Label>
                  </div>
                </div>

                <div className="flex justify-end mt-8">
                  <Button onClick={handleUpdate} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
                    {loading ? "Updating..." : "Update Location"}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
