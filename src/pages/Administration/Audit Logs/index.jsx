import { useEffect, useMemo, useState } from "react";
import { FaChevronDown, FaChevronUp, FaClipboardList, FaDesktop, FaHistory, FaSearch, FaUser } from "react-icons/fa";
import NotFoundImage from "/assets/scopefinding.png";
import Swal from "sweetalert2";
import { apiErrorMessage, apiJson, normalizeList } from "@/lib/api";

const tabs = [
  { id: "logs", label: "Audit Logs", description: "Entity and database record changes", icon: FaClipboardList },
  { id: "entries", label: "Audit Entries", description: "User and business activity history", icon: FaHistory },
];

const displayDate = (value) => (value ? new Date(value).toLocaleString() : "—");
const displayValue = (value) => value || "—";

function DetailField({ label, value }) {
  return <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt><dd className="mt-1 break-words text-sm text-slate-800">{displayValue(value)}</dd></div>;
}

function EnvironmentDetails({ item }) {
  const hasLegacyHardware = item.EnvironmentMACAddress || item.EnvironmentMotherboardSerialNumber || item.EnvironmentProcessorId;
  return (
    <div className="grid gap-6 border-t border-slate-200 bg-slate-50 px-6 py-5 lg:grid-cols-2">
      <section>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900"><FaDesktop className="text-indigo-600" /> Client context</h3>
        <dl className="grid gap-4 sm:grid-cols-2">
          <DetailField label="IP address" value={item.ClientIPAddress || item.EnvironmentIPAddress} />
          <DetailField label="Device ID" value={item.ClientDeviceId || "Not captured"} />
          <div className="sm:col-span-2"><DetailField label="Browser / user agent" value={item.ClientUserAgent || "Not captured"} /></div>
        </dl>
      </section>
      <section>
        <h3 className="mb-3 text-sm font-semibold text-slate-900">Server context</h3>
        <dl className="grid gap-4 sm:grid-cols-2">
          <DetailField label="Machine" value={item.ServerMachineName || item.EnvironmentMachineName} />
          <DetailField label="OS version" value={item.ServerOSVersion || item.EnvironmentOSVersion} />
          <DetailField label="Runtime user" value={item.EnvironmentUserName} />
          <DetailField label="Domain" value={item.EnvironmentDomainName} />
        </dl>
      </section>
      <section className="lg:col-span-2">
        <h3 className="mb-3 text-sm font-semibold text-slate-900">Legacy hardware identifiers</h3>
        {hasLegacyHardware ? <dl className="grid gap-4 sm:grid-cols-3"><DetailField label="MAC address" value={item.EnvironmentMACAddress} /><DetailField label="Motherboard serial" value={item.EnvironmentMotherboardSerialNumber} /><DetailField label="Processor ID" value={item.EnvironmentProcessorId} /></dl> : <p className="text-sm text-slate-500">Not available from a browser-based client.</p>}
      </section>
      <section className="border-t border-slate-200 pt-4 lg:col-span-2">
        <h3 className="mb-3 text-sm font-semibold text-slate-900">Audit record</h3>
        <dl className="grid gap-4 sm:grid-cols-2"><DetailField label="Created by" value={item.CreatedBy} /><DetailField label="Created date" value={displayDate(item.CreatedDate)} /></dl>
      </section>
    </div>
  );
}

function AuditRow({ item, isEntries, open, onToggle }) {
  return (
    <>
      <tr className="hover:bg-slate-50">
        <td className="whitespace-nowrap px-5 py-4 font-medium text-indigo-700">{displayValue(item.EventType)}</td>
        <td className="max-w-sm px-5 py-4 text-slate-800"><span className="line-clamp-2">{displayValue(isEntries ? item.Activity : item.TableName)}</span></td>
        <td className="max-w-48 truncate px-5 py-4 text-slate-600">{displayValue(isEntries ? item.CustomerId : item.RecordID)}</td>
        <td className="whitespace-nowrap px-5 py-4 text-slate-700"><span className="flex items-center gap-2"><FaUser className="text-slate-400" /> {displayValue(item.ApplicationUserName)}</span></td>
        {isEntries && <td className="px-5 py-4 text-slate-600">{displayValue(item.ApplicationUserDesignation)}</td>}
        <td className="whitespace-nowrap px-5 py-4 text-slate-600">{displayDate(item.CreatedDate)}</td>
        <td className="px-5 py-4 text-right"><button type="button" onClick={onToggle} className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100">{open ? <FaChevronUp /> : <FaChevronDown />} {open ? "Hide" : "View"}</button></td>
      </tr>
      {open && <tr><td colSpan={isEntries ? 7 : 6} className="p-0">{!isEntries && <div className="border-t border-slate-200 px-6 py-4"><dl><DetailField label="Narration" value={item.AdditionalNarration} /></dl></div>}<EnvironmentDetails item={item} /></td></tr>}
    </>
  );
}

export default function AuditLogs() {
  const [activeTab, setActiveTab] = useState("logs");
  const [records, setRecords] = useState({ logs: [], entries: [] });
  const [loading, setLoading] = useState({ logs: true, entries: false });
  const [loaded, setLoaded] = useState({ logs: false, entries: false });
  const [expandedId, setExpandedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (loaded[activeTab]) return;
    let cancelled = false;
    const path = activeTab === "logs" ? "" : "/entries";
    const fetchRecords = async () => {
      setLoading((current) => ({ ...current, [activeTab]: true }));
      try {
        const data = await apiJson(`${import.meta.env.VITE_APP_ADMIN_URL}/api/administration/auditlogs${path}`);
        if (!cancelled) {
          setRecords((current) => ({ ...current, [activeTab]: normalizeList(data) }));
          setLoaded((current) => ({ ...current, [activeTab]: true }));
        }
      } catch (error) {
        if (!cancelled) {
          setRecords((current) => ({ ...current, [activeTab]: [] }));
          Swal.fire("Error", apiErrorMessage(error, `Unable to load audit ${activeTab}.`), "error");
        }
      } finally {
        if (!cancelled) setLoading((current) => ({ ...current, [activeTab]: false }));
      }
    };
    fetchRecords();
    return () => { cancelled = true; };
  }, [activeTab, loaded]);

  const isEntries = activeTab === "entries";
  const filteredRecords = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return records[activeTab];
    return records[activeTab].filter((item) => [item.EventType, item.TableName, item.RecordID, item.ApplicationUserName, item.ApplicationUserDesignation, item.AdditionalNarration, item.Activity, item.CustomerId].some((value) => String(value || "").toLowerCase().includes(query)));
  }, [activeTab, records, searchQuery]);

  const selectTab = (tabId) => { setActiveTab(tabId); setExpandedId(null); setSearchQuery(""); };

  return (
    <main className="min-h-screen bg-slate-100 p-6 md:p-10">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <header className="border-b border-slate-200 px-6 py-5 md:px-8"><h1 className="flex items-center gap-3 text-2xl font-bold text-slate-900"><FaClipboardList className="text-indigo-700" /> Audit History</h1><p className="mt-1 text-sm text-slate-600">Review system data changes and user activity in one place.</p></header>
        <nav className="flex gap-2 border-b border-slate-200 px-6 pt-4 md:px-8" aria-label="Audit views">
          {tabs.map((tab) => { const Icon = tab.icon; const selected = activeTab === tab.id; return <button key={tab.id} type="button" onClick={() => selectTab(tab.id)} className={`flex items-center gap-3 rounded-t-lg border-b-2 px-4 py-3 text-left transition ${selected ? "border-indigo-700 bg-indigo-50 text-indigo-800" : "border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`} aria-current={selected ? "page" : undefined}><Icon /><span><span className="block text-sm font-semibold">{tab.label}</span><span className="hidden text-xs font-normal sm:block">{tab.description}</span></span></button>; })}
        </nav>
        <section className="p-6 md:p-8">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-lg font-semibold text-slate-900">{isEntries ? "Audit Entries" : "Audit Logs"}</h2><p className="text-sm text-slate-500">{filteredRecords.length} {filteredRecords.length === 1 ? "record" : "records"}</p></div><label className="relative block w-full sm:max-w-md"><span className="sr-only">Search audit records</span><FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input type="search" placeholder={isEntries ? "Search event, activity, user, or customer..." : "Search event, table, record, user, or narration..."} className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} /></label></div>
          <div className="overflow-x-auto rounded-xl border border-slate-200"><table className="min-w-full divide-y divide-slate-200 text-sm"><thead className="bg-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-600"><tr><th className="px-5 py-3">Event</th><th className="px-5 py-3">{isEntries ? "Activity" : "Table"}</th><th className="px-5 py-3">{isEntries ? "Customer" : "Record ID"}</th><th className="px-5 py-3">Application user</th>{isEntries && <th className="px-5 py-3">Designation</th>}<th className="px-5 py-3">Created</th><th className="px-5 py-3 text-right">Details</th></tr></thead><tbody className="divide-y divide-slate-200 bg-white">
            {loading[activeTab] ? [1, 2, 3].map((row) => <tr key={row} className="animate-pulse">{Array.from({ length: isEntries ? 7 : 6 }).map((_, column) => <td key={column} className="px-5 py-5"><div className="h-4 rounded bg-slate-200" /></td>)}</tr>) : filteredRecords.length ? filteredRecords.map((item) => <AuditRow key={item.Id} item={item} isEntries={isEntries} open={expandedId === item.Id} onToggle={() => setExpandedId(expandedId === item.Id ? null : item.Id)} />) : <tr><td colSpan={isEntries ? 7 : 6} className="px-6 py-12 text-center text-slate-500"><img src={NotFoundImage} alt="" className="mx-auto mb-3 w-36" />{searchQuery ? "No audit records match your search." : `No audit ${isEntries ? "entries" : "logs"} found.`}</td></tr>}
          </tbody></table></div>
        </section>
      </div>
    </main>
  );
}
