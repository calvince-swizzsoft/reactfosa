import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FaPiggyBank } from "react-icons/fa";
import Swal from "sweetalert2";
import { apiFetch, normalizeList } from "@/lib/api";
import { createFixedDepositType } from "./api";
import PickerList from "../lib/PickerList";
import GraduatedScalesEditor from "./GraduatedScalesEditor";

// Areas/Accounts/Controllers/FixedDepositTypeController.cs. Attached loan
// products and levies are optional at create (sent as bare Guid[], the
// controller resolves each to the real DTO server-side) — same pattern as
// UnpayReasons' create form.
const FIN_BASE = `${import.meta.env.VITE_APP_FIN_URL}`;

const emptyForm = { Description: "", Months: "", IsLocked: false, EnforceFixedDepositBands: false };

function FieldGroup({ label, children }) {
  return (
    <div>
      <Label className="text-sm font-semibold text-gray-700">{label}</Label>
      {children}
    </div>
  );
}

export default function CreateFixedDepositType() {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [loadingPickers, setLoadingPickers] = useState(true);
  const [loanProducts, setLoanProducts] = useState([]);
  const [levies, setLevies] = useState([]);
  const [selectedLoanProductIds, setSelectedLoanProductIds] = useState(new Set());
  const [selectedLevyIds, setSelectedLevyIds] = useState(new Set());
  const [graduatedScales, setGraduatedScales] = useState([]);

  useEffect(() => {
    setLoadingPickers(true);
    Promise.all([
      apiFetch(`${FIN_BASE}/api/accounts/loanproducts`).then((r) => r.json()),
      apiFetch(`${FIN_BASE}/api/accounts/levies`).then((r) => r.json()),
    ]).then(([loanProductData, levyData]) => {
      setLoanProducts(normalizeList(loanProductData));
      setLevies(normalizeList(levyData));
    }).catch(() => { }).finally(() => setLoadingPickers(false));
  }, []);

  const toggleLoanProduct = (id) => setSelectedLoanProductIds((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const toggleLevy = (id) => setSelectedLevyIds((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.Description.trim() || !(Number(form.Months) > 0)) {
      Swal.fire("Missing Fields", "Description and a positive term (months) are required.", "warning");
      return;
    }
    const cleanScales = graduatedScales
      .filter((s) => s.RangeLowerLimit !== "" && s.RangeUpperLimit !== "" && s.Percentage !== "")
      .map((s) => ({
        RangeLowerLimit: Number(s.RangeLowerLimit),
        RangeUpperLimit: Number(s.RangeUpperLimit),
        Percentage: Number(s.Percentage),
      }));

    setLoading(true);
    try {
      const payload = {
        FixedDepositType: {
          Description: form.Description,
          Months: Number(form.Months),
          IsLocked: form.IsLocked,
        },
        EnforceFixedDepositBands: form.EnforceFixedDepositBands,
        AttachedLoanProductIds: [...selectedLoanProductIds],
        LevyIds: [...selectedLevyIds],
        GraduatedScales: cleanScales,
      };

      const data = await createFixedDepositType(payload);
      Swal.fire("Success", data?.message || "Fixed deposit type created successfully", "success");
      navigate("/Accounts/FixedDepositTypes");
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
      <div className="flex items-center justify-between gap-3 mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
        <div className="flex items-center gap-3">
          <FaPiggyBank className="text-white text-xl" />
          <h2 className="text-xl font-bold text-white">Create Fixed Deposit Type</h2>
        </div>
        <Link to="/Accounts/FixedDepositTypes" className="text-sm text-white/80 hover:text-white">
          &larr; Back to Fixed Deposit Types
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FieldGroup label="Description">
            <Input
              value={form.Description}
              onChange={(e) => setForm((p) => ({ ...p, Description: e.target.value }))}
              required
              placeholder="e.g. 12-Month Term Deposit"
            />
          </FieldGroup>
          <FieldGroup label="Term (Months)">
            <Input
              type="number" min="1"
              value={form.Months}
              onChange={(e) => setForm((p) => ({ ...p, Months: e.target.value }))}
              required
              placeholder="e.g. 12"
            />
          </FieldGroup>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="fdt-locked"
              checked={form.IsLocked}
              onChange={(e) => setForm((p) => ({ ...p, IsLocked: e.target.checked }))}
              className="w-4 h-4 accent-indigo-600"
            />
            <Label htmlFor="fdt-locked">Is Locked?</Label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="fdt-enforce-bands"
              checked={form.EnforceFixedDepositBands}
              onChange={(e) => setForm((p) => ({ ...p, EnforceFixedDepositBands: e.target.checked }))}
              className="w-4 h-4 accent-indigo-600"
            />
            <Label htmlFor="fdt-enforce-bands">Enforce Graduated Scale Bands</Label>
          </div>
        </div>

        <FieldGroup label="Graduated Scales (Optional — interest rate by deposit amount range)">
          <GraduatedScalesEditor scales={graduatedScales} onChange={setGraduatedScales} />
        </FieldGroup>

        <FieldGroup label="Attached Loan Products (Optional)">
          <PickerList
            items={loanProducts}
            selectedIds={selectedLoanProductIds}
            onToggle={toggleLoanProduct}
            getLabel={(p) => p.Description}
            emptyText={loadingPickers ? "Loading loan products..." : "No loan products configured yet."}
          />
        </FieldGroup>

        <FieldGroup label="Applicable Levies (Optional)">
          <PickerList
            items={levies}
            selectedIds={selectedLevyIds}
            onToggle={toggleLevy}
            getLabel={(l) => l.Description}
            emptyText={loadingPickers ? "Loading levies..." : "No levies configured yet — create one under Accounts > Levies first."}
          />
        </FieldGroup>

        <Button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700">
          {loading ? "Creating..." : "Create Fixed Deposit Type"}
        </Button>
      </form>
    </div>
  );
}
