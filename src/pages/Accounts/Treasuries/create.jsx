import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { FaVault } from "react-icons/fa6";
import Swal from "sweetalert2";
import { apiFetch, normalizeList } from "@/lib/api";
import { listAllChartOfAccounts } from "@/pages/Accounts/ChartOfAccounts/api";

const BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
// Treasury master data moved to Areas/Accounts (docs/api/treasury-api-spec.md)
// — the old Areas/FrontOffice TreasurysController it used to hit was
// removed/merged into this one; api/frontoffice/treasurys no longer resolves.
const TREASURIES_BASE = `${BASE}/api/accounts/treasurys`;

const emptyForm = {
  Description: "",
  BranchId: "",
  ChartOfAccountId: "",
  RangeLowerLimit: "",
  RangeUpperLimit: "",
};

function FieldGroup({ label, children }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

export default function CreateTreasury() {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState([]);
  const [coaList, setCoaList] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    setLoadingData(true);
    Promise.all([
      apiFetch(`${BASE}/api/administration/branches`).then((r) => r.json()),
      listAllChartOfAccounts(),
    ]).then(([branchData, accounts]) => {
      // GET / now returns PageCollectionInfo<BranchDTO> (paged), not a
      // bare array.
      setBranches(normalizeList(branchData));
      setCoaList(accounts);
    }).catch(() => { }).finally(() => setLoadingData(false));
  }, []);

  const handleChange = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // BranchDescription isn't persisted (server populates it on read from
      // BranchId), but the one-treasury-per-branch 409 message interpolates
      // whatever BranchDescription the client sent, before any server-side
      // branch lookup — send it purely so that error reads correctly.
      const selectedBranch = branches.find((b) => b.Id === form.BranchId);
      const payload = {
        ...form,
        BranchDescription: selectedBranch?.Description || "",
        RangeLowerLimit: Number(form.RangeLowerLimit),
        RangeUpperLimit: Number(form.RangeUpperLimit),
      };
      const res = await apiFetch(`${TREASURIES_BASE}`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Failed to create treasury");
      Swal.fire("Success", "Treasury created successfully", "success");
      setForm(emptyForm);
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
      <div className="flex items-center justify-between gap-3 mb-6 bg-indigo-700 px-6 py-3 rounded-2xl">
        <div className="flex items-center gap-3">
          <FaVault className="text-white text-xl" />
          <h2 className="text-xl font-bold text-white">Create Treasury</h2>
        </div>
        <Link to="/Accounts/Treasuries" className="text-sm text-white/80 hover:text-white">
          &larr; Back to Treasuries
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
        <FieldGroup label="Description">
          <Input value={form.Description} onChange={(e) => handleChange("Description", e.target.value)} required placeholder="e.g. Main Treasury" />
        </FieldGroup>

        <FieldGroup label="Branch">
          <Select value={form.BranchId} onValueChange={(v) => handleChange("BranchId", v)} disabled={loadingData}>
            <SelectTrigger><SelectValue placeholder={loadingData ? "Loading..." : "Select Branch"} /></SelectTrigger>
            <SelectContent>
              {branches.map((b) => (
                <SelectItem key={b.Id} value={b.Id}>{b.Description}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldGroup>

        <FieldGroup label="Chart of Account">
          <Select value={form.ChartOfAccountId} onValueChange={(v) => handleChange("ChartOfAccountId", v)} disabled={loadingData}>
            <SelectTrigger><SelectValue placeholder={loadingData ? "Loading..." : "Select Chart of Account"} /></SelectTrigger>
            <SelectContent className="max-h-60 overflow-y-auto">
              {coaList.map((c) => (
                <SelectItem key={c.Id} value={c.Id}>
                  {c.AccountCode} — {c.AccountName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldGroup>

        <div className="grid grid-cols-2 gap-3">
          <FieldGroup label="Range Lower Limit">
            <Input type="number" value={form.RangeLowerLimit} onChange={(e) => handleChange("RangeLowerLimit", e.target.value)} placeholder="50000" />
          </FieldGroup>
          <FieldGroup label="Range Upper Limit">
            <Input type="number" value={form.RangeUpperLimit} onChange={(e) => handleChange("RangeUpperLimit", e.target.value)} placeholder="100000" />
          </FieldGroup>
        </div>

        <Button type="submit" disabled={loading || loadingData} className="bg-indigo-600 hover:bg-indigo-700">
          {loading ? "Saving..." : "Create Treasury"}
        </Button>
      </form>
    </div>
  );
}
