import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import Swal from "sweetalert2";
import { FaMobileAlt } from "react-icons/fa";
import { apiFetch, normalizeList } from "@/lib/api";
import { getAlternateChannelTypeCommissions, replaceAlternateChannelTypeCommissions } from "./api";
import {
  ALTERNATE_CHANNEL_TYPE_OPTIONS, ALTERNATE_CHANNEL_KNOWN_CHARGE_TYPE_OPTIONS, CHARGE_BENEFACTOR_OPTIONS,
  AlternateChannelType, AlternateChannelKnownChargeType, ChargeBenefactor,
} from "./lib/alternateChannelEnums";
import PickerList from "../lib/PickerList";

const FIN_BASE = `${import.meta.env.VITE_APP_FIN_URL}`;

function FieldGroup({ label, children }) {
  return (
    <div>
      <Label className="text-sm font-semibold text-gray-700">{label}</Label>
      {children}
    </div>
  );
}

// api/accounts/alternatechannels/types/{type}/commissions —
// docs/api/alternate-channel-api-spec.md §4. Fees are scoped by channel
// TYPE, not by individual link — every link of a given Type shares the
// same commission for a given knownChargeType. NavigationMenu code 23014
// ("Alternate Channels", under Charge Determination).
export default function AlternateChannelFees() {
  const [type, setType] = useState(AlternateChannelType.SaccoLink);
  const [knownChargeType, setKnownChargeType] = useState(AlternateChannelKnownChargeType.Linking);
  const [chargeBenefactor, setChargeBenefactor] = useState(ChargeBenefactor.Customer);

  const [allCommissions, setAllCommissions] = useState([]);
  const [loadingCommissions, setLoadingCommissions] = useState(true);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [loadingAttached, setLoadingAttached] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoadingCommissions(true);
    apiFetch(`${FIN_BASE}/api/accounts/commissions`)
      .then((r) => r.json())
      .then((d) => setAllCommissions(normalizeList(d)))
      .catch(() => setAllCommissions([]))
      .finally(() => setLoadingCommissions(false));
  }, []);

  const fetchAttached = () => {
    setLoadingAttached(true);
    getAlternateChannelTypeCommissions(type, knownChargeType)
      .then((list) => setSelectedIds(new Set((list || []).map((c) => c.Id))))
      .catch(() => setSelectedIds(new Set()))
      .finally(() => setLoadingAttached(false));
  };

  useEffect(() => { fetchAttached(); }, [type, knownChargeType]);

  const toggle = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const commissions = allCommissions.filter((c) => selectedIds.has(c.Id)).map((c) => ({ Id: c.Id }));
      await replaceAlternateChannelTypeCommissions(type, { knownChargeType, chargeBenefactor, commissions });
      Swal.fire("Success", "Fee configuration saved.", "success");
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
      <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FaMobileAlt /> Alternate Channel Fees
        </h2>
      </div>

      <div className="max-w-2xl space-y-4">
        <p className="text-xs text-gray-400">
          Fees are scoped by channel type, not by individual link — every link of a given type shares the same commission for a given fee category.
        </p>

        <div className="grid grid-cols-2 gap-4">
          <FieldGroup label="Channel Type">
            <select className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mt-1" value={type} onChange={(e) => setType(Number(e.target.value))}>
              {ALTERNATE_CHANNEL_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </FieldGroup>
          <FieldGroup label="Fee Category">
            <select className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mt-1" value={knownChargeType} onChange={(e) => setKnownChargeType(Number(e.target.value))}>
              {ALTERNATE_CHANNEL_KNOWN_CHARGE_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </FieldGroup>
        </div>

        <FieldGroup label="Charge Benefactor">
          <select className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mt-1" value={chargeBenefactor} onChange={(e) => setChargeBenefactor(Number(e.target.value))}>
            {CHARGE_BENEFACTOR_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <p className="text-xs text-gray-400 mt-1">Applies to the whole batch below, not per-commission.</p>
        </FieldGroup>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Attached Commissions</p>
          {loadingCommissions || loadingAttached ? (
            <p className="text-sm text-gray-400">Loading...</p>
          ) : (
            <PickerList
              items={allCommissions}
              selectedIds={selectedIds}
              onToggle={toggle}
              getLabel={(c) => c.Description}
              getSublabel={(c) => c.ChargeType === 1 ? `${c.LowerLimit}–${c.UpperLimit}%` : undefined}
              emptyText="No commissions configured yet."
            />
          )}
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full bg-indigo-600 hover:bg-indigo-700">
          {saving ? "Saving..." : "Save Fee Configuration"}
        </Button>
      </div>
    </div>
  );
}
