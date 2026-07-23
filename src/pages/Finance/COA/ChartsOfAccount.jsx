import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import AccountDrawer from "./AccountDrawer";
import AddAccountDrawer from "./AddAccountDrawer";
import NotFoundImage from "/assets/scopefinding.png";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const ACCOUNT_CATEGORIES = [
  { label: "Assets", value: 1000 },
  { label: "Liabilities", value: 2000 },
  { label: "Equity", value: 3000 },
  { label: "Income", value: 4000 },
  { label: "Expenses", value: 5000 },
];

const fmt = (n) =>
  Number(n || 0).toLocaleString("en-US", { style: "currency", currency: "KES" });

export default function ChartOfAccounts() {
  const [allAccounts, setAllAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(ACCOUNT_CATEGORIES[0].value);
  const [selectedParent, setSelectedParent] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [addDrawerOpen, setAddDrawerOpen] = useState(false);
  const [search, setSearch] = useState("");

  /* ── derived lists ─────────────────────────────────────────── */
  // Sidebar: root accounts for the active category tab
  const parentAccounts = allAccounts.filter(
    (a) => a.ParentId === null || a.ParentId === undefined || a.ParentId === ""
  );

  // Center: children of the selected sidebar item
  const childAccounts = selectedParent
    ? allAccounts.filter((a) => a.ParentId === selectedParent.Id)
    : [];

  const filteredChildren = childAccounts.filter(
    (a) =>
      a.Description?.toLowerCase().includes(search.toLowerCase()) ||
      String(a.Code).includes(search)
  );

  /* ── fetch ──────────────────────────────────────────────────── */
  const fetchAccounts = (category) => {
    setLoading(true);
    const url = `${import.meta.env.VITE_APP_FIN_URL}/api/values/GetGeneralLedgers?accountCategory=${category}`;
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (data.Success) {
          setAllAccounts(data.Data ?? []);
          setSelectedParent(null);
          setSearch("");
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAccounts(selectedCategory);
  }, [selectedCategory]);

  /* ── PDF export ─────────────────────────────────────────────── */
  const handlePDF = () => {
    const categoryLabel = ACCOUNT_CATEGORIES.find((c) => c.value === selectedCategory)?.label ?? "";
    const source = filteredChildren.length > 0 ? filteredChildren : childAccounts;
    const doc = new jsPDF("p", "mm", "a4");

    doc.setFontSize(14);
    doc.text(`Chart of Accounts – ${categoryLabel}`, 14, 15);
    if (selectedParent) {
      doc.setFontSize(11);
      doc.text(selectedParent.Description, 14, 22);
    }
    doc.setFontSize(9);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, selectedParent ? 29 : 22);

    autoTable(doc, {
      startY: selectedParent ? 35 : 30,
      head: [["Code", "Description", "Type", "Balance"]],
      body: source.map((a) => [
        a.Code,
        a.Description,
        a.TypeDescription,
        fmt(a.Balance),
      ]),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [79, 70, 229], textColor: 255 },
      columnStyles: { 3: { halign: "right" } },
    });

    doc.save(`COA_${categoryLabel}.pdf`);
  };

  /* ── render ─────────────────────────────────────────────────── */
  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">

      {/* ══ TOP NAVIGATION – category tabs ══════════════════════ */}
      <div className="bg-white border-b px-6 flex items-center justify-between flex-shrink-0">
        <nav className="flex">
          {ACCOUNT_CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-5 py-4 text-sm font-medium border-b-2 -mb-px transition-colors ${selectedCategory === cat.value
                ? "border-indigo-600 text-indigo-700 bg-gray-100"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
            >
              {cat.label}
            </button>
          ))}
        </nav>

        <div className="flex gap-2 py-2">
          <Button variant="outline" size="sm" onClick={handlePDF} className="text-red-600 border-red-300 hover:bg-red-50">
            Export PDF
          </Button>
          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => setAddDrawerOpen(true)}>
            + Add Account
          </Button>
        </div>
      </div>

      {/* ══ BODY ═════════════════════════════════════════════════ */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── SIDEBAR – parent accounts (ParentId = null) ──────── */}
        <aside className="w-84 bg-white border-r flex flex-col flex-shrink-0 overflow-hidden">
          <div className="px-4 py-3 bg-indigo-700 flex-shrink-0">
            <p className="text-white font-semibold text-sm">
              {ACCOUNT_CATEGORIES.find((c) => c.value === selectedCategory)?.label}
            </p>
            <p className="text-indigo-200 text-xs mt-0.5">Account Groups</p>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            <div className="bg-gray-200 rounded-lg p-4 border border-gray-200 shadow-sm divide-y divide-gray-100">
              {loading ? (
                <p className="p-3 text-sm text-gray-400">Loading...</p>
              ) : parentAccounts.length === 0 ? (
                <p className="p-3 text-sm text-gray-400">No accounts found</p>
              ) : (
                parentAccounts.map((acc) => {
                  const active = selectedParent?.Id === acc.Id;
                  return (
                    <button
                      key={acc.Id}
                      onClick={() => { setSelectedParent(acc); setSearch(""); }}
                      className={`w-full text-left px-3 py-3 rounded-lg transition-all hover:text-white ${active
                        ? "bg-indigo-600 text-white shadow-sm mb-2"
                        : "text-gray-700 hover:bg-indigo-600 hover:text-white bg-white mb-2"
                        }`}
                    >
                      <p className="font-semibold text-sm leading-tight">{acc.Description}</p>
                      <p className={`text-xs mt-1 ${active ? "text-indigo-200" : "text-gray-400"}`}>
                        Available: {fmt(acc.Balance)}
                      </p>
                      <p className={`text-xs ${active ? "text-indigo-200" : "text-gray-400"}`}>
                        Code: {acc.Code}
                      </p>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </aside>

        {/* ── CENTER – child accounts ───────────────────────────── */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {selectedParent ? (
            <>
              {/* Center header */}
              <div className="bg-white border-b px-6 py-3 flex items-center justify-between flex-shrink-0">
                <div>
                  <h2 className="font-bold text-gray-800 text-base">{selectedParent.Description}</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {selectedParent.CategoryDescription} · {childAccounts.length} sub-account{childAccounts.length !== 1 ? "s" : ""}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Search accounts..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="px-3 py-1.5 border rounded-md text-sm w-56 bg-gray-50 focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Child account list */}
              <div className="flex-1 overflow-y-auto p-5 bg-gray-100">
                {childAccounts.length === 0 ? (
                  /* Parent has no sub-accounts — offer direct entry view */
                  <div className="flex flex-col items-center justify-center h-full gap-4">
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-8 py-10 flex flex-col items-center gap-3 max-w-sm w-full">
                      <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                        <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 4H7a2 2 0 01-2-2V6a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-gray-700 text-sm">{selectedParent.Description}</p>
                        <p className="text-xs text-gray-400 mt-1">This account has no sub-accounts.</p>
                      </div>
                      <button
                        onClick={() => { setSelectedAccount(selectedParent); setDrawerOpen(true); }}
                        className="mt-1 w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
                      >
                        View Transaction
                      </button>
                    </div>
                  </div>
                ) : filteredChildren.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <img src={NotFoundImage} className="w-28 mb-3 opacity-60" alt="" />
                    <p className="text-sm">No accounts match your search</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredChildren.map((acc) => (
                      <div
                        key={acc.Id}
                        onClick={() => { setSelectedAccount(acc); setDrawerOpen(true); }}
                        className="bg-white px-5 py-4 rounded-xl border border-gray-200 cursor-pointer
                                   hover:border-indigo-400 hover:shadow-sm transition-all group flex items-center justify-between"
                      >
                        <div>
                          <p className="font-semibold text-gray-800 group-hover:text-indigo-700 transition-colors">
                            {acc.Description}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {acc.TypeDescription}
                            {acc.Code ? ` · Code ${acc.Code}` : ""}
                          </p>
                        </div>

                        <div className="text-right flex-shrink-0 ml-6">
                          <p className="font-bold text-indigo-700 text-sm">{fmt(acc.Balance)}</p>
                          <p className="text-xs text-gray-400">Balance</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Empty state – nothing selected yet */
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-400 select-none">
                <p className="text-5xl mb-4">⟵</p>
                <p className="text-sm font-medium">Select an account group from the sidebar</p>
                <p className="text-xs mt-1">Sub-accounts will appear here</p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ══ DRAWERS ══════════════════════════════════════════════ */}
      <AccountDrawer
        open={drawerOpen}
        account={selectedAccount}
        onClose={() => setDrawerOpen(false)}
      />
      <AddAccountDrawer
        open={addDrawerOpen}
        onClose={() => setAddDrawerOpen(false)}
        onSuccess={() => fetchAccounts(selectedCategory)}
      />
    </div>
  );
}
