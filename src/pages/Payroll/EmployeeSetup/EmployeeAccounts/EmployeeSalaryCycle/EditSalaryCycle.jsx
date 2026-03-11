import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import payrollsetupApiConfig from "../../../../../apis/payrollsetup/payrollsetupApiConfig";
import Swal from "sweetalert2";

export default function EditSalaryCycle({ open, onClose, onSuccess, cycle }) {
  const currentYear = new Date().getFullYear();

  const [year, setYear] = useState(currentYear);
  const [monthIndex, setMonthIndex] = useState(new Date().getMonth());
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const months = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December",
  ];

  //  Populate fields from selected cycle
  useEffect(() => {
    if (cycle) {
      const start = new Date(cycle.startDate);
      const end = new Date(cycle.endDate);

      const cycleYear = start.getFullYear();
      const cycleMonthIndex = start.getMonth();

      setYear(cycleYear);
      setMonthIndex(cycleMonthIndex);
      setName(`${months[cycleMonthIndex]} ${cycleYear} Payroll`);
      setStartDate(start.toISOString().split("T")[0]);
      setEndDate(end.toISOString().split("T")[0]);
    }
  }, [cycle]);

  // 🔹 Auto-update name if year/month change
  useEffect(() => {
    if (year && monthIndex >= 0) {
      setName(`${months[monthIndex]} ${year} Payroll`);
    }
  }, [year, monthIndex]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      id: cycle.id,
      name,
      startDate,
      endDate,
      isProcessed: cycle.isProcessed ?? false,
    };

    try {
      await payrollsetupApiConfig.put(`/salary-cycles/${payload.id}`, payload);
      Swal.fire("Success", "Salary Cycle updated successfully!", "success");
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to update Salary Cycle.", "error");
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
              <h2 className="font-bold text-lg text-white">Edit Salary Cycle</h2>
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>

            <div className="p-3 flex-1">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Year */}
                <div>
                  <Label>Year</Label>
                  <Input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    required
                  />
                </div>

                {/* Month */}
                <div>
                  <Label>Month</Label>
                  <select
                    className="w-full border rounded-lg p-2"
                    value={monthIndex}
                    onChange={(e) => setMonthIndex(Number(e.target.value))}
                    required
                  >
                    {months.map((m, i) => (
                      <option key={i} value={i}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Name */}
                <div>
                  <Label>Name</Label>
                  <Input type="text" value={name} disabled />
                </div>

                {/* Start Date */}
                <div>
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>

                {/* End Date */}
                <div>
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                >
                  Save Changes
                </Button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
