import { useState } from "react";
import { Button } from "@/components/ui/button";
import Swal from "sweetalert2";
import { FaSearch, FaCalendarTimes } from "react-icons/fa";
import { closePostingPeriod, POSTING_PERIODS_BASE } from "../PostingPeriods/api";
import EntryPickerModal from "@/pages/Accounts/BatchProcedures/lib/EntryPickerModal";

const formatDate = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
};

// Per Areas/Accounts/Posting Periods.md's "How to close a posting period":
// look up a period, its dates populate automatically (read-only), Update
// closes it. This is a real, irreversible financial operation — closing
// posts fiscal-period-closing journals against every income/expense G/L
// account across every branch (PostingPeriodAppService.ClosePostingPeriod)
// — so this asks for an explicit destructive confirmation before calling
// the close endpoint, matching this app's confirmButtonColor: "#dc2626"
// convention for actions that can't be undone from the UI.
export default function PostingPeriodClosing() {
  const [period, setPeriod] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [closing, setClosing] = useState(false);

  const handleClose = async () => {
    if (!period) {
      Swal.fire("Missing Field", "Look up and select the posting period to close.", "warning");
      return;
    }
    if (period.IsClosed) {
      Swal.fire("Already Closed", "This posting period is already closed.", "info");
      return;
    }

    const confirm = await Swal.fire({
      title: "Close this posting period?",
      html: `This posts fiscal-period-closing journal entries against every income and expense account, across every branch, for <b>${period.Description}</b>. This cannot be undone from this screen.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      confirmButtonText: "Close Period",
    });
    if (!confirm.isConfirmed) return;

    setClosing(true);
    try {
      const updated = await closePostingPeriod(period.Id);
      Swal.fire("Success", "Posting period closed successfully.", "success");
      setPeriod(updated);
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setClosing(false);
    }
  };

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
      <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FaCalendarTimes /> Posting Period Closing
        </h2>
      </div>

      <div className="max-w-xl space-y-4">
        <div>
          <label className="text-sm font-semibold text-gray-700">Posting Period</label>
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="w-full flex items-center justify-between rounded-md border border-gray-300 py-2 px-3 text-sm text-left hover:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <span className={period ? "text-gray-800" : "text-gray-400"}>
              {period ? period.Description : "Look up posting period..."}
            </span>
            <FaSearch className="text-gray-400" />
          </button>
        </div>

        {period && (
          <div className="bg-gray-100 rounded-lg p-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Created Date</p>
              <p className="text-gray-800">{formatDate(period.CreatedDate)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Status</p>
              <p className="text-gray-800">{period.IsClosed ? "Closed" : period.IsActive ? "Active" : "Inactive"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Start Date</p>
              <p className="text-gray-800">{formatDate(period.DurationStartDate)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">End Date</p>
              <p className="text-gray-800">{formatDate(period.DurationEndDate)}</p>
            </div>
          </div>
        )}

        <Button onClick={handleClose} disabled={!period || closing || period?.IsClosed} className="bg-indigo-600 hover:bg-indigo-700">
          {closing ? "Closing..." : "Update"}
        </Button>
      </div>

      {pickerOpen && (
        <EntryPickerModal
          title="Select Posting Period"
          fetchUrl={POSTING_PERIODS_BASE}
          getLabel={(p) => p.Description}
          getSublabel={(p) => (p.IsClosed ? "Closed" : p.IsActive ? "Active" : "Inactive")}
          onSelect={setPeriod}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}
