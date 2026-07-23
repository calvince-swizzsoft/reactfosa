// import { useState, useEffect } from "react";
// import { Button } from "@/components/ui/button";
// import Swal from "sweetalert2";
// import { FaSun } from "react-icons/fa";

// //const BASE = "https://rubani.ngrok.io";
// const BASE = `${import.meta.env.VITE_APP_FIN_URL}`

// export default function EndOfDay() {
//   const [loading, setLoading] = useState(false);
//   const [loadingData, setLoadingData] = useState(true);
//   const [employeeId, setEmployeeId] = useState("");
//   const [openingBalance, setOpeningBalance] = useState("");

//   useEffect(() => {
//     const fetchDefaults = async () => {
//       setLoadingData(true);
//       try {
//         const [employeeRes, tellerRes] = await Promise.all([
//           fetch(`${BASE}/api/employees`),
//           fetch(`${BASE}/api/tellers`),
//         ]);

//         const [employees, tellers] = await Promise.all([
//           employeeRes.ok ? employeeRes.json().catch(() => []) : [],
//           tellerRes.ok ? tellerRes.json().catch(() => []) : [],
//         ]);

//         const employeeList = Array.isArray(employees) ? employees : [];
//         const tellerList = Array.isArray(tellers) ? tellers : [];

//         if (employeeList.length > 0) {
//           setEmployeeId(employeeList[0].Id || "");
//         }

//         if (tellerList.length > 0) {
//           const opening = tellerList[0].OpeningBalance ?? tellerList[0].openingBalance ?? tellerList[0].BookBalance ?? "";
//           setOpeningBalance(opening);
//         }
//       } catch {
//         // Use fallback values if API calls fail.
//       } finally {
//         setLoadingData(false);
//       }
//     };

//     fetchDefaults();
//   }, []);

//   const handleRunEndOfDay = async () => {
//     const confirm = await Swal.fire({
//       title: "Run End of Day Process?",
//       text: "This will close the current business day. This action cannot be undone.",
//       icon: "warning",
//       showCancelButton: true,
//       confirmButtonColor: "#4f46e5",
//       cancelButtonColor: "#6b7280",
//       confirmButtonText: "Yes, Run End of Day",
//       cancelButtonText: "Cancel",
//     });

//     if (!confirm.isConfirmed) return;

//     setLoading(true);
//     try {
//       const payload = {
//         EmployeeId: employeeId || "50BDE4A6-1F50-F111-9B87-C8E2651EF92A",
//         TotalDebits: 300,
//         TotalCredits: 400,
//         OpeningBalance: openingBalance
//           ? String(openingBalance)
//           : "F1A1A4C4-4444-4A11-ACED-3F9E52C4E555",
//       };

//       const res = await fetch(`${BASE}/api/endofday`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(payload),
//       });
//       const data = await res.json().catch(() => ({}));
//       if (!res.ok) throw new Error(data.message || "End of Day process failed");
//       Swal.fire({
//         title: "End of Day Complete",
//         text: data.message || "The end of day process has been completed successfully.",
//         icon: "success",
//       });
//     } catch (err) {
//       Swal.fire("Error", err.message, "error");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const displayEmployeeId = employeeId || "50BDE4A6-1F50-F111-9B87-C8E2651EF92A";
//   const displayOpeningBalance = openingBalance
//     ? String(openingBalance)
//     : "F1A1A4C4-4444-4A11-ACED-3F9E52C4E555";

//   return (
//     <div className="max-w-5xl mx-auto px-4 py-16">
//       <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr] items-start">
//         <section className="space-y-6 rounded-3xl bg-white p-10 shadow-lg border border-slate-200">
//           <div className="flex items-center gap-4">
//             <div className="rounded-full bg-indigo-100 p-5 text-indigo-600">
//               <FaSun className="h-8 w-8" />
//             </div>
//             <div>
//               <p className="text-sm uppercase tracking-[0.2em] text-indigo-600 font-semibold">Daily Close</p>
//               <h1 className="text-3xl font-bold text-slate-900">End of Day Process</h1>
//             </div>
//           </div>

//           <div className="space-y-3 text-slate-600">
//             <p className="text-sm leading-7">
//               This process finalizes the current business day and posts the end-of-day totals to the system.
//               Once run, it will close the day and update balances accordingly.
//             </p>
//             <p className="text-sm leading-7">
//               The request payload is prepared automatically using the current teller opening balance and available employee defaults.
//             </p>
//           </div>

//           <div className="grid gap-4 sm:grid-cols-2">
//             <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
//               <p className="text-sm text-slate-500">Employee ID</p>
//               <p className="mt-2 font-medium text-slate-900 break-all">{displayEmployeeId}</p>
//             </div>
//             <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
//               <p className="text-sm text-slate-500">Opening Balance</p>
//               <p className="mt-2 font-medium text-slate-900 break-all">{displayOpeningBalance}</p>
//             </div>
//           </div>

//           <div className="grid gap-4 sm:grid-cols-2">
//             <div className="rounded-2xl border border-slate-200 bg-white p-5">
//               <p className="text-sm text-slate-500">Total Debits</p>
//               <p className="mt-2 text-2xl font-semibold text-slate-900">300</p>
//             </div>
//             <div className="rounded-2xl border border-slate-200 bg-white p-5">
//               <p className="text-sm text-slate-500">Total Credits</p>
//               <p className="mt-2 text-2xl font-semibold text-slate-900">400</p>
//             </div>
//           </div>

//           <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
//             <p className="text-sm font-semibold text-slate-700">Payload preview</p>
//             <pre className="mt-3 overflow-x-auto rounded-xl bg-slate-900 px-4 py-4 text-xs text-slate-100">
//               {JSON.stringify({
//                 EmployeeId: displayEmployeeId,
//                 TotalDebits: 300,
//                 TotalCredits: 400,
//                 OpeningBalance: displayOpeningBalance,
//               }, null, 2)}
//             </pre>
//           </div>
//         </section>

//         <aside className="rounded-3xl bg-slate-950 p-8 text-slate-100 shadow-lg">
//           <p className="text-sm uppercase tracking-[0.2em] text-emerald-300">Ready to Run</p>
//           <h2 className="mt-4 text-2xl font-semibold">Complete the daily close</h2>
//           <p className="mt-4 text-sm leading-7 text-slate-300">
//             This action will submit the end of day totals to the backend. Make sure all transactions have been posted and reconciled before continuing.
//           </p>

//           <div className="mt-8 space-y-4">
//             <div className="rounded-2xl bg-slate-900 p-4">
//               <p className="text-sm text-slate-400">Status</p>
//               <p className="mt-2 text-lg font-semibold">{loadingData ? "Loading defaults..." : "Ready to submit"}</p>
//             </div>
//             <div className="rounded-2xl bg-slate-900 p-4">
//               <p className="text-sm text-slate-400">Action required</p>
//               <p className="mt-2 text-lg font-semibold">{loading ? "Processing end of day" : "Confirm and run"}</p>
//             </div>
//           </div>

//           <div className="mt-10">
//             <Button
//               onClick={handleRunEndOfDay}
//               disabled={loading || loadingData}
//               className="w-full bg-emerald-500 hover:bg-emerald-600 px-6 py-4 text-base font-semibold"
//             >
//               {loading ? (
//                 <>
//                   <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
//                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
//                   </svg>
//                   Processing...
//                 </>
//               ) : (
//                 "Run End of Day Process"
//               )}
//             </Button>
//           </div>
//         </aside>
//       </div>
//     </div>
//   );
// }







import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Swal from "sweetalert2";
import { FaSun } from "react-icons/fa";

// const BASE = "https://rubani.ngrok.io";
const BASE = `${import.meta.env.VITE_APP_FIN_URL}`;

export default function EndOfDay() {
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const [employees, setEmployees] = useState([]);
  const [tellers, setTellers] = useState([]);

  const [employeeId, setEmployeeId] = useState("");
  const [openingBalance, setOpeningBalance] = useState("");

  const [totalDebits, setTotalDebits] = useState(300);
  const [totalCredits, setTotalCredits] = useState(400);

  const amount = Number(totalCredits) - Number(totalDebits);

  useEffect(() => {
    const fetchData = async () => {
      setLoadingData(true);

      try {
        const [employeeRes, tellerRes] = await Promise.all([
          fetch(`${BASE}/api/employees`),
          fetch(`${BASE}/api/tellers`),
        ]);

        const [employeeData, tellerData] = await Promise.all([
          employeeRes.ok ? employeeRes.json() : [],
          tellerRes.ok ? tellerRes.json() : [],
        ]);

        const employeeList = Array.isArray(employeeData)
          ? employeeData
          : [];

        const tellerList = Array.isArray(tellerData)
          ? tellerData
          : [];

        setEmployees(employeeList);
        setTellers(tellerList);

        // Set defaults
        if (employeeList.length > 0) {
          setEmployeeId(employeeList[0].Id);
        }

        if (tellerList.length > 0) {
          setOpeningBalance(
            tellerList[0].OpeningBalance ||
            tellerList[0].openingBalance ||
            tellerList[0].BookBalance ||
            ""
          );
        }
      } catch (error) {
        console.error("Failed to fetch dropdown data", error);
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, []);

  const handleRunEndOfDay = async () => {
    if (!employeeId) {
      return Swal.fire(
        "Validation Error",
        "Please select an employee",
        "warning"
      );
    }

    if (!openingBalance) {
      return Swal.fire(
        "Validation Error",
        "Please select opening balance",
        "warning"
      );
    }

    const confirm = await Swal.fire({
      title: "Run End of Day Process?",
      text: "This will close the current business day.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#4f46e5",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, Run End of Day",
    });

    if (!confirm.isConfirmed) return;

    setLoading(true);

    try {
      const payload = {
        EmployeeId: employeeId,
        TotalDebits: Number(totalDebits),
        TotalCredits: Number(totalCredits),
        Amount: amount,
        OpeningBalance: String(openingBalance),
      };

      console.log("End of Day Payload:", payload);

      const res = await fetch(`${BASE}/api/endofday`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      console.log("End of Day Response:", data);

      if (!res.ok) {
        throw new Error(
          data.message || "End of Day process failed"
        );
      }

      Swal.fire({
        title: "Success",
        text:
          data.message ||
          "End of day completed successfully",
        icon: "success",
      });
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <section className="space-y-6 rounded-3xl bg-white p-10 shadow-lg border border-slate-200">
        <div className="flex items-center gap-4">
          <div className="rounded-full bg-indigo-100 p-5 text-indigo-600">
            <FaSun className="h-8 w-8" />
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-indigo-600 font-semibold">Daily Close</p>
            <h1 className="text-3xl font-bold text-slate-900">End of Day Process</h1>
          </div>
        </div>

        {/* Select Inputs */}
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Employee</label>
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select Employee</option>
              {employees.map((employee) => (
                <option key={employee.Id} value={employee.Id}>
                  {employee.Customer.IndividualFirstName + " " + employee.Customer.IndividualLastName || employee.Id}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Opening Balance</label>
            <select
              value={openingBalance}
              onChange={(e) => setOpeningBalance(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select Opening Balance</option>
              {tellers.map((teller, index) => {
                const balance = teller.OpeningBalance || teller.openingBalance || teller.BookBalance;
                return <option key={index} value={balance}>{balance}</option>;
              })}
            </select>
          </div>
        </div>

        {/* Totals */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Total Debits</p>
            <input
              type="number"
              value={totalDebits}
              onChange={(e) => setTotalDebits(e.target.value)}
              className="mt-2 w-full rounded-xl border p-3"
            />
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Total Credits</p>
            <input
              type="number"
              value={totalCredits}
              onChange={(e) => setTotalCredits(e.target.value)}
              className="mt-2 w-full rounded-xl border p-3"
            />
          </div>
        </div>

        {/* Net Amount */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-sm text-slate-500">Amount (Credits − Debits)</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{amount}</p>
        </div>

        <Button
          onClick={handleRunEndOfDay}
          disabled={loading || loadingData}
          className="w-full bg-indigo-600 hover:bg-indigo-700 py-4 text-base font-semibold"
        >
          {loading ? "Processing..." : "Run End of Day Process"}
        </Button>
      </section>
    </div>
  );
}