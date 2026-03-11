import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { FaUser } from "react-icons/fa";
import Swal from "sweetalert2";
import payrollsetupApiConfig from "../../../../apis/payrollsetup/payrollsetupApiConfig";

export default function OnboardEmployeeDrawer({ open, onClose, onSuccess }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(0);

  const [formData, setFormData] = useState({
    name: "",
    designation: "",
    startDate: "",
    endDate: "",
    jobGroup: "",
    disabled: false,
    nssfNumber: "",
    shaNumber: "",
    krapin: "",
    accountNumber: "",
    bankCode: "",
    branchCode: "",
  });

  const [branches, setBranches] = useState([]);
  const [banks, setBanks] = useState([]);
  const [bankBranches, setBankBranches] = useState([]);
  const [loading, setLoading] = useState({
    branches: false,
    banks: false,
    bankBranches: false,
    submitting: false,
  });

  const [designations] = useState([
    "Accountant",
    "Clerk",
    "HR Officer",
    "IT Support",
    "Manager",
    "Cashier",
  ]);

  const [jobGroups] = useState(["A", "B", "C", "D", "E", "F"]);

  const validators = [
    () => {
      if (!formData.name) {
        Swal.fire("Validation", "Please provide Full Name", "error");
        return false;
      }
      return true;
    },
    () => true,
    () => {
      if (!formData.bankCode || !formData.branchCode) {
        Swal.fire("Validation", "Please select both Bank and Branch", "error");
        return false;
      }
      return true;
    },
    () => true,
  ];

  useEffect(() => {
    if (!open) return;
    setCurrentStep(0);
    setDirection(0);

    const fetchInitialData = async () => {
      setLoading((s) => ({ ...s, branches: true, banks: true }));
      try {
        const [branchesData, banksData] = await Promise.all([payrollsetupApiConfig.get("/employee-branches/"), payrollsetupApiConfig.get("/employee-banks/")]);
        console.log(branchesData);
        setBranches(Array.isArray(branchesData?.data.data) ? branchesData.data.data : []);
        setBanks(Array.isArray(banksData?.data.data) ? banksData.data.data : []);
      } catch (err) {
        console.error("fetch initial error", err);
        setBranches([]);
        setBanks([]);
      } finally {
        setLoading((s) => ({ ...s, branches: false, banks: false }));
      }
    };

    fetchInitialData();
  }, [open]);

  useEffect(() => {
    if (!formData.bankCode) {
      setBankBranches([]);
      return;
    }
    const fetchBranches = async () => {
      setLoading((s) => ({ ...s, bankBranches: true }));
      try {
        const resp = await payrollsetupApiConfig.get("/employee-branches/");
        const all = Array.isArray(resp?.data.data) ? resp.data.data : resp || [];
        const filtered = all.filter(
          (b) => String(b.BankCode).padStart(3, "0") === String(formData.bankCode).padStart(3, "0")
        );
        setBankBranches(filtered);
      } catch (err) {
        console.error(err);
        setBankBranches([]);
      } finally {
        setLoading((s) => ({ ...s, bankBranches: false }));
      }
    };
    fetchBranches();
  }, [formData.bankCode]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const numericFields = ["employeenumber"];
    let newValue = type === "checkbox" ? checked : value;
    if (numericFields.includes(name)) newValue = value ? Number(value) : "";

    if (name === "bankCode") {
      setFormData((f) => ({ ...f, [name]: newValue, branchCode: "" }));
    } else setFormData((f) => ({ ...f, [name]: newValue }));
  };

  const stepCount = 4;

  const handleNext = () => {
    if (!validators[currentStep]()) return;
    if (currentStep < stepCount - 1) {
      setDirection(1);
      setCurrentStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep((s) => s - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validators[currentStep]()) return;

    try {
      setLoading((s) => ({ ...s, submitting: true }));
      const payload = {
        Name: formData.name,
        branch: "Head Office",
        Designation: formData.designation,
        StartDate: formData.startDate,
        EndDate: formData.endDate || null,
        JobGroup: formData.jobGroup,
        Disabled: formData.disabled,
        NSSFNumber: formData.nssfNumber,
        SHANumber: formData.shaNumber,
        KRAPIN: formData.krapin,
        AccountNumber: formData.accountNumber,
        BankCode: formData.bankCode ? String(formData.bankCode).padStart(3, "0") : null,
        BranchCode: formData.branchCode ? Number(formData.branchCode) : null,
      };

      await payrollsetupApiConfig.post("/employee-profiles", payload);
      Swal.fire("Success", "Employee created successfully!", "success");

      setFormData({
        name: "",
        designation: "",
        startDate: "",
        endDate: "",
        jobGroup: "",
        disabled: false,
        nssfNumber: "",
        shaNumber: "",
        krapin: "",
        accountNumber: "",
        bankCode: "",
        branchCode: "",
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      const message = err.response?.data?.message || err.message || "Unknown error";
      Swal.fire("Error", `Failed to create employee: ${message}`, "error");
    } finally {
      setLoading((s) => ({ ...s, submitting: false }));
    }
  };

  const variants = {
    enter: (dir) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir) => ({ x: dir > 0 ? "-100%" : "100%", opacity: 0 }),
  };

  const stepTitles = [
    "Basic Information",
    "Employment Details",
    "Banking Information",
    "Employee Status",
  ];

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
            className="fixed top-5 right-5 w-[520px] bg-white shadow-xl z-50 flex flex-col rounded-2xl p-3 max-h-[95vh]"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {/* Header */}
            <div className="p-4 flex justify-between items-center bg-indigo-600 rounded-2xl m-2">
              <div className="flex items-center gap-2">
                <FaUser className="text-white text-lg" />
                <div>
                  <h2 className="font-bold text-lg text-white">Onboard Employee</h2>
                  <p className="text-white/80 text-xs">
                    Step {currentStep + 1} of {stepCount}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>

            {/* Content */}
            <div className="p-3 flex-1 overflow-y-auto">
              <div className="mb-3">
                <h3 className="text-base font-semibold text-gray-800 pb-2 border-b">
                  {stepTitles[currentStep]}
                </h3>
              </div>

              <div className="relative min-h-[400px]">
                <AnimatePresence custom={direction} initial={false} mode="wait">
                  <motion.div
                    key={currentStep}
                    custom={direction}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.35 }}
                    className="absolute inset-0"
                  >
                    {/* Step 0 - Basic Info */}
                    {currentStep === 0 && (
                      <div className="space-y-4">
                        <div>
                          <Label>Full Name *</Label>
                          <Input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Enter full name"
                            required
                          />
                        </div>
                        <div>
                          <Label>Designation</Label>
                          <Select
                            value={formData.designation}
                            onValueChange={(val) =>
                              setFormData({ ...formData, designation: val })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="-- Select Designation --" />
                            </SelectTrigger>
                            <SelectContent>
                              {designations.map((d) => (
                                <SelectItem key={d} value={d}>
                                  {d}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}

                    {/* Step 1 - Employment Details */}
                    {currentStep === 1 && (
                      <div className="space-y-4">
                        <div>
                          <Label>Job Group</Label>
                          <Select
                            value={formData.jobGroup}
                            onValueChange={(val) =>
                              setFormData({ ...formData, jobGroup: val })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="-- Select Job Group --" />
                            </SelectTrigger>
                            <SelectContent>
                              {jobGroups.map((g) => (
                                <SelectItem key={g} value={g}>
                                  {g}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Start Date</Label>
                          <Input
                            type="date"
                            name="startDate"
                            value={formData.startDate}
                            onChange={handleChange}
                          />
                        </div>

                        <div>
                          <Label>End Date (optional)</Label>
                          <Input
                            type="date"
                            name="endDate"
                            value={formData.endDate || ""}
                            onChange={handleChange}
                          />
                        </div>
                      </div>
                    )}

                    {/* Step 2 - Banking Information */}
                    {currentStep === 2 && (
                      <div className="space-y-4">
                        <div>
                          <Label>Account Number</Label>
                          <Input
                            type="text"
                            name="accountNumber"
                            value={formData.accountNumber}
                            onChange={handleChange}
                            placeholder="Enter account number"
                          />
                        </div>

                        <div>
                          <Label>Bank</Label>
                          <Select
                            value={formData.bankCode}
                            onValueChange={(val) =>
                              setFormData({ ...formData, bankCode: val, branchCode: "" })
                            }
                            disabled={loading.banks}
                          >
                            <SelectTrigger>
                              <SelectValue
                                placeholder={
                                  loading.banks ? "Loading banks..." : "-- Select Bank --"
                                }
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {banks.map((bank) => (
                                <SelectItem
                                  key={bank.Code || bank.BankCode}
                                  value={String(bank.BankCode || bank.Code).padStart(3, "0")}
                                >
                                  {bank.Name || bank.BankName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Bank Branch</Label>
                          <Select
                            value={formData.branchCode}
                            onValueChange={(val) =>
                              setFormData({ ...formData, branchCode: val })
                            }
                            disabled={loading.bankBranches || !formData.bankCode}
                          >
                            <SelectTrigger>
                              <SelectValue
                                placeholder={
                                  loading.bankBranches
                                    ? "Loading branches..."
                                    : !formData.bankCode
                                      ? "Select bank first"
                                      : "-- Select Branch --"
                                }
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {bankBranches.map((b) => (
                                <SelectItem key={b.Code} value={String(b.Code)}>
                                  {b.BranchName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}

                    {/* Step 3 - Employee Status */}
                    {currentStep === 3 && (
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2 p-3 border rounded-md">
                          <input
                            type="checkbox"
                            id="disabled"
                            name="disabled"
                            checked={formData.disabled}
                            onChange={handleChange}
                            className="w-4 h-4 rounded"
                          />
                          <Label htmlFor="disabled" className="cursor-pointer">
                            Employee Disabled
                          </Label>
                        </div>

                        <div>
                          <Label>NSSF Number</Label>
                          <Input
                            type="text"
                            name="nssfNumber"
                            value={formData.nssfNumber}
                            onChange={handleChange}
                            placeholder="Enter NSSF number"
                          />
                        </div>

                        <div>
                          <Label>SHA Number</Label>
                          <Input
                            type="text"
                            name="shaNumber"
                            value={formData.shaNumber}
                            onChange={handleChange}
                            placeholder="Enter SHA number"
                          />
                        </div>

                        <div>
                          <Label>KRAPIN</Label>
                          <Input
                            type="text"
                            name="krapin"
                            value={formData.krapin}
                            onChange={handleChange}
                            placeholder="Enter KRAPIN"
                          />
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-between items-center pt-4 mt-4 border-t">
                <div>
                  {currentStep > 0 && (
                    <Button
                      type="button"
                      onClick={handleBack}
                      variant="outline"
                      size="sm"
                    >
                      Back
                    </Button>
                  )}
                </div>

                <div className="flex gap-2">
                  {currentStep < stepCount - 1 && (
                    <Button
                      type="button"
                      onClick={handleNext}
                      className="bg-indigo-600 hover:bg-indigo-700"
                      size="sm"
                    >
                      Next
                    </Button>
                  )}
                  {currentStep === stepCount - 1 && (
                    <Button
                      type="button"
                      onClick={handleSubmit}
                      disabled={loading.submitting}
                      className="bg-green-600 hover:bg-green-700"
                      size="sm"
                    >
                      {loading.submitting ? "Submitting..." : "Submit"}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}