import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Swal from "sweetalert2";
import NotFoundImage from "/assets/scopefinding.png";
import LoanDetailsDrawer from "./LoanDetailsDrawer";
import LoanGuarantorsDrawer from "./LoanGuarantorsDrawer";

export default function LoanApproved() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(null);
  const [refresh, setRefresh] = useState(true);
  const [pageIndex, setPageIndex] = useState(0);
  const [previewAmounts, setPreviewAmounts] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [bankAccounts, setBankAccounts] = useState([]);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [showGuarantors, setShowGuarantors] = useState(false);
  const [selectedLoanCaseId, setSelectedLoanCaseId] = useState(null);

  const pageSize = 10;

  // Fetch banks
  useEffect(() => {
    const fetchBanks = async () => {
      try {
        const res = await fetch(
          "http://88.99.215.90:8600/api/values/getBankWithLinkages",
          { headers: { "ngrok-skip-browser-warning": "true" } }
        );
        const data = await res.json();
        if (data.Success) setBankAccounts(data.Data);
      } catch (err) {
        console.error("Failed to load banks", err);
      }
    };
    fetchBanks();
  }, []);

  // Fetch loans
  const fetchLoanDrafts = () => {
    setLoading(true);
    fetch(
      `${import.meta.env.VITE_APP_LOANING_URL}/api/Loaning/GetLoansBy?status=Approved&filterType=1&pageIndex=${pageIndex}&pageSize=${pageSize}`,
      { headers: { "ngrok-skip-browser-warning": "true" } }
    )
      .then((res) => res.json())
      .then((data) => {
        setLoans(data.items || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchLoanDrafts();
  }, [refresh, pageIndex]);

  // Fetch preview amounts
  const fetchPreviewAmount = async (loanId) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_APP_LOANING_URL}/api/LoanDisbursement/Preview?loanCaseID=${loanId}`,
        { headers: { "ngrok-skip-browser-warning": "true" } }
      );
      const result = await res.json();
      if (result?.success) {
        setPreviewAmounts((prev) => ({
          ...prev,
          [loanId]: result.data,
        }));
      }
    } catch {
      console.error("Preview fetch failed", loanId);
    }
  };

  useEffect(() => {
    loans.forEach((l) => fetchPreviewAmount(l.Id));
  }, [loans]);






  // Disbursement modal
  // const handleDisbursement = async (loanCaseId) => {
  //   const preview = previewAmounts[loanCaseId];
  //   if (!preview) {
  //     Swal.fire("Error", "Preview amounts not available", "error");
  //     return;
  //   }

  //   const bankOptions = bankAccounts.reduce((acc, b) => {
  //     acc[b.Id] = `${b.BankName} - ${b.BankAccountNumber}`;
  //     return acc;
  //   }, {});

  //   const { value: formValues } = await Swal.fire({
  //     title: "Loan Disbursement",
  //     html: `
  //       <div style="text-align:left; font-size:14px; line-height:1.5">
  //           <label class="swal2-label">Bank Account:</label>
  //           <select id="swal-bank" class="swal2-input">
  //               ${Object.entries(bankOptions)
  //         .map(([id, name]) => `<option value="${id}">${name}</option>`)
  //         .join("")}
  //           </select>

  //           <label class="swal2-label mt-2">Disbursement Date:</label>
  //           <input type="date" id="swal-date" class="swal2-input" value="${new Date()
  //         .toISOString()
  //         .split("T")[0]}"/>

  //           <hr class="my-3"/>

  //           <div style="margin-top:10px">
  //               <b>Loan Type:</b> ${preview.LoanCase}<br/>
  //               <b>Member:</b> ${preview.Memberfullname}<br/>
  //               <b>Loan Applied:</b> <span style="color:#1f2937">KES ${preview.LoanAmountApplied.toLocaleString()}</span><br/>
  //               <b>Settlement:</b> KES ${preview.SettlementAmount.toLocaleString()}<br/>
  //               <b>Top-Up:</b> KES ${preview.TopUpAmount.toLocaleString()}<br/>
  //               <b>Boost Principal:</b> KES ${preview.BoostPrincipal.toLocaleString()}<br/>
  //               <b>Boost Interest:</b> KES ${preview.BoostInterest.toLocaleString()}<br/>
  //               <b style="color:green">Bank Disbursement:</b> KES ${preview.BankDisbursement.toLocaleString()}<br/>
  //           </div>
  //       </div>
  //     `,
  //     focusConfirm: false,
  //     preConfirm: () => {
  //       const bankId = document.getElementById("swal-bank").value;
  //       const date = document.getElementById("swal-date").value;
  //       if (!bankId) Swal.showValidationMessage("Bank is required");
  //       if (!date) Swal.showValidationMessage("Date is required");
  //       return { bankId, date };
  //     },
  //     showCancelButton: true,
  //     confirmButtonText: "Disburse Loan",
  //   });

  //   if (!formValues) return;

  //   setSubmitting(loanCaseId);

  //   const payload = {
  //     caseNumber: 0,
  //     loanCaseID: loanCaseId,
  //     action: 1,
  //     disbursedBy: "system",
  //     disbursmentDate: new Date(formValues.date).toISOString(),
  //     bankAccountId: formValues.bankId,
  //   };

  //   try {
  //     const res = await fetch(
  //       `${import.meta.env.VITE_APP_LOANING_URL}/api/LoanDisbursement`,
  //       {
  //         method: "POST",
  //         headers: {
  //           "Content-Type": "application/json",
  //           "ngrok-skip-browser-warning": "true",
  //         },
  //         body: JSON.stringify(payload),
  //       }
  //     );

  //     const msg = await res.json();
  //     if (res.ok || msg.Success) {
  //       Swal.fire("Success", msg.Message || "Loan disbursed", "success");
  //       setRefresh((r) => !r);
  //     } else {
  //       Swal.fire("Error", msg.Message || "Failed", "error");
  //     }
  //   } catch {
  //     Swal.fire("Error", "Disbursement failed", "error");
  //   } finally {
  //     setSubmitting(null);
  //   }
  // };







  const handleDisbursement = async (loanCaseId) => {
    const preview = previewAmounts[loanCaseId];
    if (!preview) {
      Swal.fire("Error", "Preview amounts not available", "error");
      return;
    }

    const bankOptions = bankAccounts.reduce((acc, b) => {
      acc[b.Id] = `${b.BankName} - ${b.BankAccountNumber}`;
      return acc;
    }, {});

    const { value: formValues } = await Swal.fire({
      title: "Loan Disbursement",
      html: `
      <div class="p-2">
        <div class="mb-4">
          <label class="swal2-label font-semibold mb-1">Bank Account</label>
          <select id="swal-bank" class="swal2-input border rounded-lg px-3 py-2">
            ${Object.entries(bankOptions)
          .map(([id, name]) => `<option value="${id}">${name}</option>`)
          .join("")}
          </select>
        </div>

        <div class="mb-4">
          <label class="swal2-label font-semibold mb-1">Disbursement Date</label>
          <input type="date" id="swal-date" class="swal2-input border rounded-lg px-3 py-2" value="${new Date().toISOString().split("T")[0]}"/>
        </div>

        <hr class="my-3 border-gray-300"/>

        <div class="mt-4 p-4 bg-gray-50 rounded-lg shadow-inner text-sm">
          <h3 class="font-semibold text-indigo-700 mb-2">Loan Preview</h3>
          <div class="grid grid-cols-2 gap-2">
            <span class="font-medium">Loan Type:</span> <span>${preview.LoanCase}</span>
            <span class="font-medium">Member:</span> <span>${preview.Memberfullname}</span>
            <span class="font-medium">Loan Applied:</span> <span class="text-gray-800">KES ${preview.LoanAmountApplied.toLocaleString()}</span>
            <span class="font-medium">Settlement:</span> <span>KES ${preview.SettlementAmount.toLocaleString()}</span>
            <span class="font-medium">Top-Up:</span> <span>KES ${preview.TopUpAmount.toLocaleString()}</span>
            <span class="font-medium">Boost Principal:</span> <span>KES ${preview.BoostPrincipal.toLocaleString()}</span>
            <span class="font-medium">Boost Interest:</span> <span>KES ${preview.BoostInterest.toLocaleString()}</span>
            <span class="font-medium text-green-700">Bank Disbursement:</span> <span class="text-green-700 font-semibold">KES ${preview.BankDisbursement.toLocaleString()}</span>
            <span class="font-medium text-blue-700">Affected Loan Accounts:</span> <span class="text-blue-700 font-semibold"> ${preview.AffectedGLs.LoanAccountGL}</span>
            <span class="font-medium text-blue-700">Affected Bank GL:</span> <span class="text-blue-700 font-semibold"> ${preview.AffectedGLs.BankGL}</span>
            <span class="font-medium text-blue-700">Affected Savings Accounts:</span> <span class="text-blue-700 font-semibold"> ${preview.AffectedGLs.SavingsGL}</span>
          </div>
        </div>
      </div>
    `,
      focusConfirm: false,
      preConfirm: () => {
        const bankId = document.getElementById("swal-bank").value;
        const date = document.getElementById("swal-date").value;
        if (!bankId) Swal.showValidationMessage("Bank is required");
        if (!date) Swal.showValidationMessage("Date is required");
        return { bankId, date };
      },
      showCancelButton: true,
      confirmButtonText: "Disburse Loan",
      cancelButtonText: "Cancel",
      customClass: {
        popup: "rounded-xl shadow-xl max-w-lg w-full p-6",
        confirmButton: "bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg",
        cancelButton: "bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg",
      },
    });

    if (!formValues) return;

    setSubmitting(loanCaseId);

    const payload = {
      caseNumber: 0,
      loanCaseID: loanCaseId,
      action: 1,
      disbursedBy: "system",
      disbursmentDate: new Date(formValues.date).toISOString(),
      bankAccountId: formValues.bankId,
    };

    try {
      const res = await fetch(`${import.meta.env.VITE_APP_LOANING_URL}/api/LoanDisbursement`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "true" },
        body: JSON.stringify(payload),
      });

      const msg = await res.json();
      if (res.ok || msg.Success) {
        Swal.fire("Success", msg.Message || "Loan disbursed", "success");
        setRefresh((r) => !r);
      } else {
        Swal.fire("Error", msg.Message || "Failed", "error");
      }
    } catch {
      Swal.fire("Error", "Disbursement failed", "error");
    } finally {
      setSubmitting(null);
    }
  };





  // Filter loans
  const filteredLoans = loans.filter((l) => {
    const t = searchTerm.toLowerCase();
    return (
      l.CaseNumber?.toString().includes(t) ||
      `${l.CustomerIndividualFirstName} ${l.CustomerIndividualLastName}`
        .toLowerCase()
        .includes(t)
    );
  });

  return (
    <div className="bg-white py-8 rounded-xl ">
      {/* Search + Refresh */}
      <div className="flex justify-between items-center mb-6">
        <input
          placeholder="Search by loan no, customer, branch, status..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-1/3 px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <Button
          size="sm"
          variant="outline"
          className="bg-gray-700 text-white hover:bg-gray-800"
          onClick={() => setRefresh(!refresh)}
        >
          Refresh
        </Button>
      </div>

      {/* Loan Grid */}
      <div className="overflow-x-auto bg-gray-200 p-3 rounded-2xl">
        <div className="grid grid-cols-12 gap-4 bg-gray-800 text-gray-100 font-semibold p-3 rounded-lg mb-3 text-sm">
          <span className="col-span-1">Loan No.</span>
          <span className="col-span-2">Customer</span>
          <span className="col-span-2">Branch</span>
          <span className="col-span-2">Status</span>
          <span className="col-span-2">Amount</span>
          {/* <span className="col-span-2">Preview Amount</span> */}
          <span className="col-span-2 text-right">Actions</span>
        </div>

        {loading ? (
          <div className="space-y-2 animate-pulse">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="grid grid-cols-6 gap-2 bg-gray-100 py-4 px-6 rounded"
              >
                {Array.from({ length: 6 }).map((__, j) => (
                  <div key={j} className="h-4 bg-gray-200 rounded"></div>
                ))}
              </div>
            ))}
          </div>
        ) : filteredLoans.length ? (
          filteredLoans.map((loan) => (
            <div
              key={loan.Id}
              className="bg-white rounded-lg shadow-md border hover:shadow-xl transition-all mb-2"
            >
              <div className="grid grid-cols-12 gap-2 items-center py-4 px-6">
                <span className="font-medium text-indigo-700 col-span-1">
                  {loan.CaseNumber.toString().padStart(7, "0")}
                </span>
                <span className="col-span-2">
                  {loan.CustomerIndividualFirstName} {loan.CustomerIndividualLastName}
                </span>
                <span className="col-span-2">{loan.BranchDescription}</span>
                <span className="col-span-2 text-center">
                  <span className="px-2 py-1 rounded-full text-white text-xs bg-gray-500">
                    {loan.StatusDescription}
                  </span>
                </span>
                <span className="font-semibold col-span-2">
                  Ksh {loan.AmountApplied.toLocaleString()}
                </span>
                {/* <span className="font-semibold col-span-2 text-green-700">
                  Ksh {previewAmounts[loan.Id]?.BankDisbursement?.toLocaleString() || "-"}
                </span> */}

                <div className="flex gap-2 col-span-2 justify-end">
                  <Button
                    size="sm"
                    variant="default"
                    className="bg-indigo-600 text-white hover:bg-indigo-700"
                    onClick={() => handleDisbursement(loan.Id)}
                    disabled={submitting === loan.Id}
                  >
                    {submitting === loan.Id ? "Processing..." : "Disburse"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-green-700 text-white hover:bg-green-800"
                    onClick={() => {
                      setSelectedLoanCaseId(loan.Id);
                      setShowGuarantors(true);
                    }}
                  >
                    Guarantors
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-gray-700 text-white hover:bg-gray-800"
                    onClick={() => {
                      setSelectedLoan(loan);
                      setDetailsOpen(true);
                    }}
                  >
                    Details
                  </Button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-gray-400 mt-6">
            <img src={NotFoundImage} className="mx-auto w-40" />
            <p className="mt-2 font-medium">No Approved Loans Found.</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex justify-between mt-4">
        <Button
          size="sm"
          variant="outline"
          disabled={pageIndex === 0}
          onClick={() => setPageIndex(pageIndex - 1)}
        >
          Previous
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setPageIndex(pageIndex + 1)}
        >
          Next
        </Button>
      </div>

      {/* Drawers */}
      <LoanDetailsDrawer
        open={detailsOpen}
        loan={selectedLoan}
        onClose={() => setDetailsOpen(false)}
      />
      <LoanGuarantorsDrawer
        open={showGuarantors}
        loanCaseId={selectedLoanCaseId}
        onClose={() => setShowGuarantors(false)}
      />
    </div>
  );
}
