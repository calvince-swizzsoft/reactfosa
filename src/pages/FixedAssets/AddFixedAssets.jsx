import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import Swal from "sweetalert2";
import fixedassetsApi from "../../apis/fixedAssets/fixedassetsConfig";
import getemployeesapi from "../../apis/fixedAssets/getEmployee";

export default function AddFixedAssets({ open, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    no: "",
    serialNo: "",
    assetName: "",
    responsibleEmployee: "",
    faClassId: "",
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
    createdBy: "Admin",
  });

  const [faClasses, setFaClasses] = useState([]);
  const [faSubClasses, setFaSubClasses] = useState([]);
  const [locations, setLocations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const [cls, subCls, locs, emp] = await Promise.all([
          fixedassetsApi.get("/faclass"),
          fixedassetsApi.get("/fasubclass"),
          fixedassetsApi.get("/falocation"),
          getemployeesapi.get("/requisitions/employees"),
        ]);
        setFaClasses(cls.data.data || []);
        setFaSubClasses(subCls.data.data || []);
        setLocations(locs.data.data || []);
        setEmployees(emp.data || []);
      } catch (err) {
        console.error("Error fetching dropdowns:", err);
        Swal.fire("Error", "Failed to load dropdown options.", "error");
      }
    };

    if (open) fetchDropdowns();
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fixedassetsApi.post("/fixedasset", formData);
      console.log("Create Asset Response:", res);

      Swal.fire("Success", "Fixed Asset created successfully!", "success");

      setFormData({
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
        createdBy: "Admin",
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      Swal.fire(
        "Error",
        err.response?.data?.message || "Failed to create fixed asset.",
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
              <h2 className="font-bold text-lg text-white">Add Fixed Asset</h2>
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
                  <select
                    className="border w-full p-2 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={formData.responsibleEmployee}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        responsibleEmployee: e.target.value,
                      })
                    }
                  >
                    <option value="">Select Employee</option>
                    {employees.map((emp) => (
                      <option key={emp.Id} value={emp.Customer.FullName}>
                        {emp.Customer.FullName}
                      </option>
                    ))}
                  </select>
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
                  {loading ? "Saving..." : "Save Asset"}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
