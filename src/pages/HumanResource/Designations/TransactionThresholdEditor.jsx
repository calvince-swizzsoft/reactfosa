import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FaPlus, FaTrash } from "react-icons/fa";
import Swal from "sweetalert2";
import { apiFetch } from "@/lib/api";
import FieldHelp from "@/pages/Accounts/SavingsProducts/FieldHelp";

const BASE = `${import.meta.env.VITE_APP_FIN_URL}`;

export default function TransactionThresholdEditor({ value = [], onChange, disabled = false }) {
  const [transactionCodes, setTransactionCodes] = useState([]);

  useEffect(() => {
    apiFetch(`${BASE}/api/registry/customer/transaction-codes`)
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok || body?.success === false) throw new Error(body?.message || `Unable to load transaction types (${response.status}).`);
        return body?.data ?? body;
      })
      .then((codes) => setTransactionCodes((Array.isArray(codes) ? codes : []).filter((code) => Number(code.Value) !== 0)))
      .catch((error) => {
        setTransactionCodes([]);
        Swal.fire("Unable to load transaction types", error.message, "error");
      });
  }, []);

  const update = (index, field, fieldValue) => {
    onChange(value.map((row, rowIndex) => rowIndex === index ? { ...row, [field]: fieldValue } : row));
  };

  const remove = (index) => onChange(value.filter((_, rowIndex) => rowIndex !== index));
  const add = () => onChange([...value, { Type: "", Threshold: "" }]);
  const selectedTypes = new Set(value.map((row) => Number(row.Type)).filter(Boolean));

  return (
    <div className="space-y-3 rounded-lg border border-gray-200 p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <Label className="text-sm font-semibold text-gray-700">Transaction thresholds</Label>
          <FieldHelp text="Sets the maximum amount employees with this designation may post for each transaction type. Transactions without a configured threshold are rejected." />
        </div>
        <Button type="button" size="sm" variant="outline" onClick={add} disabled={disabled} className="gap-1">
          <FaPlus /> Add threshold
        </Button>
      </div>

      {value.length === 0 ? (
        <p className="text-xs text-gray-500">No authority configured. Employees with this designation cannot post financial transactions.</p>
      ) : value.map((row, index) => (
        <div key={`${row.Id || "new"}-${index}`} className="grid grid-cols-[minmax(0,1fr)_10rem_2.5rem] items-end gap-2">
          <div>
            <div className="mb-1 flex items-center gap-1.5">
              <Label className="text-xs text-gray-600">Transaction type</Label>
              <FieldHelp text="The accounting operation to which this authority limit applies." />
            </div>
            <Select value={row.Type === "" ? "" : String(row.Type)} onValueChange={(next) => update(index, "Type", Number(next))} disabled={disabled}>
              <SelectTrigger><SelectValue placeholder="Select transaction" /></SelectTrigger>
              <SelectContent className="max-h-72 overflow-y-auto">
                {transactionCodes.map((code) => (
                  <SelectItem
                    key={code.Value}
                    value={String(code.Value)}
                    disabled={selectedTypes.has(Number(code.Value)) && Number(row.Type) !== Number(code.Value)}
                  >
                    {code.Description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <div className="mb-1 flex items-center gap-1.5">
              <Label className="text-xs text-gray-600">Maximum amount</Label>
              <FieldHelp text="The largest single transaction amount this designation may post. Use 0 to deny positive-value transactions of this type." />
            </div>
            <Input type="number" min="0" step="0.01" value={row.Threshold} onChange={(event) => update(index, "Threshold", event.target.value)} required disabled={disabled} />
          </div>
          <Button type="button" variant="outline" size="icon" onClick={() => remove(index)} disabled={disabled} aria-label="Remove threshold">
            <FaTrash className="text-red-600" />
          </Button>
        </div>
      ))}
    </div>
  );
}

export function normalizeThresholds(thresholds) {
  return Array.isArray(thresholds)
    ? thresholds.map((row) => ({ ...row, Type: Number(row.Type), Threshold: Number(row.Threshold) }))
    : [];
}

export function validateThresholds(thresholds) {
  const types = thresholds.map((row) => Number(row.Type));
  if (thresholds.some((row) => !Number(row.Type) || row.Threshold === "" || Number(row.Threshold) < 0)) {
    return "Every threshold requires a transaction type and a non-negative maximum amount.";
  }
  if (new Set(types).size !== types.length) return "Each transaction type can only be configured once.";
  return null;
}
