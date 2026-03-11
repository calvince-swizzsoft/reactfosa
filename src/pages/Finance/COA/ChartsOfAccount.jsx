






import { useEffect, useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AccountDrawer from "./AccountDrawer";
import AddAccountDrawer from "./AddAccountDrawer";
import NotFoundImage from "/assets/scopefinding.png";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function ChartOfAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [filteredAccounts, setFilteredAccounts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [activeRowId, setActiveRowId] = useState(null);
  const [addDrawerOpen, setAddDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [itemsPerPage, setItemsPerPage] = useState(10);

  const tableContainerRef = useRef(null);

  const ACCOUNT_CATEGORIES = [
    { label: "Assets", value: 1000 },
    { label: "Liabilities", value: 2000 },
    { label: "Equity", value: 3000 },
    { label: "Income", value: 4000 },
    { label: "Expenses", value: 5000 },
  ];

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedCategoryLabel, setSelectedCategoryLabel] =
    useState("All Accounts");

  /* =========================
     API FETCH (CATEGORY + TEXT)
     ========================= */
  const fetchAccounts = (category = null, text = "") => {
    setLoading(true);

    const params = new URLSearchParams();
    if (category !== null) params.append("accountCategory", category);
    if (text.trim()) params.append("text", text.trim());

    const url = `${import.meta.env.VITE_APP_FIN_URL
      }/api/values/GetGeneralLedgers?${params.toString()}`;

    fetch(url, {
      headers: { "ngrok-skip-browser-warning": "true" },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.Success) {
          setAccounts(data.Data);
          setFilteredAccounts(data.Data);
          setCurrentPage(1);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  /* Initial Load */
  useEffect(() => {
    fetchAccounts();
  }, []);

  /* Search (debounced feel, API driven) */
  useEffect(() => {
    const delay = setTimeout(() => {
      fetchAccounts(selectedCategory, searchTerm);
    }, 400);

    return () => clearTimeout(delay);
  }, [searchTerm]);

  const isAllRows = itemsPerPage === 0;

  /* Pagination */
  const totalPages = isAllRows
    ? 1
    : Math.ceil(filteredAccounts.length / itemsPerPage);

  const paginatedData = isAllRows
    ? filteredAccounts
    : filteredAccounts.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );


  const handleRowClick = (acc) => {
    setActiveRowId(acc.Id);
    setSelectedAccount(acc);
    setDrawerOpen(true);
  };

  /* PDF */
  const handlePrintPDF = () => {
    const doc = new jsPDF("p", "mm", "a4");

    const title = `Chart of Accounts - ${selectedCategoryLabel}`;
    const date = new Date().toLocaleString();

    doc.setFontSize(14);
    doc.text(title, 14, 15);
    doc.setFontSize(9);
    doc.text(`Generated on: ${date}`, 14, 22);

    autoTable(doc, {
      startY: 28,
      head: [["Date", "Code", "Description", "Type", "Balance"]],
      body: filteredAccounts.map((acc) => [
        new Date(acc.CreatedDate).toLocaleDateString(),
        acc.Code,
        acc.Description,
        acc.TypeDescription,
        acc.Balance.toLocaleString("en-US", {
          style: "currency",
          currency: "KES",
        }),
      ]),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [79, 70, 229], textColor: 255 },
      columnStyles: { 4: { halign: "right" } },
    });

    doc.save(`Chart_of_Accounts_${selectedCategoryLabel}.pdf`);
  };


  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);


  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* SIDEBAR */}
      <div className="w-80 bg-white border-r p-4">
        <h3 className="font-bold text-white mb-4 bg-indigo-700 px-4 py-3 rounded-lg">
          Account Types
        </h3>

        <div className="space-y-3 bg-gray-200 p-3 rounded-lg">
          <Card
            className={`cursor-pointer ${selectedCategory === null ? "bg-blue-700 text-white" : ""}`}
            onClick={() => {
              setSelectedCategory(null);
              setSelectedCategoryLabel("All Accounts");
              fetchAccounts(null, searchTerm);
            }}
          >
            <CardContent className="p-3 font-bold">All Accounts</CardContent>
          </Card>

          {ACCOUNT_CATEGORIES.map((cat) => (
            <Card
              key={cat.value}
              className={`cursor-pointer ${selectedCategory === cat.value
                ? "bg-blue-700 text-white"
                : ""
                }`}
              onClick={() => {
                setSelectedCategory(cat.value);
                setSelectedCategoryLabel(cat.label);
                fetchAccounts(cat.value, searchTerm);
              }}
            >
              <CardContent className="p-3 font-bold">
                {cat.label}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* MAIN */}
      <div className="flex-1 flex flex-col">
        {/* HEADER */}
        <div className="flex justify-between bg-white px-6 py-4 border-b">
          <h2 className="font-bold">{selectedCategoryLabel}</h2>

          <div className="flex gap-3">
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search accounts..."
              className="w-72 px-3 py-2 border rounded-md"
            />

            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="px-3 py-2 border rounded-md"
            >
              <option value={5}>5 rows</option>
              <option value={10}>10 rows</option>
              <option value={20}>20 rows</option>
              <option value={50}>50 rows</option>
              <option value={0}>All rows</option>
            </select>



            <Button onClick={handlePrintPDF} className="bg-red-600 text-white">
              PDF
            </Button>

            <Button
              className="bg-blue-600"
              onClick={() => setAddDrawerOpen(true)}
            >
              Add Account
            </Button>
          </div>
        </div>

        {/* TABLE */}
        <div ref={tableContainerRef} className="flex-1 p-6 overflow-y-auto bg-gray-200">
          {loading ? (
            <p className="text-center text-gray-500">Loading...</p>
          ) : paginatedData.length === 0 ? (
            <div className="text-center">
              <img src={NotFoundImage} className="mx-auto w-40" />
              <p>No accounts found for {selectedCategoryLabel}</p>
            </div>
          ) : (
            paginatedData.map((acc) => (
              <div
                key={acc.Id}
                onClick={() => handleRowClick(acc)}
                className="bg-white p-4 mb-3 rounded-lg shadow cursor-pointer hover:bg-indigo-600 hover:text-gray-50"
              >
                <div className="flex justify-between">
                  <div>
                    <p className="font-bold">{acc.Description}</p>
                    <p className="text-sm">
                      {acc.TypeDescription}
                    </p>
                  </div>
                  <div className="font-semibold bg-gray-200 flex justify-center items-center rounded-lg px-4 text-gray-800">
                    {acc.Balance.toLocaleString("en-US", {
                      style: "currency",
                      currency: "KES",
                    })}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* DRAWERS */}
        <AccountDrawer
          open={drawerOpen}
          account={selectedAccount}
          onClose={() => setDrawerOpen(false)}
        />

        <AddAccountDrawer
          open={addDrawerOpen}
          onClose={() => setAddDrawerOpen(false)}
          onSuccess={() => fetchAccounts(selectedCategory, searchTerm)}
        />
      </div>
    </div>
  );
}
