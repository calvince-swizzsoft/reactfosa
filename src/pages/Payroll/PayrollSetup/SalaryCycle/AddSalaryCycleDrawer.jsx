import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Swal from "sweetalert2";
import payrollsetupApiConfig from "../../../../apis/payrollsetup/payrollsetupApiConfig";

export default function AddSalaryCycle({ open, onClose, onSuccess }) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  const [year, setYear] = useState(currentYear);
  const [monthIndex, setMonthIndex] = useState(currentMonth);
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const months = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December",
  ];

  // Auto-update name, startDate, endDate
  useEffect(() => {
    const start = new Date(year, monthIndex, 1);
    const end = new Date(year, monthIndex + 1, 0);

    setName(`${months[monthIndex]} ${year} Payroll`);
    setStartDate(start.toISOString().split("T")[0]);
    setEndDate(end.toISOString().split("T")[0]);
  }, [year, monthIndex]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      name,
      startDate,
      endDate,
      isProcessed: false,
    };

    try {
      await payrollsetupApiConfig.post("/salary-cycles", payload);
      Swal.fire("Success", "Salary Cycle added successfully!", "success");
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to add Salary Cycle.", "error");
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
              <h2 className="font-bold text-lg text-white">Add Salary Cycle</h2>
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
                    min={currentYear}
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
                  Save Salary Cycle
                </Button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
