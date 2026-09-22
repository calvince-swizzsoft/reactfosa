import { useState, useEffect } from "react";
import { guarantorDisplayName } from "../LoanCases/lib/guarantorDisplayName";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BatchFieldHelp } from "@/pages/Accounts/BatchProcedures/lib/BatchFieldLabel";
import { FaUserShield, FaPlus, FaSearch } from "react-icons/fa";
import NotFoundImage from "/assets/scopefinding.png";
import { listLoanGuarantors } from "./api";
import { AttachPanel, HistoryPanel, SubstitutePanel } from "../GuarantorAttachment";

const tabs = [
  {id: 'guarantors', label: 'Guarantors'},
  {id: 'attach', label: 'Attach', Panel: AttachPanel},
  {id: 'substitute', label: 'Substitute', Panel: SubstitutePanel},
  {id: 'history', label: 'History / Relieve', Panel: HistoryPanel},
];

// api/backoffice/loanguarantors — docs/api/loan-guarantor-api-spec.md.
// NavigationMenu code 70017 ("Guarantor Management").
export default function Guarantors({initialTab = 'guarantors'}) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const Panel = tabs.find(tab => tab.id === activeTab)?.Panel;
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [itemsCount, setItemsCount] = useState(0);
  const pageSize = 20;

  const fetchList = () => {
    setLoading(true);
    listLoanGuarantors({ text: search, pageIndex, pageSize })
      .then((page) => {
        setItems(page?.pageCollection || page?.PageCollection || []);
        setItemsCount(page?.itemsCount ?? page?.ItemsCount ?? 0);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchList(); }, [pageIndex]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPageIndex(0);
    fetchList();
  };

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
      <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FaUserShield /> Guarantor Management
        </h2>
        {activeTab === 'guarantors' && <Button onClick={() => navigate("/Loaning/Guarantors/create")} className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2">
          <FaPlus /> Add Guarantor
        </Button>}
      </div>

      <div role="tablist" aria-label="Guarantor management" className="flex flex-wrap gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        {tabs.map(tab => <button key={tab.id} type="button" role="tab" aria-selected={activeTab === tab.id} onClick={() => setActiveTab(tab.id)} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all ${activeTab === tab.id ? 'bg-white shadow text-indigo-700' : 'text-gray-500 hover:text-indigo-600'}`}>{tab.label}</button>)}
      </div>
      {Panel ? <Panel/> : <>

      <form onSubmit={handleSearch} className="mb-4 flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search guarantors..." className="pl-8" />
        </div>
        <Button type="submit" variant="outline">Search</Button>
      </form>

      <div className="bg-gray-200 p-4 rounded-sm overflow-x-auto">
        <div className="min-w-[1000px]">
        <div className="grid grid-cols-[repeat(14,minmax(0,1fr))] gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4 text-sm">
          <span className="col-span-3">Guarantor</span>
          <span className="col-span-3">Loanee</span>
          <span className="col-span-2">Loan Case</span>
          <span className="col-span-2">Amount Guaranteed</span>
          <span className="col-span-2">Committed / Total Shares</span>
          <span className="col-span-2 inline-flex items-center gap-1">Status<BatchFieldHelp label="Guarantor status">Attached guarantors are active. Released records are retained as history and do not qualify as active guarantors for notices.</BatchFieldHelp></span>
        </div>

        {loading ? (
          <div className="space-y-2 animate-pulse">
            {[1, 2, 3].map((i) => <div key={i} className="grid grid-cols-[repeat(14,minmax(0,1fr))] gap-4 p-3 bg-gray-50 rounded-lg">{[3,3,2,2,2,2].map((span,index)=><span key={index} className={`${span===3?"col-span-3":"col-span-2"} h-5 bg-gray-200 rounded`}/>)}</div>)}
          </div>
        ) : items.length > 0 ? (
          <div className="space-y-2">
            {items.map((g) => (
              <div key={g.Id} className="bg-white rounded-lg shadow-lg border hover:shadow-xl transition-all">
                <div className="grid grid-cols-[repeat(14,minmax(0,1fr))] gap-4 items-center p-3 text-sm">
                  <span className="col-span-3 font-medium text-indigo-700 truncate">{guarantorDisplayName(g)}</span>
                  <span className="col-span-3 text-gray-700 truncate">{g.LoaneeCustomerFullName}</span>
                  <span className="col-span-2 text-gray-700">{g.LoanCasePaddedCaseNumber}</span>
                  <span className="col-span-2 font-semibold text-gray-800">{g.AmountGuaranteed?.toLocaleString()}</span>
                  <span className="col-span-2 text-gray-700">{g.CommittedShares?.toLocaleString()} / {g.TotalShares?.toLocaleString()}</span>
                  <span className="col-span-2"><span className={`px-2 py-1 rounded text-xs font-semibold ${(g.Status ?? g.status) === 0 ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-600"}`}>{(g.Status ?? g.status) === 0 ? "Attached" : (g.Status ?? g.status) === 1 ? "Released" : "Unknown"}</span></span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <img src={NotFoundImage} alt="Not Found" className="mx-auto w-42" />
            <p className="text-gray-400 font-medium">No guarantors found.</p>
          </div>
        )}
      </div>

      </div>

      {itemsCount > pageSize && (
        <div className="flex justify-center items-center gap-4 mt-4">
          <Button variant="default" disabled={pageIndex === 0} onClick={() => setPageIndex((p) => p - 1)}>Prev</Button>
          <span className="text-sm text-gray-600">Page {pageIndex + 1}</span>
          <Button variant="default" disabled={(pageIndex + 1) * pageSize >= itemsCount} onClick={() => setPageIndex((p) => p + 1)}>Next</Button>
        </div>
      )}
      </>}
    </div>
  );
}
