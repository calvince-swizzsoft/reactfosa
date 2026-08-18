import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Swal from "sweetalert2";
import { FaChevronLeft, FaChevronRight, FaDownload, FaEdit, FaExternalLinkAlt, FaFileAlt, FaPlus, FaSearch, FaTrash } from "react-icons/fa";
import NotFoundImage from "/assets/scopefinding.png";
import { createCategory, deleteReport, downloadRdl, getViewerUrl, listCategories, listReports, updateReport, uploadReport } from "./api";

const emptyForm = { name: "", description: "", reportPath: "", categoryId: "", isActive: true, file: null };

export default function UserDefinedReports() {
  const [reports, setReports] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [itemsCount, setItemsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [canManage, setCanManage] = useState(false);
  const [viewerConfigured, setViewerConfigured] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [categoryName, setCategoryName] = useState("");
  const pageSize = 20;

  const load = async () => {
    setLoading(true);
    try {
      const [page, cats] = await Promise.all([
        listReports({ text: search.trim(), categoryId, pageIndex, pageSize, includeInactive: true }),
        listCategories(),
      ]);
      setReports(page?.pageCollection || page?.PageCollection || []);
      setItemsCount(page?.itemsCount || page?.ItemsCount || 0);
      setCanManage(Boolean(page?.canManage ?? page?.CanManage));
      setViewerConfigured(Boolean(page?.viewerConfigured ?? page?.ViewerConfigured));
      setCategories(Array.isArray(cats) ? cats : []);
    } catch (error) {
      setReports([]);
      Swal.fire(error.message.includes("403") ? "Access denied" : "Unable to load reports", error.message, "error");
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [pageIndex]);

  const searchReports = () => { if (pageIndex === 0) load(); else setPageIndex(0); };
  const viewReport = async (report) => {
    try {
      const data = await getViewerUrl(report.id);
      const url = data?.url ?? data?.Url;
      if (!url) throw new Error("The API did not return an SSRS viewer URL.");
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) { Swal.fire("Unable to open report", error.message, "error"); }
  };
  const openCreate = () => { setEditing(null); setForm({ ...emptyForm, categoryId: categories[0]?.id || categories[0]?.Id || "" }); setManageOpen(true); };
  const openEdit = (report) => { setEditing(report); setForm({ name: report.name, description: report.description || "", reportPath: report.reportPath, categoryId: String(report.categoryId), isActive: report.isActive, file: null }); setManageOpen(true); };

  const saveReport = async (event) => {
    event.preventDefault();
    try {
      if (editing) {
        await updateReport(editing.id, { ...form, categoryId: Number(form.categoryId) });
      } else {
        if (!form.file) throw new Error("Select an RDL file.");
        const body = new FormData();
        body.append("name", form.name); body.append("description", form.description); body.append("reportPath", form.reportPath); body.append("categoryId", form.categoryId); body.append("rdl", form.file);
        await uploadReport(body);
      }
      Swal.fire("Saved", editing ? "Report metadata updated." : "Report added to the catalogue. Publish the RDL to SSRS at the specified path before viewing.", "success");
      setManageOpen(false); await load();
    } catch (error) { Swal.fire("Unable to save report", error.message, "error"); }
  };

  const addCategory = async () => {
    try { await createCategory(categoryName); setCategoryName(""); setCategories(await listCategories()); Swal.fire("Created", "Report category created.", "success"); }
    catch (error) { Swal.fire("Unable to create category", error.message, "error"); }
  };
  const remove = async (report) => {
    const result = await Swal.fire({ title: `Delete ${report.name}?`, text: "This removes the catalogue entry and stored RDL, but does not delete a report already published to SSRS.", icon: "warning", showCancelButton: true, confirmButtonColor: "#dc2626", confirmButtonText: "Delete" });
    if (!result.isConfirmed) return;
    try { await deleteReport(report.id); await load(); Swal.fire("Deleted", "Report catalogue entry deleted.", "success"); }
    catch (error) { Swal.fire("Unable to delete report", error.message, "error"); }
  };
  const saveRdl = async (report) => {
    try { const { blob, fileName } = await downloadRdl(report.id); const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = fileName; anchor.click(); URL.revokeObjectURL(url); }
    catch (error) { Swal.fire("Unable to download RDL", error.message, "error"); }
  };

  return <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
    <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
      <h2 className="text-xl font-bold text-white flex items-center gap-2"><FaFileAlt /> User-Defined Reports</h2>
      {canManage && <Button onClick={openCreate} className="bg-indigo-600 hover:bg-indigo-700 flex gap-2"><FaPlus /> Add Report</Button>}
    </div>
    {!viewerConfigured && <div className="mb-4 p-3 rounded-lg bg-amber-100 text-amber-700 text-sm">The catalogue is available, but the SSRS viewer URL is not configured correctly for this environment.</div>}
    <form onSubmit={(e) => { e.preventDefault(); searchReports(); }} className="flex flex-wrap gap-3 mb-5 bg-gray-100 p-4 rounded-lg">
      <div className="relative flex-1 min-w-64"><FaSearch className="absolute left-3 top-3 text-gray-400" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search report name, description, path or category" className="pl-9 bg-white" /></div>
      <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="h-10 min-w-52 border border-gray-300 rounded-md bg-white px-3"><option value="">All categories</option>{categories.map((c) => <option key={c.id ?? c.Id} value={c.id ?? c.Id}>{c.name ?? c.Name}</option>)}</select>
      <Button className="bg-indigo-600 hover:bg-indigo-700">Search</Button>
    </form>
    {canManage && <div className="mb-5 flex flex-wrap items-end gap-2 bg-gray-100 p-4 rounded-lg"><div className="flex-1 min-w-60"><label className="text-sm font-semibold text-gray-700">New report category</label><Input value={categoryName} onChange={(e) => setCategoryName(e.target.value)} placeholder="Category name" className="bg-white" /></div><Button type="button" onClick={addCategory} disabled={!categoryName.trim()} className="bg-gray-700 hover:bg-gray-600">Create Category</Button></div>}
    <div className="bg-gray-200 p-4 rounded-sm">
      <div className="grid grid-cols-12 gap-3 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4"><span className="col-span-4">Report</span><span className="col-span-2">Category</span><span className="col-span-3">SSRS Path</span><span className="col-span-1">Status</span><span className="col-span-2 text-right">Actions</span></div>
      {loading ? <div className="space-y-2 animate-pulse">{[1,2,3].map((i) => <div key={i} className="h-20 bg-gray-100 rounded-lg" />)}</div> : reports.length ? <div className="space-y-2">{reports.map((report) => <div key={report.id} className="grid grid-cols-12 gap-3 items-center bg-white rounded-lg shadow-lg border p-4 hover:shadow-xl transition-all text-sm"><div className="col-span-4"><p className="font-semibold text-indigo-700">{report.name}</p><p className="text-xs text-gray-500">{report.description || report.fileName}</p></div><span className="col-span-2">{report.categoryName}</span><span className="col-span-3 text-gray-500 break-all">{report.reportPath}</span><span className="col-span-1"><span className={`px-2 py-1 rounded text-xs font-semibold ${report.isActive ? "bg-green-100 text-green-600" : "bg-gray-200 text-gray-500"}`}>{report.isActive ? "Active" : "Inactive"}</span></span><div className="col-span-2 flex justify-end gap-1"><Button size="sm" onClick={() => viewReport(report)} disabled={!report.isActive || !viewerConfigured} className="bg-indigo-600 hover:bg-indigo-700"><FaExternalLinkAlt /></Button>{canManage && <><Button size="sm" variant="ghost" onClick={() => saveRdl(report)} title="Download RDL"><FaDownload className="text-green-600" /></Button><Button size="sm" variant="ghost" onClick={() => openEdit(report)}><FaEdit className="text-indigo-600" /></Button><Button size="sm" variant="ghost" onClick={() => remove(report)}><FaTrash className="text-red-600" /></Button></>}</div></div>)}</div> : <div className="text-center py-10"><img src={NotFoundImage} alt="No reports" className="mx-auto w-32" /><p className="text-gray-400">No reports match the selected criteria.</p></div>}
      <div className="flex justify-center items-center mt-4"><Button size="sm" disabled={pageIndex === 0} onClick={() => setPageIndex((p) => p - 1)} className="m-2 flex gap-1"><FaChevronLeft /> Prev</Button><span>Page {pageIndex + 1} of {Math.max(1, Math.ceil(itemsCount / pageSize))}</span><Button size="sm" disabled={(pageIndex + 1) * pageSize >= itemsCount} onClick={() => setPageIndex((p) => p + 1)} className="m-2 flex gap-1">Next <FaChevronRight /></Button></div>
    </div>
    {manageOpen && <div className="fixed inset-0 z-50 bg-black/40 flex justify-end" onClick={() => setManageOpen(false)}><div className="w-full max-w-xl h-full bg-white shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}><div className="m-2 bg-indigo-600 text-white rounded-2xl px-5 py-4 flex justify-between items-center"><h3 className="font-bold">{editing ? "Edit Report" : "Add User-Defined Report"}</h3><Button variant="outline" onClick={() => setManageOpen(false)} className="text-gray-700">Close</Button></div><form onSubmit={saveReport} className="flex-1 overflow-y-auto p-6 space-y-4"><div><label className="text-sm font-semibold text-gray-700">Report Name</label><Input required maxLength={200} value={form.name} onChange={(e) => setForm((f) => ({...f,name:e.target.value}))} /></div><div><label className="text-sm font-semibold text-gray-700">Category</label><select required value={form.categoryId} onChange={(e) => setForm((f) => ({...f,categoryId:e.target.value}))} className="w-full h-10 border rounded-md px-3"><option value="">Select category</option>{categories.map((c) => <option key={c.id ?? c.Id} value={c.id ?? c.Id}>{c.name ?? c.Name}</option>)}</select></div><div><label className="text-sm font-semibold text-gray-700">SSRS Report Path</label><Input required value={form.reportPath} onChange={(e) => setForm((f) => ({...f,reportPath:e.target.value}))} placeholder="Finance/Monthly Trial Balance" /><p className="text-xs text-gray-500 mt-1">Path on the configured SSRS server, without a hostname.</p></div><div><label className="text-sm font-semibold text-gray-700">Description</label><textarea value={form.description} onChange={(e) => setForm((f) => ({...f,description:e.target.value}))} maxLength={1000} className="w-full min-h-24 border rounded-md p-3" /></div>{!editing && <div><label className="text-sm font-semibold text-gray-700">RDL Definition</label><Input required type="file" accept=".rdl,application/xml,text/xml" onChange={(e) => setForm((f) => ({...f,file:e.target.files?.[0] || null}))} /></div>}{editing && <label className="flex gap-2 items-center"><input type="checkbox" className="w-4 h-4 accent-indigo-600" checked={form.isActive} onChange={(e) => setForm((f) => ({...f,isActive:e.target.checked}))} /> Active and visible to report users</label>}<div className="p-3 bg-blue-50 text-blue-700 rounded-lg text-sm">The RDL is stored for governance and recovery. Publish it separately to SSRS at the path above; catalogue upload does not silently deploy server content.</div><Button className="w-full bg-indigo-600 hover:bg-indigo-700">{editing ? "Save Changes" : "Add to Catalogue"}</Button></form></div></div>}
  </div>;
}
