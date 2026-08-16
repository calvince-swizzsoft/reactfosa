import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Swal from "sweetalert2";
import { FaFileSignature, FaPlus, FaChevronDown } from "react-icons/fa";
import NotFoundImage from "/assets/scopefinding.png";
import {
  listLoanRequests, getLoanRequest, registerLoanRequest, cancelLoanRequest, deleteLoanRequest,
} from "./api";
import { createLoanCase } from "../LoanCases/lib/loanCaseApi";
import EntryPickerModal from "../../Accounts/BatchProcedures/lib/EntryPickerModal";
import QuickCreateModal from "../lib/QuickCreateModal";
import { createLoaningRemark } from "../lib/loanMastersApi";

const FIN_BASE = `${import.meta.env.VITE_APP_FIN_URL}`;

const LoanRequestStatus = { New: 0, Registered: 1, Rejected: 2 };

const STATUS_STYLE = {
  [LoanRequestStatus.New]: "bg-amber-100 text-amber-600",
  [LoanRequestStatus.Registered]: "bg-green-100 text-green-600",
  [LoanRequestStatus.Rejected]: "bg-red-100 text-red-600",
};

function StatusBadge({ status, description }) {
  return (
    <span className={`px-2 py-1 rounded text-xs font-semibold ${STATUS_STYLE[status] || "bg-gray-100 text-gray-600"}`}>
      {description}
    </span>
  );
}

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

// Register orchestrates two calls, per confirmed backend behavior:
// RegisterLoanRequest itself is a pure status flip and does NOT create a
// LoanCase. This form collects the LoanCase-only fields the request
// doesn't carry (SavingsProductId/RegistrationRemarkId/BranchId), calls
// createLoanCase to produce a real case, then registers this request
// against the resulting case's CaseNumber (an int, not the case's guid
// Id). Guarantors are deliberately left out of this fast path — if the
// product requires them, add them afterward via Guarantor Management
// (they're for adding to an already-registered case anyway).
function RegisterDrawer({ request, onClose, onDone }) {
  const [savingsProductId, setSavingsProductId] = useState("");
  const [savingsProductLabel, setSavingsProductLabel] = useState("");
  const [registrationRemarkId, setRegistrationRemarkId] = useState("");
  const [registrationRemarkLabel, setRegistrationRemarkLabel] = useState("");
  const [branchId, setBranchId] = useState("");
  const [branchLabel, setBranchLabel] = useState("");
  const [receivedDate, setReceivedDate] = useState(new Date().toISOString().split("T")[0]);
  const [picker, setPicker] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!savingsProductId || !registrationRemarkId || !branchId) {
      Swal.fire("Missing Fields", "Savings product, registration remark, and branch are required to open the loan case.", "warning");
      return;
    }
    setLoading(true);
    try {
      const newCase = await createLoanCase({
        LoanCase: {
          CustomerId: request.CustomerId,
          LoanProductId: request.LoanProductId,
          SavingsProductId: savingsProductId,
          LoanPurposeId: request.LoanPurposeId,
          RegistrationRemarkId: registrationRemarkId,
          BranchId: branchId,
          AmountApplied: request.AmountApplied,
          ReceivedDate: receivedDate,
        },
        Guarantors: [],
        CollateralDocumentIds: [],
      });
      await registerLoanRequest(request.Id, newCase.CaseNumber);
      Swal.fire("Success", `Loan case #${newCase.PaddedCaseNumber || newCase.CaseNumber} opened and this request registered against it.`, "success");
      onDone();
      onClose();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-[480px] max-h-[85vh] flex flex-col z-10">
        <div className="flex justify-between items-center px-5 py-4 bg-indigo-600 rounded-t-2xl">
          <h3 className="font-bold text-white text-base">Register — Open Loan Case</h3>
          <button onClick={onClose} className="text-white/70 hover:text-white">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          <p className="text-xs text-gray-500 bg-gray-50 border rounded-lg px-3 py-2">
            {request.CustomerFullName} · {request.LoanProductDescription} · {Number(request.AmountApplied).toLocaleString()}
          </p>
          <PickerField label="Savings Product" value={savingsProductLabel} placeholder="Select savings product..." onClick={() => setPicker("savingsProduct")} />
          <PickerField label="Registration Remark" value={registrationRemarkLabel} placeholder="Select remark..." onClick={() => setPicker("registrationRemark")} />
          <PickerField label="Branch" value={branchLabel} placeholder="Select branch..." onClick={() => setPicker("branch")} />
          <FieldGroup label="Received Date">
            <Input type="date" value={receivedDate} onChange={(e) => setReceivedDate(e.target.value)} required />
          </FieldGroup>
        </form>
        <div className="shrink-0 px-4 py-3 border-t">
          <Button onClick={handleSubmit} disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700">
            {loading ? "Registering..." : "Open Loan Case & Register"}
          </Button>
        </div>
      </div>

      {picker === "savingsProduct" && (
        <EntryPickerModal
          title="Select Savings Product"
          fetchUrl={`${FIN_BASE}/api/accounts/savingsproducts`}
          getLabel={(i) => i.Description}
          onSelect={(i) => { setSavingsProductId(i.Id); setSavingsProductLabel(i.Description); }}
          onClose={() => setPicker(null)}
        />
      )}
      {picker === "registrationRemark" && (
        <EntryPickerModal
          title="Select Registration Remark"
          fetchUrl={`${FIN_BASE}/api/backoffice/loaningremarks`}
          getLabel={(i) => i.Description}
          onSelect={(i) => { setRegistrationRemarkId(i.Id); setRegistrationRemarkLabel(i.Description); }}
          onClose={() => setPicker(null)}
        />
      )}
      {picker === "branch" && (
        <EntryPickerModal
          title="Select Branch"
          fetchUrl={`${FIN_BASE}/api/administration/branches/all`}
          getLabel={(i) => i.Description}
          onSelect={(i) => { setBranchId(i.Id); setBranchLabel(i.Description); }}
          onClose={() => setPicker(null)}
        />
      )}
    </div>
  );
}

function DetailDrawer({ requestId, onClose, onChanged }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);

  const fetchDetail = () => {
    setLoading(true);
    getLoanRequest(requestId).then(setData).catch(() => setData(null)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchDetail(); }, [requestId]);

  const handleCancel = async () => {
    const confirm = await Swal.fire({
      title: "Cancel this loan request?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      confirmButtonText: "Cancel Request",
    });
    if (!confirm.isConfirmed) return;
    try {
      await cancelLoanRequest(requestId);
      Swal.fire("Success", "Loan request cancelled.", "success");
      fetchDetail();
      onChanged();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  };

  const handleDelete = async () => {
    const confirm = await Swal.fire({
      title: "Delete this loan request?",
      text: "This permanently removes the record.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      confirmButtonText: "Delete",
    });
    if (!confirm.isConfirmed) return;
    try {
      await deleteLoanRequest(requestId);
      Swal.fire("Success", "Loan request deleted.", "success");
      onChanged();
      onClose();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-[480px] max-h-[85vh] flex flex-col z-10">
        <div className="flex justify-between items-center px-5 py-4 bg-indigo-600 rounded-t-2xl">
          <h3 className="font-bold text-white text-base">Loan Request</h3>
          <button onClick={onClose} className="text-white/70 hover:text-white">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {loading ? (
            <p className="text-sm text-gray-400">Loading...</p>
          ) : data ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Customer</span><span className="font-medium text-gray-800">{data.CustomerFullName}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Loan Product</span><span className="font-medium text-gray-800">{data.LoanProductDescription}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Loan Purpose</span><span className="font-medium text-gray-800">{data.LoanPurposeDescription}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Amount Applied</span><span className="font-medium text-gray-800">{Number(data.AmountApplied).toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Received Date</span><span className="font-medium text-gray-800">{data.ReceivedDate ? new Date(data.ReceivedDate).toLocaleDateString() : "—"}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Reference</span><span className="font-medium text-gray-800">{data.Reference || "—"}</span></div>
              <div className="flex justify-between items-center"><span className="text-gray-500">Status</span><StatusBadge status={data.Status} description={data.StatusDescription} /></div>
              {data.Status === LoanRequestStatus.Registered && (
                <div className="flex justify-between"><span className="text-gray-500">Loan Case</span><span className="font-medium text-gray-800">#{data.PaddedLoanCaseNumber}</span></div>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-400">Not found.</p>
          )}
        </div>
        {data && data.Status === LoanRequestStatus.New && (
          <div className="shrink-0 px-4 py-3 border-t space-y-2">
            <Button onClick={() => setRegistering(true)} className="w-full bg-indigo-600 hover:bg-indigo-700">Register</Button>
            <div className="flex gap-2">
              <Button onClick={handleCancel} variant="outline" className="flex-1 border-amber-300 text-amber-700 hover:bg-amber-50">Cancel Request</Button>
              <Button onClick={handleDelete} variant="outline" className="flex-1 border-red-300 text-red-600 hover:bg-red-50">Delete</Button>
            </div>
          </div>
        )}
        {data && data.Status !== LoanRequestStatus.New && (
          <div className="shrink-0 px-4 py-3 border-t">
            <Button onClick={handleDelete} variant="outline" className="w-full border-red-300 text-red-600 hover:bg-red-50">Delete</Button>
          </div>
        )}
      </div>

      {registering && data && (
        <RegisterDrawer
          request={data}
          onClose={() => setRegistering(false)}
          onDone={() => { fetchDetail(); onChanged(); }}
        />
      )}
    </div>
  );
}

// api/backoffice/loanrequests — docs/api/loan-request-api-spec.md. The
// optional pre-case intake stage before a real LoanCase exists. Ungated:
// no NavigationMenu code exists for this screen anywhere (confirmed via
// grep), so it's routed directly off Loaning rather than through a
// module-permission gate, matching this app's existing ungated-legacy
// page precedent.
export default function LoanRequests() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [selectedId, setSelectedId] = useState(null);
  const pageSize = 20;

  const fetchList = () => {
    setLoading(true);
    listLoanRequests({ text: search, pageIndex, pageSize })
      .then((page) => setItems(page?.pageCollection || page?.PageCollection || []))
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
          <FaFileSignature /> Loan Requests
        </h2>
        <Button onClick={() => navigate("/Loaning/LoanRequests/create")} className="bg-white text-indigo-800 hover:bg-gray-100 flex items-center gap-2">
          <FaPlus /> New Request
        </Button>
      </div>

      <form onSubmit={handleSearch} className="mb-4 flex gap-2 max-w-md">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by reference..." />
        <Button type="submit" variant="outline">Search</Button>
      </form>

      <div className="bg-gray-200 p-4 rounded-sm">
        <div className="grid grid-cols-12 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4 text-sm">
          <span className="col-span-4">Customer</span>
          <span className="col-span-3">Loan Product</span>
          <span className="col-span-2">Amount Applied</span>
          <span className="col-span-3">Status</span>
        </div>

        {loading ? (
          <div className="space-y-2 animate-pulse">{[1, 2, 3].map((i) => <div key={i} className="h-12 bg-gray-100 rounded-lg" />)}</div>
        ) : items.length > 0 ? (
          <div className="space-y-2">
            {items.map((item) => (
              <button key={item.Id} type="button" onClick={() => setSelectedId(item.Id)} className="w-full text-left bg-white rounded-lg shadow-lg border hover:shadow-xl transition-all">
                <div className="grid grid-cols-12 gap-2 items-center py-3 px-6 text-sm">
                  <span className="col-span-4 font-medium text-indigo-700 truncate">{item.CustomerFullName}</span>
                  <span className="col-span-3 text-gray-700 truncate">{item.LoanProductDescription}</span>
                  <span className="col-span-2 text-gray-700">{Number(item.AmountApplied).toLocaleString()}</span>
                  <span className="col-span-3"><StatusBadge status={item.Status} description={item.StatusDescription} /></span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <img src={NotFoundImage} alt="Not Found" className="mx-auto w-42" />
            <p className="text-gray-400 font-medium">No loan requests found.</p>
          </div>
        )}
      </div>

      <div className="flex justify-center items-center gap-3 mt-4">
        <Button disabled={pageIndex === 0} onClick={() => setPageIndex((p) => Math.max(0, p - 1))}>Prev</Button>
        <span className="text-sm text-gray-600">Page {pageIndex + 1}</span>
        <Button disabled={items.length < pageSize} onClick={() => setPageIndex((p) => p + 1)}>Next</Button>
      </div>

      {selectedId && (
        <DetailDrawer requestId={selectedId} onClose={() => setSelectedId(null)} onChanged={fetchList} />
      )}
    </div>
  );
}
