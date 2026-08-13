import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Swal from "sweetalert2";
import { FaMobileAlt, FaChevronDown } from "react-icons/fa";
import { linkAlternateChannel } from "./api";
import EntryPickerModal from "../BatchProcedures/lib/EntryPickerModal";
import {
  ALTERNATE_CHANNEL_TYPE_OPTIONS, BROKEN_CARD_NUMBER_TYPES, AlternateChannelType,
} from "./lib/alternateChannelEnums";

const FIN_BASE = `${import.meta.env.VITE_APP_FIN_URL}`;

function FieldGroup({ label, children }) {
  return (
    <div>
      <Label className="text-sm font-semibold text-gray-700">{label}</Label>
      {children}
    </div>
  );
}

function PickerField({ label, value, placeholder, onClick }) {
  return (
    <div>
      <Label className="text-sm font-semibold text-gray-700 mb-1 block">{label}</Label>
      <button
        type="button"
        onClick={onClick}
        className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md bg-white text-sm hover:border-indigo-400 transition-colors text-left"
      >
        <span className={value ? "text-gray-800 truncate" : "text-gray-400"}>{value || placeholder}</span>
        <FaChevronDown className="text-gray-400 text-xs flex-shrink-0 ml-2" />
      </button>
    </div>
  );
}

const emptyForm = {
  CustomerAccountId: "", CustomerLabel: "",
  Type: AlternateChannelType.SaccoLink,
  CardNumber: "", Remarks: "", DailyLimit: 0,
};

// api/accounts/alternatechannels — docs/api/alternate-channel-api-spec.md.
// NavigationMenu code 23053 ("Register").
export default function RegisterAlternateChannel() {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [picker, setPicker] = useState(false);

  const isBrokenType = BROKEN_CARD_NUMBER_TYPES.has(Number(form.Type));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.CustomerAccountId || !form.CardNumber) {
      Swal.fire("Missing Fields", "Customer account and primary account number are required.", "warning");
      return;
    }
    setLoading(true);
    try {
      await linkAlternateChannel({
        CustomerAccountId: form.CustomerAccountId,
        Type: Number(form.Type),
        CardNumber: form.CardNumber,
        Remarks: form.Remarks,
        DailyLimit: Number(form.DailyLimit) || 0,
      });
      Swal.fire("Success", "Alternate channel linked.", "success");
      navigate("/Accounts/AlternateChannels/Management");
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
      <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FaMobileAlt /> Register Alternate Channel
        </h2>
        <Button variant="outline" onClick={() => navigate("/Accounts/AlternateChannels/Management")}>Cancel</Button>
      </div>

      <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
        <PickerField label="Customer Account" value={form.CustomerLabel} placeholder="Search & select customer account..." onClick={() => setPicker(true)} />

        <FieldGroup label="Channel Type">
          <select
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mt-1"
            value={form.Type}
            onChange={(e) => setForm((p) => ({ ...p, Type: Number(e.target.value) }))}
          >
            {ALTERNATE_CHANNEL_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </FieldGroup>

        {isBrokenType && (
          <p className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            Agency Banking and Citius links can't be created today — the server always rejects the primary account
            number for these two types (a known, unfixed backend gap, not a form validation issue). Submitting will 400.
          </p>
        )}

        <FieldGroup label="Primary Account Number">
          <Input value={form.CardNumber} onChange={(e) => setForm((p) => ({ ...p, CardNumber: e.target.value }))} required disabled={isBrokenType} />
        </FieldGroup>

        <FieldGroup label="Daily Limit">
          <Input type="number" min="0" value={form.DailyLimit} onChange={(e) => setForm((p) => ({ ...p, DailyLimit: e.target.value }))} />
        </FieldGroup>

        <FieldGroup label="Remarks">
          <Input value={form.Remarks} onChange={(e) => setForm((p) => ({ ...p, Remarks: e.target.value }))} />
        </FieldGroup>

        <Button type="submit" disabled={loading || isBrokenType} className="w-full bg-indigo-600 hover:bg-indigo-700">
          {loading ? "Linking..." : "Link Channel"}
        </Button>
      </form>

      {picker && (
        <EntryPickerModal
          title="Select Customer Account"
          fetchUrl={`${FIN_BASE}/api/accounts/customer-accounts?pageSize=1000`}
          getLabel={(i) => i.CustomerFullName || i.FullAccountNumber}
          getSublabel={(i) => i.FullAccountNumber}
          onSelect={(i) => setForm((p) => ({ ...p, CustomerAccountId: i.Id, CustomerLabel: `${i.CustomerFullName || ""} — ${i.FullAccountNumber || ""}` }))}
          onClose={() => setPicker(false)}
        />
      )}
    </div>
  );
}
