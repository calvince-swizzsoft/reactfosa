import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import Swal from "sweetalert2";
import fixedassetsApi from "../../apis/fixedAssets/fixedassetsConfig";

export default function EditFixedAssets({ open, onClose, onSuccess, asset }) {
  const [formData, setFormData] = useState({
    no: "",
    serialNo: "",
    assetName: "",
    responsibleEmployee: "",
    faSubClassId: "",
    locationId: "",
    bookValue: "",
    isInactive: false,
    depreciationMethod: "Straight Line",
    depreciationStartDate: "",
    noOfDepreciationYears: "",
    depreciationEndingDate: "",
    reducingBalancePercentage: "",
    faGroup: "",
  });

  const [faSubClasses, setFaSubClasses] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const [subCls, locs] = await Promise.all([
          fixedassetsApi.get("/fasubclass"),
          fixedassetsApi.get("/falocation"),
        ]);
        setFaSubClasses(subCls.data.data || []);
        setLocations(locs.data.data || []);
      } catch (err) {
        console.error("Error fetching dropdowns:", err);
        Swal.fire("Error", "Failed to load dropdown options.", "error");
      }
    };

    if (open) fetchDropdowns();
  }, [open]);

  useEffect(() => {
    if (asset) {
      setFormData({
        no: asset.No || "",
        serialNo: asset.SerialNo || "",
        assetName: asset.AssetName || "",
        responsibleEmployee: asset.ResponsibleEmployee || "",
        faSubClassId: asset.FASubClassId || "",
        locationId: asset.LocationId || "",
        bookValue: asset.BookValue || "",
        isInactive: asset.IsInactive || false,
        depreciationMethod: asset.DepreciationMethod || "Straight Line",
        depreciationStartDate: asset.DepreciationStartDate ? asset.DepreciationStartDate.split('T')[0] : "",
        noOfDepreciationYears: asset.NoOfDepreciationYears || "",
        depreciationEndingDate: asset.DepreciationEndingDate ? asset.DepreciationEndingDate.split('T')[0] : "",
        reducingBalancePercentage: asset.ReducingBalancePercentage || "",
        faGroup: asset.FAGroup || "",
      });
    }
  }, [asset]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fixedassetsApi.put(`/fixedasset/${asset.Id}`, formData);
      if (res.status !== 200 && res.status !== 201)
        throw new Error("Failed to update Asset");

      Swal.fire("Success", "Fixed Asset updated successfully!", "success");

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      Swal.fire(
        "Error",
        err.response?.data?.message || "Failed to update the fixed asset.",
        "error"
      );
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
            className="fixed top-5 right-5 w-[550px] bg-white shadow-xl z-50 flex flex-col rounded-2xl p-3 overflow-y-auto max-h-[95vh]"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="p-4 flex justify-between items-center bg-indigo-600 rounded-2xl m-2">
              <h2 className="font-bold text-lg text-white">Edit Fixed Asset</h2>
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>

            <div className="p-3 flex-1">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>No</Label>
                    <Input
                      placeholder="FA1001"
                      value={formData.no}
                      onChange={(e) =>
                        setFormData({ ...formData, no: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label>Serial No</Label>
                    <Input
                      placeholder="SN123456"
                      value={formData.serialNo}
                      onChange={(e) =>
                        setFormData({ ...formData, serialNo: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label>Asset Name</Label>
                  <Input
                    placeholder="Dell Laptop"
                    value={formData.assetName}
                    onChange={(e) =>
                      setFormData({ ...formData, assetName: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label>Responsible Employee</Label>
                  <Input
                    placeholder="Mike Nduthi"
                    value={formData.responsibleEmployee}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        responsibleEmployee: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <Label>FA SubClass</Label>
                  <select
                    className="border w-full p-2 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={formData.faSubClassId}
                    onChange={(e) =>
                      setFormData({ ...formData, faSubClassId: e.target.value })
                    }
                    required
                  >
                    <option value="">Select SubClass</option>
                    {faSubClasses.map((sc) => (
                      <option key={sc.Id} value={sc.Id}>
                        {sc.Description}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label>Location</Label>
                  <select
                    className="border w-full p-2 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={formData.locationId}
                    onChange={(e) =>
                      setFormData({ ...formData, locationId: e.target.value })
                    }
                    required
                  >
                    <option value="">Select Location</option>
                    {locations.map((l) => (
                      <option key={l.Id} value={l.Id}>
                        {l.Description}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label>Book Value</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={formData.bookValue}
                    onChange={(e) =>
                      setFormData({ ...formData, bookValue: e.target.value })
                    }
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={formData.isInactive}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isInactive: checked })
                    }
                  />
                  <Label>Inactive</Label>
                </div>

                <div>
                  <Label>Depreciation Method</Label>
                  <Input
                    placeholder="Straight Line"
                    value={formData.depreciationMethod}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        depreciationMethod: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={formData.depreciationStartDate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          depreciationStartDate: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={formData.depreciationEndingDate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          depreciationEndingDate: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div>
                  <Label>No. of Depreciation Years</Label>
                  <Input
                    type="number"
                    placeholder="5"
                    value={formData.noOfDepreciationYears}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        noOfDepreciationYears: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <Label>Reducing Balance %</Label>
                  <Input
                    type="number"
                    placeholder="20"
                    value={formData.reducingBalancePercentage}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        reducingBalancePercentage: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <Label>FA Group</Label>
                  <Input
                    placeholder="IT Equipment"
                    value={formData.faGroup}
                    onChange={(e) =>
                      setFormData({ ...formData, faGroup: e.target.value })
                    }
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                  onClick={handleSubmit}
                >
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}