import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import Swal from "sweetalert2";

//const BASE = "https://rubani.ngrok.io";
const BASE = `${import.meta.env.VITE_APP_FIN_URL}`

const transactionTypeOptions = [
  { value: 1, label: "Treasury to Treasury" },
  { value: 2, label: "Treasury to Bank" },
  { value: 4, label: "Bank to Treasury" },
  { value: 8, label: "Treasury to Teller" },
];

const transactionCodeOptions = [
  { value: 7, label: "Bank to Treasury" },
  { value: 8, label: "Treasury to Bank" },
  { value: 9, label: "Treasury to Teller" },
  { value: 10, label: "Treasury to Treasury" },
];

const emptyForm = {
  BranchId: "",
  TellerId: "",
  TreasuryId: "",
  PostingPeriodId: "",
  ChartOfAccountId: "",
  PrimaryDescription: "",
  SecondaryDescription: "",
  Reference: "",
  TotalAmount: "",
  TransactionType: "",
  TotalValue: "",
  TransactionCode: "",
  Description: "",
};

function FieldGroup({ label, children }) {
  return (
    <div>
      <Label className="text-sm font-semibold text-gray-700">{label}</Label>
      {children}
    </div>
  );
}

function BranchSelect({ branches, value, onChange, disabled }) {
  return (
    <Select value={value} onValueChange={(v) => onChange("BranchId", v)} disabled={disabled}>
      <SelectTrigger><SelectValue placeholder={disabled ? "Loading..." : "Select Branch"} /></SelectTrigger>
      <SelectContent>
        {branches.map((b) => (
          <SelectItem key={b.Id} value={b.Id}>{b.Description}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function TellerSelect({ tellers, value, onChange, disabled }) {
  return (
    <Select value={value} onValueChange={(v) => onChange("TellerId", v)} disabled={disabled}>
      <SelectTrigger><SelectValue placeholder={disabled ? "Loading..." : "Select Teller"} /></SelectTrigger>
      <SelectContent>
        {tellers.map((t) => (
          <SelectItem key={t.Id} value={t.Id}>{t.Description || t.Name || t.Id}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function TreasurySelect({ treasuries, value, onChange, disabled }) {
  return (
    <Select value={value} onValueChange={(v) => onChange("TreasuryId", v)} disabled={disabled}>
      <SelectTrigger><SelectValue placeholder={disabled ? "Loading..." : "Select Treasury"} /></SelectTrigger>
      <SelectContent>
        {treasuries.map((t) => (
          <SelectItem key={t.Id} value={t.Id}>{t.Description}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function CoaSelect({ coaList, value, onChange, disabled }) {
  return (
    <Select value={value} onValueChange={(v) => onChange("ChartOfAccountId", v)} disabled={disabled}>
      <SelectTrigger><SelectValue placeholder={disabled ? "Loading..." : "Select Chart of Account"} /></SelectTrigger>
      <SelectContent>
        {coaList.map((c) => (
          <SelectItem key={c.Id} value={c.Id}>{c.AccountCode} — {c.AccountName}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default function CashManagement() {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [branches, setBranches] = useState([]);
  const [tellers, setTellers] = useState([]);
  const [treasuries, setTreasuries] = useState([]);
  const [coaList, setCoaList] = useState([]);

  const handleChange = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  useEffect(() => {
    setLoadingData(true);
    Promise.all([
      fetch(`${BASE}/api/branches`).then((r) => r.json()),
      fetch(`${BASE}/api/tellers`).then((r) => r.json()),
      fetch(`${BASE}/api/treasurys`).then((r) => r.json()),
      fetch(`${BASE}/api/values/GetChartOfAccount`).then((r) => r.json()),
    ]).then(([branchData, tellerData, treasuryData, coaData]) => {
      setBranches(Array.isArray(branchData.data) ? branchData.data : []);
      setTellers(Array.isArray(tellerData) ? tellerData : []);
      setTreasuries(Array.isArray(treasuryData) ? treasuryData : []);
      setCoaList(Array.isArray(coaData.Data) ? coaData.Data : []);
    }).catch(() => { }).finally(() => setLoadingData(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        TotalAmount: Number(form.TotalAmount),
        TotalValue: Number(form.TotalAmount),
        TransactionType: Number(form.TransactionType),
        TransactionCode: Number(form.TransactionCode),
      };
      const res = await fetch(`${BASE}/api/cashmanagement`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Failed to submit cash management transaction");
      Swal.fire({
        title: "Transaction Submitted",
        html: `<p>Reference: <strong>${data.Reference || form.Reference || "—"}</strong></p><p>Amount: <strong>${Number(form.TotalAmount).toLocaleString()}</strong></p>`,
        icon: "success",
      });
      setForm(emptyForm);
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-5">
        <FieldGroup label="Branch">
          <BranchSelect branches={branches} value={form.BranchId} onChange={handleChange} disabled={loadingData} />
        </FieldGroup>

        <FieldGroup label="Teller">
          <TellerSelect tellers={tellers} value={form.TellerId} onChange={handleChange} disabled={loadingData} />
        </FieldGroup>

        <FieldGroup label="Treasury">
          <TreasurySelect treasuries={treasuries} value={form.TreasuryId} onChange={handleChange} disabled={loadingData} />
        </FieldGroup>

        {/* <FieldGroup label="Chart of Account">
          <CoaSelect coaList={coaList} value={form.ChartOfAccountId} onChange={handleChange} disabled={loadingData} />
        </FieldGroup> */}

        <FieldGroup label="Transaction Type">
          <Select value={String(form.TransactionType)} onValueChange={(v) => handleChange("TransactionType", v)}>
            <SelectTrigger><SelectValue placeholder="Select Transaction Type" /></SelectTrigger>
            <SelectContent>
              {transactionTypeOptions.map((o) => (
                <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldGroup>

        {/* <FieldGroup label="Transaction Code">
          <Select value={String(form.TransactionCode)} onValueChange={(v) => handleChange("TransactionCode", v)}>
            <SelectTrigger><SelectValue placeholder="Select Transaction Code" /></SelectTrigger>
            <SelectContent>
              {transactionCodeOptions.map((o) => (
                <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldGroup> */}

        <FieldGroup label="Total Amount">
          <Input type="number" value={form.TotalAmount} onChange={(e) => handleChange("TotalAmount", e.target.value)} placeholder="10000" required />
        </FieldGroup>

        {/* <FieldGroup label="Total Value">
          <Input type="number" value={form.TotalValue} onChange={(e) => handleChange("TotalValue", e.target.value)} placeholder="10000" />
        </FieldGroup> */}
        {/* 
        <FieldGroup label="Posting Period ID">
          <Input value={form.PostingPeriodId} onChange={(e) => handleChange("PostingPeriodId", e.target.value)} placeholder="Enter posting period ID" />
        </FieldGroup> */}

        {/* <FieldGroup label="Reference">
          <Input value={form.Reference} onChange={(e) => handleChange("Reference", e.target.value)} placeholder="Enter reference" />
        </FieldGroup>

        <FieldGroup label="Primary Description">
          <Input value={form.PrimaryDescription} onChange={(e) => handleChange("PrimaryDescription", e.target.value)} placeholder="Primary description" />
        </FieldGroup>

        <FieldGroup label="Secondary Description">
          <Input value={form.SecondaryDescription} onChange={(e) => handleChange("SecondaryDescription", e.target.value)} placeholder="Secondary description" />
        </FieldGroup>

        <div className="col-span-2">
          <FieldGroup label="Description">
            <Input value={form.Description} onChange={(e) => handleChange("Description", e.target.value)} placeholder="Transaction description" />
          </FieldGroup>
        </div> */}

        <div className="col-span-2">
          <Button type="submit" disabled={loading || loadingData} className="w-full bg-indigo-600 hover:bg-indigo-700 py-3 text-base">
            {loading ? "Submitting..." : "Submit Cash Management Transaction"}
          </Button>
        </div>
      </form>
    </div>
  );
}
