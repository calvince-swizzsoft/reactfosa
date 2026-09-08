import { useEffect, useState } from "react";
import { apiJson, normalizeList } from "@/lib/api";

const BASE = `${import.meta.env.VITE_APP_MEMBERSHIP_URL}/api/administration/companies`;
const TYPES = `${import.meta.env.VITE_APP_FIN_URL}/api/accounts/debittypes`;

export default function useCompanyDebitTypes(open, companyId) {
  const [debitTypes, setDebitTypes] = useState([]);
  const [selectedDebitTypeIds, setSelected] = useState([]);
  const [loadingDebitTypes, setLoading] = useState(false);
  const [debitTypesError, setError] = useState("");
  const [dirty, setDirty] = useState(false);
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setSelected([]); setDirty(false); setLoading(true); setError("");
    Promise.all([apiJson(TYPES), companyId ? apiJson(`${BASE}/${companyId}/debit-types`) : Promise.resolve([])])
      .then(([options, attached]) => {
        if (cancelled) return;
        setDebitTypes(normalizeList(options));
        setSelected(normalizeList(attached).map((item) => item.Id));
      }).catch((error) => { if (!cancelled) setError(error.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [open, companyId]);
  const toggleDebitType = (id) => {
    if (loadingDebitTypes || debitTypesError) return;
    setSelected((ids) => ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id]);
    setDirty(true);
  };
  const payload = selectedDebitTypeIds.map((Id) => ({ Id }));
  const saveDebitTypes = async () => {
    if (dirty) await apiJson(`${BASE}/${companyId}/debit-types`, { method: "PUT", body: JSON.stringify(payload) });
  };
  return { debitTypes, selectedDebitTypeIds, loadingDebitTypes, debitTypesError, toggleDebitType, payload, saveDebitTypes };
}
