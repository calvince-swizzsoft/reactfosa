import { useState, useEffect } from "react";
import NotFoundImage from "/assets/scopefinding.png";

const BASE = `${import.meta.env.VITE_APP_FIN_URL}`

function chequeStatus(item) {
  if (item.IsCleared) return { label: "Cleared", cls: "bg-green-100 text-green-700" };
  if (item.IsBanked) return { label: "Banked", cls: "bg-blue-100 text-blue-700" };
  if (item.IsTransferred) return { label: "Transferred", cls: "bg-purple-100 text-purple-700" };
  return { label: "Pending", cls: "bg-yellow-100 text-yellow-700" };
}

function StatusBadge({ item }) {
  const { label, cls } = chequeStatus(item);
  return (
    <span className={`px-2 py-1 rounded text-xs font-semibold ${cls}`}>{label}</span>
  );
}

function SkeletonRow() {
  return (
    <div className="grid grid-cols-12 gap-2 items-center bg-white px-4 py-3 rounded-lg shadow border animate-pulse">
      <div className="col-span-1"><div className="h-4 bg-gray-200 rounded w-16" /></div>
      <div className="col-span-2"><div className="h-4 bg-gray-200 rounded w-32" /></div>
      <div className="col-span-2 flex flex-col gap-1">
        <div className="h-4 bg-gray-200 rounded w-28" />
        <div className="h-3 bg-gray-100 rounded w-20" />
      </div>
      <div className="col-span-1"><div className="h-4 bg-indigo-100 rounded w-20" /></div>
      <div className="col-span-2"><div className="h-4 bg-gray-200 rounded w-24" /></div>
      <div className="col-span-2"><div className="h-4 bg-gray-200 rounded w-28" /></div>
      <div className="col-span-1"><div className="h-6 bg-gray-200 rounded-full w-16" /></div>
      <div className="col-span-1"><div className="h-4 bg-gray-100 rounded w-20" /></div>
    </div>
  );
}

export default function Catalogue() {
  const [cheques, setCheques] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCheques = () => {
    setLoading(true);
    fetch(`${BASE}/api/frontoffice/cheques`)
      .then((r) => r.json())
      .then((d) => setCheques(Array.isArray(d) ? d : []))
      .catch(() => setCheques([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCheques(); }, []);

  return (
    <div>
      {/* Table header */}
      <div className="grid grid-cols-12 gap-2 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-3 text-sm">
        <span className="col-span-1">Cheque #</span>
        <span className="col-span-2">Account</span>
        <span className="col-span-2">Customer</span>
        <span className="col-span-1">Amount</span>
        <span className="col-span-2">Drawer Bank</span>
        <span className="col-span-2">Write Date</span>
        <span className="col-span-1">Status</span>
        <span className="col-span-1">Teller</span>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => <SkeletonRow key={i} />)}
        </div>
      ) : cheques.length > 0 ? (
        <div className="space-y-2">
          {cheques.map((c) => (
            <div key={c.Id} className="grid grid-cols-12 gap-2 items-center bg-white px-4 py-3 rounded-lg shadow border text-sm">
              <span className="col-span-1 font-mono text-xs text-gray-700">{c.PaddedNumber || c.Number || "—"}</span>
              <span className="col-span-2 text-xs text-gray-500 truncate" title={c.CustomerAccountFullAccountNumber}>
                {c.CustomerAccountFullAccountNumber || "—"}
              </span>
              <div className="col-span-2">
                <p className="font-medium text-gray-800 truncate">
                  {[c.CustomerAccountCustomerIndividualFirstName, c.CustomerAccountCustomerIndividualLastName].filter(Boolean).join(" ") || c.Drawer || "—"}
                </p>
                <p className="text-xs text-gray-400">{c.CustomerAccountCustomerTypeDescription || ""}</p>
              </div>
              <span className="col-span-1 font-semibold text-indigo-700">
                {c.Amount != null ? c.Amount.toLocaleString() : "—"}
              </span>
              <div className="col-span-2">
                <p className="text-gray-700">{c.DrawerBank || "—"}</p>
                <p className="text-xs text-gray-400 truncate" title={c.DrawerBankBranch}>{c.DrawerBankBranch || ""}</p>
              </div>
              <span className="col-span-2 text-xs text-gray-400">
                {c.WriteDate && !c.WriteDate.startsWith("0001") ? new Date(c.WriteDate).toLocaleDateString() : "—"}
              </span>
              <span className="col-span-1"><StatusBadge item={c} /></span>
              <span className="col-span-1 text-xs text-gray-500 truncate" title={c.TellerDescription}>
                {c.TellerDescription || "—"}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center mt-10">
          <img src={NotFoundImage} alt="Not Found" className="mx-auto w-32 h-auto" />
          <p className="text-gray-400 mt-2">No cheques found in the catalogue.</p>
        </div>
      )}
    </div>
  );
}
