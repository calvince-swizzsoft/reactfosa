import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Swal from "sweetalert2";
import NotFoundImage from "/assets/scopefinding.png";
import {
  FaMoneyCheckAlt, FaPlay, FaLock, FaChevronLeft, FaChevronRight, FaPaperPlane,
} from "react-icons/fa";
import {
  getSalaryPeriod, processSalaryPeriod, closeSalaryPeriod,
  listPaySlips, getPaySlipsSummary, postPaySlip, listBranches, listDepartments,
} from "./lib/api";
import { listSalaryGroups } from "../SalaryGroups/lib/api";
import {
  SalaryPeriodStatus, SALARY_PERIOD_STATUS_BADGE_CLASS, MONTH_LABEL, EMPLOYEE_CATEGORY_LABEL,
  PaySlipStatus, PAYSLIP_STATUS_LABEL, PAYSLIP_STATUS_BADGE_CLASS,
} from "./lib/enums";

const money = (v) => Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function CheckboxList({ title, items, selected, onToggle, required }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
        {title}{required && <span className="text-red-500 ml-1">*</span>}
      </p>
      <div className="max-h-40 overflow-y-auto border rounded-md p-2 space-y-1 bg-white">
        {items.length === 0 ? (
          <p className="text-xs text-gray-400 px-1">None available.</p>
        ) : items.map((item) => (
          <label key={item.Id} className="flex items-center gap-2 px-1 py-0.5 text-sm text-gray-700">
            <input
              type="checkbox"
              className="w-4 h-4 accent-indigo-600"
              checked={selected.has(item.Id)}
              onChange={() => onToggle(item.Id)}
            />
            {item.Description}
          </label>
        ))}
      </div>
    </div>
  );
}

export default function SalaryPeriodDetail() {
  const { id } = useParams();

  const [period, setPeriod] = useState(null);
  const [loading, setLoading] = useState(true);

  const [salaryGroups, setSalaryGroups] = useState([]);
  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedGroups, setSelectedGroups] = useState(new Set());
  const [selectedBranches, setSelectedBranches] = useState(new Set());
  const [selectedDepartments, setSelectedDepartments] = useState(new Set());
  const [processing, setProcessing] = useState(false);
  const [closing, setClosing] = useState(false);

  const [paySlips, setPaySlips] = useState([]);
  const [paySlipsLoading, setPaySlipsLoading] = useState(true);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize] = useState(20);
  const [itemsCount, setItemsCount] = useState(0);
  const [summary, setSummary] = useState(null);
  const [postingIds, setPostingIds] = useState(new Set());

  const load = () => {
    setLoading(true);
    Promise.all([getSalaryPeriod(id), listSalaryGroups({ pageSize: 200 }), listBranches(), listDepartments()])
      .then(([p, groupsPage, branchList, deptList]) => {
        setPeriod(p);
        setSalaryGroups(groupsPage?.PageCollection || groupsPage?.pageCollection || []);
        setBranches(branchList || []);
        setDepartments(deptList || []);
      })
      .catch(() => Swal.fire("Error", "Failed to load salary period.", "error"))
      .finally(() => setLoading(false));
  };

  const loadPaySlips = () => {
    setPaySlipsLoading(true);
    Promise.all([listPaySlips(id, { pageIndex, pageSize }), getPaySlipsSummary(id)])
      .then(([page, sum]) => {
        setPaySlips(page?.PageCollection || page?.pageCollection || []);
        setItemsCount(page?.ItemsCount || page?.itemsCount || 0);
        setSummary(sum);
      })
      .catch(() => { setPaySlips([]); setItemsCount(0); })
      .finally(() => setPaySlipsLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    loadPaySlips();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, pageIndex]);

  const toggle = (setFn) => (itemId) => setFn((prev) => {
    const next = new Set(prev);
    if (next.has(itemId)) next.delete(itemId); else next.add(itemId);
    return next;
  });

  const handleProcess = async () => {
    if (selectedGroups.size === 0) {
      Swal.fire("Missing Selection", "Select at least one Salary Group.", "warning");
      return;
    }

    const confirm = await Swal.fire({
      title: "Process this salary period?",
      text: "This computes and stages payslips for every matching employee. It does not post anything to the G/L yet — that happens per-payslip afterward. Re-running this replaces any already-staged payslips for this period.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#4f46e5",
      confirmButtonText: "Process",
    });
    if (!confirm.isConfirmed) return;

    setProcessing(true);
    try {
      const result = await processSalaryPeriod(id, {
        salaryGroupIds: [...selectedGroups],
        branchIds: selectedBranches.size ? [...selectedBranches] : undefined,
        departmentIds: selectedDepartments.size ? [...selectedDepartments] : undefined,
      });
      Swal.fire("Success", `Processed ${result.EmployeeCount} employee(s) into staged payslips.`, "success");
      loadPaySlips();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setProcessing(false);
    }
  };

  const handleClose = async () => {
    const confirm = await Swal.fire({
      title: "Close this salary period?",
      text: summary && summary.Pending > 0
        ? `${summary.Pending} payslip(s) are still Pending (not posted). Closing does not post them — you can no longer process new payslips into this period afterward.`
        : "You can no longer process new payslips into this period afterward.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      confirmButtonText: "Close Period",
    });
    if (!confirm.isConfirmed) return;

    setClosing(true);
    try {
      await closeSalaryPeriod(id);
      Swal.fire("Success", "Salary period closed.", "success");
      load();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setClosing(false);
    }
  };

  const handlePost = async (paySlip) => {
    const employeeName = `${paySlip.SalaryCardEmployeeCustomerIndividualFirstName ?? ""} ${paySlip.SalaryCardEmployeeCustomerIndividualLastName ?? ""}`.trim();
    const confirm = await Swal.fire({
      title: `Post payslip for ${employeeName || "this employee"}?`,
      text: `This posts real G/L journal entries for a net pay of ${money(paySlip.NetPay)}${period?.ExecutePayoutStandingOrders ? ", and queues their payout standing orders" : ""}. This cannot be undone from here.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      confirmButtonText: "Post",
    });
    if (!confirm.isConfirmed) return;

    setPostingIds((prev) => new Set(prev).add(paySlip.Id));
    try {
      await postPaySlip(paySlip.Id);
      Swal.fire("Posted", "Payslip posted successfully.", "success");
      loadPaySlips();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setPostingIds((prev) => { const next = new Set(prev); next.delete(paySlip.Id); return next; });
    }
  };

  const hasNextPage = itemsCount ? (pageIndex + 1) * pageSize < itemsCount : paySlips.length === pageSize;

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading...</div>;
  }

  if (!period) {
    return (
      <div className="text-center mt-10">
        <img src={NotFoundImage} alt="Not Found" className="mx-auto w-32" />
        <p className="text-gray-400 mt-2">Salary period not found.</p>
      </div>
    );
  }

  const isOpen = period.Status === SalaryPeriodStatus.Open;

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
      <div className="flex items-center justify-between gap-3 mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FaMoneyCheckAlt /> {period.PostingPeriodDescription} — {MONTH_LABEL[period.Month]} ({EMPLOYEE_CATEGORY_LABEL[period.EmployeeCategory]})
        </h2>
        <Link to="/HumanResource/SalaryPeriods" className="text-sm text-white/80 hover:text-white">
          &larr; Back to Salary Periods
        </Link>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <span className={`px-2 py-1 rounded text-xs font-semibold ${SALARY_PERIOD_STATUS_BADGE_CLASS[period.Status] || "bg-gray-100 text-gray-500"}`}>
          {period.StatusDescription}
        </span>
        <span className="text-sm text-gray-500">{period.Remarks}</span>
      </div>

      {isOpen && (
        <div className="bg-gray-100 rounded-lg p-4 mb-8 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Process Salaries</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <CheckboxList title="Salary Groups" items={salaryGroups} selected={selectedGroups} onToggle={toggle(setSelectedGroups)} required />
            <CheckboxList title="Branches (optional)" items={branches} selected={selectedBranches} onToggle={toggle(setSelectedBranches)} />
            <CheckboxList title="Departments (optional)" items={departments} selected={selectedDepartments} onToggle={toggle(setSelectedDepartments)} />
          </div>
          <p className="text-xs text-gray-400">Leaving Branches/Departments unchecked includes every branch/department within the selected Salary Groups.</p>
          <Button onClick={handleProcess} disabled={processing} className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2">
            <FaPlay /> {processing ? "Processing..." : "Process Salaries"}
          </Button>
        </div>
      )}

      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          Payslips {summary && `— ${summary.Total} total, ${summary.Posted} posted, ${summary.Pending} pending`}
        </p>
        {isOpen && (
          <Button size="sm" variant="outline" disabled={closing} onClick={handleClose} className="flex items-center gap-1 text-red-600 border-red-200 hover:bg-red-50">
            <FaLock /> {closing ? "Closing..." : "Close Period"}
          </Button>
        )}
      </div>

      <div className="bg-gray-200 p-4 rounded-sm">
        <div className="grid grid-cols-12 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4">
          <span className="col-span-3">Employee</span>
          <span className="col-span-3">Salary Group</span>
          <span className="col-span-2">Net Pay</span>
          <span className="col-span-2">Status</span>
          <span className="col-span-2 text-right">Actions</span>
        </div>

        {paySlipsLoading ? (
          <div className="space-y-2 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="grid grid-cols-12 gap-2 bg-gray-50 p-6 rounded">
                {Array.from({ length: 12 }).map((_, j) => (
                  <div key={j} className="h-4 bg-gray-200 rounded"></div>
                ))}
              </div>
            ))}
          </div>
        ) : paySlips.length > 0 ? (
          <div className="space-y-2">
            {paySlips.map((slip) => (
              <div key={slip.Id} className="bg-white rounded-lg shadow-lg border">
                <div className="grid grid-cols-12 gap-2 items-center py-3 px-6 hover:shadow-xl transition-all">
                  <span className="col-span-3 font-medium text-indigo-700 truncate">
                    {`${slip.SalaryCardEmployeeCustomerIndividualFirstName ?? ""} ${slip.SalaryCardEmployeeCustomerIndividualLastName ?? ""}`.trim() || "—"}
                  </span>
                  <span className="col-span-3 text-sm text-gray-700 truncate">{slip.SalaryCardSalaryGroupDescription || "—"}</span>
                  <span className="col-span-2 text-sm font-semibold text-gray-800">{money(slip.NetPay)}</span>
                  <span className="col-span-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${PAYSLIP_STATUS_BADGE_CLASS[slip.Status] || "bg-gray-100 text-gray-500"}`}>
                      {PAYSLIP_STATUS_LABEL[slip.Status] || "—"}
                    </span>
                  </span>
                  <div className="col-span-2 flex justify-end">
                    {slip.Status === PaySlipStatus.Pending ? (
                      <Button
                        size="sm"
                        disabled={postingIds.has(slip.Id)}
                        onClick={() => handlePost(slip)}
                        className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-1"
                      >
                        <FaPaperPlane /> Post
                      </Button>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-center py-4">
            <p className="font-medium text-gray-400">No payslips yet — process the period above to stage them.</p>
          </div>
        )}

        <div className="flex justify-center items-center mt-4">
          <Button type="button" size="sm" disabled={pageIndex === 0} onClick={() => setPageIndex((p) => Math.max(0, p - 1))} className="flex items-center gap-1 m-2">
            <FaChevronLeft /> Prev
          </Button>
          <span>Page {pageIndex + 1}</span>
          <Button type="button" size="sm" disabled={!hasNextPage} onClick={() => setPageIndex((p) => p + 1)} className="flex items-center gap-1 m-2">
            Next <FaChevronRight />
          </Button>
        </div>
      </div>
    </div>
  );
}
