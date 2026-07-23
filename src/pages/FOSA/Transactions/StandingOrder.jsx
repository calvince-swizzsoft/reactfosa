import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import Swal from "sweetalert2";
import NotFoundImage from "/assets/scopefinding.png";
import { FaEllipsisV, FaTimes } from "react-icons/fa";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
const LOANING_URL = `${import.meta.env.VITE_APP_LOANING_URL}`;
const MEMBERSHIP_URL = `${import.meta.env.VITE_APP_MEMBERSHIP_URL}`;

const EXECUTION_FILTER_OPTIONS = [
  { value: "1", label: "Pending" },
  { value: "2", label: "Active" },
  { value: "3", label: "Completed" },
];

const TRIGGER_OPTIONS = [
  { value: 0, label: "Automatic" },
  { value: 1, label: "Manual" },
];

const FREQUENCY_OPTIONS = [
  { value: 1, label: "Annual" },
  { value: 4, label: "Quarterly" },
  { value: 12, label: "Monthly" },
  { value: 26, label: "Bi-Weekly" },
  { value: 52, label: "Weekly" },
  { value: 365, label: "Daily" },
];

const emptyForm = {
  BranchId: "",
  PostingPeriodId: "",
  Month: new Date().getMonth() + 1,
  Priority: 1,
  StandingOrderExecutionFilter: "2",
  StandingOrderTrigger: 0,
  ScheduleFrequency: 12,
};

function FieldGroup({ label, children }) {
  return (
    <div>
      <Label className="text-sm font-semibold text-gray-700">{label}</Label>
      {children}
    </div>
  );
}

function MultiSelectPicker({ label, options, selected, onAdd, onRemove, pickId, onPickChange, disabled, optionLabel }) {
  return (
    <div>
      <Label className="text-sm font-semibold text-gray-700">{label}</Label>
      <div className="flex gap-2 mt-1">
        <Select value={pickId} onValueChange={onPickChange} disabled={disabled}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder={disabled ? "Loading..." : `Select ${label.toLowerCase()}`} />
          </SelectTrigger>
          <SelectContent>
            {options.map((o) => (
              <SelectItem key={o.Id} value={o.Id}>
                {optionLabel ? optionLabel(o) : o.Description}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          onClick={onAdd}
          className="bg-indigo-600 hover:bg-indigo-700 shrink-0"
          disabled={!pickId}
        >
          Add
        </Button>
      </div>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selected.map((s) => (
            <span
              key={s.Id}
              className="flex items-center gap-1 bg-indigo-100 text-indigo-700 text-xs font-medium px-3 py-1 rounded-full"
            >
              {s.Description}
              <button
                type="button"
                onClick={() => onRemove(s.Id)}
                className="ml-1 text-indigo-400 hover:text-indigo-700"
              >
                <FaTimes className="text-xs" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function AddStandingOrderDrawer({ open, onClose, onSuccess }) {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  const [branches, setBranches] = useState([]);
  const [postingPeriods, setPostingPeriods] = useState([]);
  const [postingPeriodDisplay, setPostingPeriodDisplay] = useState("");

  const [savingsProducts, setSavingsProducts] = useState([]);
  const [selectedSavings, setSelectedSavings] = useState([]);
  const [savingsPickId, setSavingsPickId] = useState("");

  const [loanProductsList, setLoanProductsList] = useState([]);
  const [selectedLoanProducts, setSelectedLoanProducts] = useState([]);
  const [loanProductsPickId, setLoanProductsPickId] = useState("");

  const [selectedLoanProducts1, setSelectedLoanProducts1] = useState([]);
  const [loanProducts1PickId, setLoanProducts1PickId] = useState("");

  const [investmentProductsList, setInvestmentProductsList] = useState([]);
  const [selectedInvestmentProducts, setSelectedInvestmentProducts] = useState([]);
  const [investmentPickId, setInvestmentPickId] = useState("");

  const [employersList, setEmployersList] = useState([]);
  const [selectedEmployers, setSelectedEmployers] = useState([]);
  const [employerPickId, setEmployerPickId] = useState("");

  useEffect(() => {
    if (!open) return;
    setLoadingData(true);
    Promise.all([
      fetch(`${BASE}api/branches`).then((r) => r.json()),
      fetch(`${BASE}api/loaning/GetPostingPeriods`).then((r) => r.json()),
      fetch(`${BASE}api/savingsproducts`).then((r) => r.json()),
      fetch(`${LOANING_URL}api/Loansetups/GetLoanProducts`).then((r) => r.json()),
      fetch(`${BASE}api/investmentsproducts`).then((r) => r.json()),
      fetch(`${MEMBERSHIP_URL}api/employers`).then((r) => r.json()),
    ])
      .then(([branchData, periodsData, savingsData, loanData, investData, employerData]) => {
        setBranches(Array.isArray(branchData.data) ? branchData.data : (Array.isArray(branchData.Data) ? branchData.Data : []));
        setPostingPeriods(Array.isArray(periodsData) ? periodsData : []);
        setSavingsProducts(Array.isArray(savingsData) ? savingsData : []);
        setLoanProductsList(loanData.Data || []);
        setInvestmentProductsList(Array.isArray(investData) ? investData : []);
        setEmployersList(employerData.success ? (employerData.data || []) : []);
      })
      .catch(() => { })
      .finally(() => setLoadingData(false));
  }, [open]);

  useEffect(() => {
    if (!open) {
      setForm(emptyForm);
      setPostingPeriodDisplay("");
      setSelectedSavings([]); setSavingsPickId("");
      setSelectedLoanProducts([]); setLoanProductsPickId("");
      setSelectedLoanProducts1([]); setLoanProducts1PickId("");
      setSelectedInvestmentProducts([]); setInvestmentPickId("");
      setSelectedEmployers([]); setEmployerPickId("");
    }
  }, [open]);

  const handleChange = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const makeAdder = (list, setSelected, setPickId) => (pickId) => {
    if (!pickId) return;
    const item = list.find((x) => x.Id === pickId);
    if (!item) return;
    setSelected((prev) => prev.find((s) => s.Id === item.Id) ? prev : [...prev, { Id: item.Id, Description: item.Description }]);
    setPickId("");
  };

  const makeRemover = (setSelected) => (id) => setSelected((prev) => prev.filter((s) => s.Id !== id));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedSavings.length === 0) {
      Swal.fire("Validation", "Please select at least one savings product.", "warning");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        recurringBatch: {
          BranchId: form.BranchId,
          PostingPeriodId: form.PostingPeriodId,
          Month: Number(form.Month),
          Priority: Number(form.Priority),
          StandingOrderExecutionFilter: form.StandingOrderExecutionFilter,
          StandingOrderTrigger: Number(form.StandingOrderTrigger),
          ScheduleFrequency: Number(form.ScheduleFrequency),
        },
        loanProducts: selectedLoanProducts,
        loanProducts1: selectedLoanProducts1,
        investmentProducts: selectedInvestmentProducts,
        employers: selectedEmployers,
        savings: selectedSavings,
      };

      console.log("Standing Order Payload:", payload);

      const res = await fetch(`${BASE}api/standingorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));

      console.log("Standing Order Response:", data);

      if (!res.ok) throw new Error(data?.message || "Failed to create standing order");
      data.success === false
        ? Swal.fire("Error", data.message || "Failed to create standing order", "error")
        : Swal.fire("Success", data.message || "Standing order created successfully", "success");
      onSuccess?.();
      onClose();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
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
            initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed top-5 right-3 w-[580px] bg-white shadow-xl z-50 flex flex-col rounded-2xl p-3 max-h-[95vh] overflow-y-auto"
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="p-4 flex justify-between items-center bg-indigo-600 rounded-2xl m-2">
              <h2 className="font-bold text-lg text-white">New Standing Order</h2>
              <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Branch */}
                <FieldGroup label="Branch">
                  <Select
                    value={form.BranchId}
                    onValueChange={(v) => handleChange("BranchId", v)}
                    disabled={loadingData}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={loadingData ? "Loading..." : "Select Branch"} />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((b) => (
                        <SelectItem key={b.Id} value={b.Id}>{b.Description}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldGroup>

                {/* Posting Period */}
                <FieldGroup label="Posting Period">
                  <Input
                    list="standing-posting-periods"
                    placeholder={loadingData ? "Loading..." : "Select posting period"}
                    value={postingPeriodDisplay}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPostingPeriodDisplay(val);
                      const match = postingPeriods.find(
                        (pp) => pp.Description?.toLowerCase() === val.toLowerCase()
                      );
                      if (match) handleChange("PostingPeriodId", match.Id);
                    }}
                    required
                  />
                  <datalist id="standing-posting-periods">
                    {postingPeriods.map((pp) => (
                      <option key={pp.Id} value={pp.Description} />
                    ))}
                  </datalist>
                </FieldGroup>

                {/* Month */}
                <FieldGroup label="Month">
                  <Input
                    type="number" min="1" max="12"
                    value={form.Month}
                    onChange={(e) => handleChange("Month", e.target.value)}
                    required
                  />
                </FieldGroup>

                {/* Priority */}
                <FieldGroup label="Priority">
                  <Input
                    type="number" min="1"
                    value={form.Priority}
                    onChange={(e) => handleChange("Priority", e.target.value)}
                    required
                  />
                </FieldGroup>

                {/* Execution Filter */}
                <FieldGroup label="Execution Filter">
                  <Select
                    value={form.StandingOrderExecutionFilter}
                    onValueChange={(v) => handleChange("StandingOrderExecutionFilter", v)}
                  >
                    <SelectTrigger><SelectValue placeholder="Select filter" /></SelectTrigger>
                    <SelectContent>
                      {EXECUTION_FILTER_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldGroup>

                {/* Trigger */}
                <FieldGroup label="Trigger">
                  <Select
                    value={String(form.StandingOrderTrigger)}
                    onValueChange={(v) => handleChange("StandingOrderTrigger", Number(v))}
                  >
                    <SelectTrigger><SelectValue placeholder="Select trigger" /></SelectTrigger>
                    <SelectContent>
                      {TRIGGER_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldGroup>

                {/* Schedule Frequency */}
                <FieldGroup label="Schedule Frequency">
                  <Select
                    value={String(form.ScheduleFrequency)}
                    onValueChange={(v) => handleChange("ScheduleFrequency", Number(v))}
                  >
                    <SelectTrigger><SelectValue placeholder="Select frequency" /></SelectTrigger>
                    <SelectContent>
                      {FREQUENCY_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldGroup>
              </div>

              <div className="border-t pt-4 space-y-4">
                {/* Savings Products */}
                <MultiSelectPicker
                  label="Savings Products"
                  options={savingsProducts}
                  selected={selectedSavings}
                  pickId={savingsPickId}
                  onPickChange={setSavingsPickId}
                  onAdd={() => makeAdder(savingsProducts, setSelectedSavings, setSavingsPickId)(savingsPickId)}
                  onRemove={makeRemover(setSelectedSavings)}
                  disabled={loadingData}
                />

                {/* Loan Products */}
                <MultiSelectPicker
                  label="Loan Products"
                  options={loanProductsList}
                  selected={selectedLoanProducts}
                  pickId={loanProductsPickId}
                  onPickChange={setLoanProductsPickId}
                  onAdd={() => makeAdder(loanProductsList, setSelectedLoanProducts, setLoanProductsPickId)(loanProductsPickId)}
                  onRemove={makeRemover(setSelectedLoanProducts)}
                  disabled={loadingData}
                  optionLabel={(o) => `${o.PaddedCode ? o.PaddedCode + " — " : ""}${o.Description}`}
                />

                {/* Loan Products 1 */}
                <MultiSelectPicker
                  label="Loan Products 1"
                  options={loanProductsList}
                  selected={selectedLoanProducts1}
                  pickId={loanProducts1PickId}
                  onPickChange={setLoanProducts1PickId}
                  onAdd={() => makeAdder(loanProductsList, setSelectedLoanProducts1, setLoanProducts1PickId)(loanProducts1PickId)}
                  onRemove={makeRemover(setSelectedLoanProducts1)}
                  disabled={loadingData}
                  optionLabel={(o) => `${o.PaddedCode ? o.PaddedCode + " — " : ""}${o.Description}`}
                />

                {/* Investment Products */}
                <MultiSelectPicker
                  label="Investment Products"
                  options={investmentProductsList}
                  selected={selectedInvestmentProducts}
                  pickId={investmentPickId}
                  onPickChange={setInvestmentPickId}
                  onAdd={() => makeAdder(investmentProductsList, setSelectedInvestmentProducts, setInvestmentPickId)(investmentPickId)}
                  onRemove={makeRemover(setSelectedInvestmentProducts)}
                  disabled={loadingData}
                />

                {/* Employers */}
                <MultiSelectPicker
                  label="Employers"
                  options={employersList}
                  selected={selectedEmployers}
                  pickId={employerPickId}
                  onPickChange={setEmployerPickId}
                  onAdd={() => makeAdder(employersList, setSelectedEmployers, setEmployerPickId)(employerPickId)}
                  onRemove={makeRemover(setSelectedEmployers)}
                  disabled={loadingData}
                  optionLabel={(o) => `${o.Code ? o.Code + " — " : ""}${o.Description}`}
                />
              </div>

              <Button
                type="submit"
                disabled={loading || loadingData}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
              >
                {loading ? "Saving..." : "Create Standing Order"}
              </Button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default function StandingOrder() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);

  const fetchItems = () => {
    setLoading(true);
    fetch(`${BASE}api/standingorder`)
      .then((r) => r.json())
      .then((d) => setItems(Array.isArray(d) ? d : (Array.isArray(d?.data) ? d.data : [])))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchItems(); }, []);

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Delete Standing Order?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      confirmButtonText: "Delete",
    });
    if (!result.isConfirmed) return;
    try {
      const res = await fetch(`${BASE}api/standingorder/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete standing order");
      Swal.fire("Deleted!", "Standing order removed.", "success");
      fetchItems();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  };

  return (
    <div>
      <div className="flex justify-end mb-3">
        <Button onClick={() => setAddOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
          + New Standing Order
        </Button>
      </div>

      <div className="grid grid-cols-12 gap-2 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-3">
        <span className="col-span-3">Branch</span>
        <span className="col-span-2">Posting Period</span>
        <span className="col-span-2">Frequency</span>
        <span className="col-span-2">Month</span>
        <span className="col-span-2">Status</span>
        <span className="col-span-1 text-right">Actions</span>
      </div>

      {loading ? (
        <div className="space-y-2 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-gray-100 rounded-lg" />
          ))}
        </div>
      ) : items.length > 0 ? (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.Id}
              className="grid grid-cols-12 gap-2 items-center bg-white px-4 py-3 rounded-lg shadow border"
            >
              <span className="col-span-3 font-medium text-indigo-700">
                {item.BranchDescription || item.BranchId || "—"}
              </span>
              <span className="col-span-2 text-sm text-gray-700">
                {item.PostingPeriodDescription || "—"}
              </span>
              <span className="col-span-2 text-sm text-gray-600">
                {item.ScheduleFrequencyDescription || item.ScheduleFrequency || "—"}
              </span>
              <span className="col-span-2 text-sm text-gray-500">
                {item.MonthDescription || item.Month || "—"}
              </span>
              <span className="col-span-2">
                <span
                  className={`px-2 py-1 rounded text-xs font-semibold ${item.StatusDescription === "Active" || item.Status === 2
                    ? "bg-green-100 text-green-700"
                    : item.StatusDescription === "Posted" || item.Status === 3
                      ? "bg-blue-100 text-blue-700"
                      : "bg-yellow-100 text-yellow-700"
                    }`}
                >
                  {item.StatusDescription || "Pending"}
                </span>
              </span>
              <div className="col-span-1 flex justify-end">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <FaEllipsisV className="text-gray-500" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(item.Id)}>
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center mt-4">
          <img src={NotFoundImage} alt="Not Found" className="mx-auto w-32 h-auto" />
          <p className="text-gray-400 mt-2">No standing orders found.</p>
        </div>
      )}

      <AddStandingOrderDrawer
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSuccess={fetchItems}
      />
    </div>
  );
}
