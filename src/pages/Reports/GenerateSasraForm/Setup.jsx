import Form5 from "./Form5";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaFileAlt } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { apiJson } from "@/lib/api";
import { availableReportRows } from "./reportListModel";
import Form3 from "./Form3";
import Form4 from "./Form4";
import Form2 from "./Form2";
import Form1 from "./Form1";
import Form6 from "./Form6";
import Form7 from "./Form7";

const base = `${import.meta.env.VITE_APP_FIN_URL}/api/accounts/sasra/setup`;
const normalize = value => Array.isArray(value) ? value.map(normalize) : value && typeof value === "object" ? Object.fromEntries(Object.entries(value).map(([k, v]) => [k[0].toLowerCase() + k.slice(1), normalize(v)])) : value;
async function request(path) { const r = await apiJson(base + path, { cache: "no-store" }); return normalize(r.data ?? r.Data); }
const screens = { form5: Form5, form4: Form4, form3: Form3, form2: Form2, form1: Form1, form6: Form6, form7: Form7 };

export default function SasraSetup({ profile = "DT" }) {
  const [rows, setRows] = useState(() => availableReportRows([], profile)), [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true), [error, setError] = useState(""), [reload, setReload] = useState(0);
  const [detail, setDetail] = useState(null);
  useEffect(() => {
    let active = true; setLoading(true); setError("");
    async function load() {
      const versions = [];
      for (let page = 0; ; page++) {
        const result = await request(`/versions?pageIndex=${page}&pageSize=100`);
        if (!active) return;
        versions.push(...result.items);
        if (versions.length >= result.total || !result.items.length) break;
      }
      if (active) setRows(availableReportRows(versions, profile));
    }
    load().catch(e => { if (active) setError(e.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reload, profile]);
  const Report = screens[selected?.endpoint];
  if (Report) return <Report savedVersionId={selected.id} savedForm1VersionId={rows.find(r => r.endpoint === "form1")?.id} savedForm6VersionId={rows.find(r => r.endpoint === "form6")?.id} onClose={() => { setSelected(null); setReload(n => n + 1); }} />;
  return <main className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
    <header className="bg-indigo-800 px-6 py-3 rounded-2xl flex justify-between items-center gap-3"><h1 className="text-xl font-bold text-white flex items-center gap-2"><FaFileAlt />SASRA Reports · {profile}</h1><Button variant="outline" disabled={loading} onClick={() => setReload(n => n + 1)}>Refresh</Button></header>
    <div className="my-4 flex flex-wrap items-center justify-between gap-3 text-sm"><p className="text-gray-500">{profile === "DT" ? "Deposit-taking SACCOs · Select a report to open its mappings or review loan classification." : "Non-withdrawable-deposit SACCOs · Form 2 reports will be added here."}</p><Link className="text-indigo-700 underline focus-visible:outline" to="/Reports/GenerateSasraForm">Back to SASRA categories</Link></div>
    {error && <p role="alert" className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg">{error}</p>}
    <div className="bg-gray-200 p-4 rounded-sm">
      <div className="grid grid-cols-12 gap-3 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4"><span className="col-span-7">Report</span><span className="col-span-2">Category</span><span className="col-span-3">Current revision</span></div>
      {loading ? <div className="space-y-2">{[1, 2, 3].map(n => <div key={n} className="grid grid-cols-12 gap-3 animate-pulse bg-gray-50 p-4 rounded-lg"><div className="col-span-7 h-5 bg-gray-200 rounded" /><div className="col-span-2 h-5 bg-gray-200 rounded" /><div className="col-span-3 h-5 bg-gray-200 rounded" /></div>)}</div> : <div className="space-y-2">{rows.map(r => <button key={`${r.profile}:${r.reportCode}`} onClick={async () => {
        if (r.endpoint) { setSelected(r); return; }
        setError(""); setLoading(true);
        try { setDetail(await request(`/versions/${r.id}`)); } catch (e) { setError(e.message); } finally { setLoading(false); }
      }} className="w-full text-left grid grid-cols-12 gap-3 items-center bg-white rounded-lg shadow-lg border hover:shadow-xl transition-all p-3 text-sm text-gray-700 focus-visible:outline-indigo-600">
        <span className="col-span-7"><strong>{r.reportCode}</strong> · {r.title}</span><span className="col-span-2">{r.profile}</span><span className="col-span-3">{error ? "Could not load saved revisions" : r.derived ? "Loan ageing + dated reviews" : r.revision > 0 ? `Revision ${r.revision}` : "No saved mapping"}</span>
      </button>)}</div>}
      {!loading && !error && !rows.length && <div className="text-center py-6"><img src="/assets/scopefinding.png" alt="" className="mx-auto w-32" /><p className="text-gray-500">{profile === "NWDT" ? "NWDT reports are not yet implemented. Forms 2A–2H will be added here." : "No saved DT reports."}</p></div>}
    </div>
    {detail && <section className="mt-4 border rounded-lg p-4"><div className="flex justify-between gap-3"><h2 className="font-semibold">{detail.reportCode} · {detail.title} · Revision {detail.revision}</h2><Button variant="outline" onClick={() => setDetail(null)}>Close</Button></div><p className="text-sm text-gray-500 my-3">This saved definition does not yet have an implemented workbook preview or Excel export.</p><div className="space-y-2">{detail.lines.map(l => <div key={l.code} className="grid grid-cols-2 gap-3 border-t pt-2 text-sm"><span>{l.description}</span><span>{l.accountIds.length ? l.accountIds.map(id => l.accountNames[id] || id).join(", ") : "No accounts mapped"}</span></div>)}</div></section>}
  </main>;
}
