import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { apiErrorMessage, apiJson, normalizeList } from "@/lib/api";
import PickerList from "./PickerList";
import FieldHelp from "../SavingsProducts/FieldHelp";

const ENDPOINT = `${import.meta.env.VITE_APP_FIN_URL}/api/accounts/indefinite-charges/paged?pageIndex=0&pageSize=200`;

export default function DynamicChargePicker({ value = [], onChange, disabled = false }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const selectedIds = useMemo(() => new Set(value.map((item) => item.Id).filter(Boolean)), [value]);

  useEffect(() => {
    apiJson(ENDPOINT).then((response) => setItems(normalizeList(response).filter((item) => !item.IsLocked)))
      .catch((error) => Swal.fire("Load Error", apiErrorMessage(error, "Unable to load indefinite charges."), "error"))
      .finally(() => setLoading(false));
  }, []);

  const toggle = (id) => {
    if (disabled) return;
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    onChange(items.filter((item) => next.has(item.Id)));
  };

  return <div>
    <div className="mb-2 flex items-center gap-1"><p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Indefinite Charges{selectedIds.size ? ` (${selectedIds.size} selected)` : ""}</p><FieldHelp label="Indefinite Charges">Reusable charge determinations applied when this configuration posts a journal. Their attached commissions control tariff scales, limits, splits, levies, and recovery behavior.</FieldHelp></div>
    <div className={disabled ? "pointer-events-none opacity-60" : ""}><PickerList items={items} selectedIds={selectedIds} onToggle={toggle} getLabel={(item) => item.Description} getSublabel={(item) => [item.RecoveryModeDescription, item.RecoverySourceDescription].filter(Boolean).join(" — ")} emptyText={loading ? "Loading indefinite charges..." : "No unlocked indefinite charges are available."} /></div>
  </div>;
}
