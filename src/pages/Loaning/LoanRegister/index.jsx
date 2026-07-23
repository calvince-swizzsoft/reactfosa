import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { Button } from "flowbite-react";
import LoanCaseDetailsDrawer from "./LoanCaseDetailsDrawer";
import LoanScheduleDrawer from "./LoanScheduleDrawer";

export default function LoanRegister() {
  const [loans, setLoans] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [openDrawer, setOpenDrawer] = useState(false);
  const [scheduleLoan, setScheduleLoan] = useState(null);
  const [openSchedule, setOpenSchedule] = useState(false);
  const [balanceStatus, setBalanceStatus] = useState("");


  useEffect(() => {
    fetch(`${import.meta.env.VITE_APP_LOANING_URL}/api/Loaning/getallloans`)
      .then((r) => r.json())
      .then((d) => setLoans(Array.isArray(d) ? d : d.Data || []))
      .catch(() => Swal.fire("Error", "Failed to load loans", "error"));
  }, []);



  const filtered = useMemo(() => {
    const s = search.toLowerCase();

    return loans.filter((l) => {
      const matchesSearch =
        !search ||
        `${l.CustomerIndividualFirstName} ${l.CustomerIndividualLastName}
       ${l.CustomerIndividualIdentityCardNumber}
       ${l.PaddedCaseNumber}
       ${l.LoanProductDescription}`
          .toLowerCase()
          .includes(s);

      const balance = Number(l.TotalLoansBalance || 0);

      const matchesStatus =
        !balanceStatus ||
        (balanceStatus === "cleared" && balance <= 0) ||
        (balanceStatus === "outstanding" && balance > 0);

      return matchesSearch && matchesStatus;
    });
  }, [loans, search, balanceStatus]);

  const fmt = (n) =>
    Number(n || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <div className="min-h-screen bg-gray-50 py-4 m-5 rounded-lg">
      {/* Header */}
      <div className="bg-indigo-800 rounded-xl shadow p-4 max-w-6xl m-4">
        <h1 className="text-2xl font-bold text-gray-50">Loan Register</h1>
        <p className="text-gray-200">All loans with full details</p>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow p-4 max-w-6xl mx-auto m-4 flex flex-col md:flex-row gap-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search member | ID | case | product"
          className="w-full p-3 border rounded flex-2/3"
        />
        <select
          value={balanceStatus}
          onChange={(e) => setBalanceStatus(e.target.value)}
          className="w-full md:w-1/4 p-3 border rounded flex-1/3"
        >
          <option value="">All Loans</option>
          <option value="cleared">Cleared</option>
          <option value="outstanding">Outstanding</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow p-4 max-w-6xl mx-auto overflow-x-auto">
        <table className="min-w-full text-sm border">
          <thead className="bg-slate-800 text-white">
            <tr>
              <th className="p-2">Case</th>
              <th className="p-2">Member</th>
              <th className="p-2">ID</th>
              <th className="p-2">Product</th>
              <th className="p-2 text-right">Applied</th>
              <th className="p-2 text-right">Balance</th>
              <th className="p-2">Rate %</th>
              <th className="p-2">Status</th>
              <th className="p-2"></th>
              <th className="p-2"></th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((l, i) => (
              <tr
                key={l.Id}

                className={`cursor-pointer ${i % 2 ? "bg-indigo-50" : ""
                  } hover:bg-indigo-200`}
              >
                <td className="p-2">{l.PaddedCaseNumber}</td>
                <td className="p-2">
                  {l.CustomerIndividualFirstName}{" "}
                  {l.CustomerIndividualLastName}
                </td>
                <td className="p-2">
                  {l.CustomerIndividualIdentityCardNumber}
                </td>
                <td className="p-2">{l.LoanProductDescription}</td>
                <td className="p-2 text-right">{fmt(l.AmountApplied)}</td>

                <td className="p-2 text-right font-medium">
                  {Number(l.TotalLoansBalance) <= 0 ? (
                    <span className="text-green-600 font-semibold">
                      Cleared
                    </span>
                  ) : (
                    fmt(l.TotalLoansBalance)
                  )}
                </td>
                <td className="p-2">
                  {l.LoanInterestAnnualPercentageRate}
                </td>
                <td className="p-2">{l.StatusDescription}</td>
                <td>

                  <Button
                    size="xs"
                    className="bg-gray-500"
                    onClick={() => {
                      setSelectedLoan(l);
                      setOpenDrawer(true);
                    }}
                  >
                    View Detail
                  </Button>
                </td>

                <td className="p-2">
                  <Button
                    size="xs"
                    className="bg-gray-500"
                    onClick={(e) => {
                      e.stopPropagation();
                      setScheduleLoan(l);
                      setOpenSchedule(true);
                    }}
                  >
                    View Schedule
                  </Button>
                </td>

              </tr>
            ))}
          </tbody>
        </table>
        {filtered <= 0 && <div className="flex justify-center items-center w-full text-semibold"><h1>Loading...</h1></div>}
      </div>

      {/* Drawer */}
      <LoanCaseDetailsDrawer
        open={openDrawer}
        loan={selectedLoan}
        onClose={() => setOpenDrawer(false)}
      />
      <LoanScheduleDrawer
        open={openSchedule}
        loan={scheduleLoan}
        onClose={() => setOpenSchedule(false)}
      />

    </div>
  );
}
