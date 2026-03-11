import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import NotFoundImage from "/assets/scopefinding.png";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function AccountDrawer({ account, open, onClose }) {
  const [transactions, setTransactions] = useState([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState("");
  const [loadingTx, setLoadingTx] = useState(false);
  const [debitTotal, setDebitTotal] = useState(0);
  const [creditTotal, setCreditTotal] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");


  // Fetch transactions based on selected account
  useEffect(() => {
    if (!account?.Id) return;

    setLoadingTx(true);

    // Construct URL without line breaks
    const apiUrl = `http://88.99.215.90:8600/api/values/GeneralLedgerTransactions?chartOfAccountId=${account.Id}&pageIndex=${pageIndex}&pageSize=${pageSize}`;

    fetch(apiUrl, {
      headers: {
        "ngrok-skip-browser-warning": "true",
        "Content-Type": "application/json"
      }
    })
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
        setCreditTotal(data.TotalCredits || 0)
        setDebitTotal(data.TotalDebits || 0)
        setTransactions(data.PageCollection || []);
        setTotalCount(data.TotalPages || 0);
        setTotalRecords(data.ItemsCount || 0);
      })
      .catch(console.error)
      .finally(() => setLoadingTx(false));
  }, [account, pageIndex, pageSize]);

  // const filteredTransactions =
  //   search.trim() === ""
  //     ? transactions
  //     : transactions.filter((tx) =>
  //       tx.JournalPrimaryDescription
  //         ?.toLowerCase()
  //         .includes(search.toLowerCase())
  //     );

  console.log("Account Id", account?.Id);


  // Reset to first page when search or pageSize changes
  useEffect(() => {
    setPageIndex(0);
  }, [search, pageSize, fromDate, toDate]);



  const handlePrintPDF = () => {
    if (!account) return;

    const doc = new jsPDF("p", "mm", "a4");

    const marginLeft = 14;
    let cursorY = 15;

    // ===== Header =====
    doc.setFontSize(14);
    doc.text("Account Statement", marginLeft, cursorY);

    doc.setFontSize(9);
    doc.text(
      `Generated on: ${new Date().toLocaleString()}`,
      marginLeft,
      cursorY + 6
    );

    cursorY += 14;

    // ===== Account Info =====
    doc.setFontSize(11);
    doc.text(`Account Code: ${account.Code}`, marginLeft, cursorY);
    cursorY += 6;

    doc.text(`Description: ${account.Description}`, marginLeft, cursorY);
    cursorY += 6;

    doc.text(`Category: ${account.CategoryDescription}`, marginLeft, cursorY);
    cursorY += 6;

    doc.text(
      `Balance: ${account.Balance.toLocaleString("en-US", {
        style: "currency",
        currency: "KES",
      })}`,
      marginLeft,
      cursorY
    );

    cursorY += 10;

    // ===== Totals =====
    doc.setFontSize(10);
    doc.text(
      `Total Debit: ${totalDebit.toLocaleString("en-US", {
        style: "currency",
        currency: "KES",
      })}`,
      marginLeft,
      cursorY
    );

    doc.text(
      `Total Credit: ${totalCredit.toLocaleString("en-US", {
        style: "currency",
        currency: "KES",
      })}`,
      marginLeft + 90,
      cursorY
    );

    cursorY += 8;

    // ===== Transactions Table =====
    const tableData = transactions.map((tx) => [
      tx.JournalValueDate ? new Date(tx.JournalValueDate).toLocaleDateString() : '',
      tx.JournalPrimaryDescription || '',
      (tx.Debit || 0).toLocaleString(),
      (tx.Credit || 0).toLocaleString(),
      (tx.RunningBalance || 0).toLocaleString(),
      tx.ContraGLAccountDescription || '',
    ]);

    autoTable(doc, {
      startY: cursorY,
      head: [[
        "Date",
        "Description",
        "Debit",
        "Credit",
        "Balance",
        "Bal Account",
      ]],
      body: tableData,
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [79, 70, 229], // Indigo
        textColor: 255,
      },
      columnStyles: {
        2: { halign: "right" },
        3: { halign: "right" },
        4: { halign: "right" },
      },
      didDrawPage: (data) => {
        doc.setFontSize(8);
        doc.text(
          `Page ${doc.internal.getNumberOfPages()}`,
          data.settings.margin.left,
          doc.internal.pageSize.height - 10
        );
      },
    });

    doc.save(`Account_Statement_${account.Code}.pdf`);
  };

  // Calculate pagination info
  // const startItem = (pageIndex - 1) * pageSize + 1;
  // const endItem = Math.min(pageIndex * pageSize, totalCount);
  // const totalPages = Math.ceil(totalCount / pageSize);



  const startItem = totalRecords === 0 ? 0 : pageIndex * pageSize + 1;
  const endItem = Math.min((pageIndex + 1) * pageSize, totalRecords);
  const totalPages = Math.ceil(totalRecords / pageSize);


  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch =
      search.trim() === "" ||
      tx.JournalPrimaryDescription
        ?.toLowerCase()
        .includes(search.toLowerCase());

    const txDate = tx.JournalValueDate
      ? new Date(tx.JournalValueDate)
      : null;

    const matchesFrom =
      !fromDate || (txDate && txDate >= new Date(fromDate));

    const matchesTo =
      !toDate || (txDate && txDate <= new Date(toDate + "T23:59:59"));

    return matchesSearch && matchesFrom && matchesTo;
  });



  console.log(filteredTransactions);
  console.log("Pages Size", pageSize);
  console.log("pageIndex", pageIndex);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose} b
          />


          {/* Drawer */}

          <motion.div
            className="fixed top-0 right-0 max-h-full w-[1000px] bg-white shadow-2xl z-50 flex flex-col m-2 rounded-2xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
          >
            {/* Header */}
            <div className="px-3 py-3 border-b flex justify-between items-center bg-indigo-500 rounded-2xl m-2">
              <div className="flex justify-center items-center gap-4 bg-indigo-800 p-4 rounded-2xl px-6">
                <h2 className="text-2xl font-semibold text-gray-50">
                  {account.Description}
                </h2>

                <div className="mt-2 flex gap-2">
                  <span className="text-xs px-2 py-1 rounded bg-indigo-50 text-indigo-700">
                    {account.TypeDescription}
                  </span>
                  <span className="text-xs px-2 py-1 rounded border text-gray-50">
                    Code  {(() => {
                      const codeStr = String(account.Code);
                      const part1 = codeStr.slice(0, 1);
                      const part2 = codeStr.slice(1, 3);
                      const part3 = codeStr.slice(3).padStart(5, "0");
                      return `${part1}-${part2}-${part3}`;
                    })()}
                  </span>
                </div>
              </div>

              <Button variant="ghost" size="sm" onClick={onClose} className="bg-gray-50 text-gray-600 mx-3">
                Close
              </Button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 py-6 space-y-4">
              {/* Balance Summary */}
              <div className="grid grid-cols-3 gap-4 bg-gray-200 p-3 rounded-2xl">
                <SummaryCard
                  label="Balance"
                  value={Math.abs(account.Balance || 0).toLocaleString("en-US", {
                    style: "currency",
                    currency: "KES",
                  })}
                  highlight
                />
                <SummaryCard
                  label="Total Credit"
                  value={debitTotal.toLocaleString("en-US", {
                    style: "currency",
                    currency: "KES",
                  })}
                />
                <SummaryCard
                  label="Total Debit"
                  value={creditTotal.toLocaleString("en-US", {
                    style: "currency",
                    currency: "KES",
                  })}
                />
              </div>

              {/* Transactions */}
              <div>
                <div className="">

                  <div className="flex justify-between items-center mb-3 gap-3 bg-gray-200 rounded-xl px-3 py-3">
                    <h3 className="text-sm font-semibold text-gray-800 ml-1">
                      Transactions
                    </h3>

                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        className="px-3 py-1.5 text-sm border rounded-md bg-gray-50"
                      />

                      <input
                        type="date"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        className="px-3 py-1.5 text-sm border rounded-md bg-gray-50"
                      />

                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-gray-800 text-gray-50 hover:bg-gray-700"
                        onClick={() => {
                          setFromDate("");
                          setToDate("");
                        }}
                      >
                        Clear
                      </Button>

                      <input
                        type="text"
                        placeholder="Search description..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="px-3 py-1.5 text-sm border rounded-md w-56 bg-gray-50"
                      />

                      <select
                        value={pageSize}
                        onChange={(e) => {
                          setPageSize(Number(e.target.value));
                          setPageIndex(1);
                        }}

                        className="border rounded-md px-2 py-1 text-sm bg-gray-50"
                      >
                        {[5, 10, 20, 50, 100].map((s) => (
                          <option key={s} value={s}>
                            {s} rows
                          </option>
                        ))}
                      </select>

                    </div>
                  </div>

                </div>

                <div className="border rounded-lg overflow-hidden">
                  <Table className="text-sm">
                    <TableHeader className="bg-gray-800 text-gray-50 hover:bg-gray-800">
                      <TableRow className="bg-gray-600 text-gray-50 hover:bg-gray-600">
                        <TableHead className="text-gray-50 hover:text-gray-50">Date</TableHead>
                        <TableHead className="text-gray-50 hover:text-gray-50">Description</TableHead>
                        <TableHead className="text-gray-50 hover:text-gray-50">Member No</TableHead>
                        <TableHead className="text-right text-gray-50 hover:text-gray-50">Debit</TableHead>
                        <TableHead className="text-right text-gray-50 hover:text-gray-50">Credit</TableHead>
                        <TableHead className="text-right text-gray-50 hover:text-gray-50">Balance</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {loadingTx ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                            Loading transactions...
                          </TableCell>
                        </TableRow>
                      ) : filteredTransactions.length > 0 ? (
                        filteredTransactions.map((tx) => (
                          <TableRow key={tx.Id} className="hover:bg-gray-50">
                            <TableCell>
                              {tx.JournalValueDate ? new Date(tx.JournalValueDate).toLocaleDateString() : ''}
                            </TableCell>
                            <TableCell className="max-w-[220px] truncate">
                              {tx.JournalPrimaryDescription}
                            </TableCell>
                            <TableCell>
                              {tx.CustomerReference2}
                            </TableCell>
                            <TableCell className="text-right">
                              {(tx.Debit || 0).toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right">
                              {(tx.Credit || 0).toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {Math.abs(tx.RunningBalance || 0).toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-10">
                            <img src={NotFoundImage} className="mx-auto w-28 mb-3" />
                            <p className="text-sm text-gray-500">No transactions found</p>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>

                  </Table>
                </div>
              </div>
            </div>

            {/* Pagination Footer */}
            <div className="flex justify-between items-center mt-4 text-sm text-gray-600 border-t px-6 py-4 gap-3">
              <span>
                {/* {totalCount === 0
                  ? "No records"
                  : `Showing ${startItem} – ${endItem} of ${totalCount} (Page ${pageIndex} of ${totalPages})`} */}

                {totalRecords === 0
                  ? "No records"
                  : `Showing ${startItem} – ${endItem} of ${totalRecords} (Page ${pageIndex + 1} of ${totalPages})`
                }

              </span>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-gray-800 text-gray-50 hover:bg-gray-700"
                  disabled={pageIndex <= 0}
                  onClick={() => setPageIndex((p) => Math.max(p - 1, 0))}
                >
                  Previous
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="bg-gray-800 text-gray-50 hover:bg-gray-700"
                  disabled={pageIndex >= totalPages - 1}
                  onClick={() => setPageIndex((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t px-6 py-4 flex justify-end gap-3">
              <Button
                className="bg-indigo-600 hover:bg-indigo-700 text-gray-50"
                size="sm"
                variant="outline"
                onClick={handlePrintPDF}
              >
                Export PDF
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function SummaryCard({ label, value, highlight }) {
  return (
    <div
      className={`rounded-lg border p-4 ${highlight ? "bg-indigo-600 border-indigo-500" : "bg-white"
        }`}
    >
      <p className={`text-xs  uppercase tracking-wide ${highlight ? "text-gray-50" : "text-gray-500"}`}>
        {label}
      </p>
      <p className={`mt-1 text-lg font-semibold  ${highlight ? "text-gray-50" : "text-gray-900"}`}>
        {value}
      </p>
    </div>
  );
}