import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import Swal from "sweetalert2";
import { FaCogs, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import NotFoundImage from "/assets/scopefinding.png";
import {
  listSystemGeneralLedgerMappings, mapSystemGeneralLedgerAccountCode, getChartOfAccountTree,
} from "./api";

// "G/L Account Determination" — which chart-of-account each
// SystemGeneralLedgerAccountCode posts to by default. Genuinely distinct
// nav entry from the main Chart of Accounts screen (NavigationMenu.cs
// Code 0x000059D8+6, "G/L Account Determination", ControllerName
// SystemGeneralLedgerAccountMapping) even though it's served by the same
// ChartOfAccountController — docs/api/chartofaccount-api-spec.md §3.6/3.7.
// Edit-only: MapSystemGeneralLedgerAccountCodeToChartOfAccount is a single
// idempotent upsert, there's no create/delete of a mapping row as such.

export default function ChartOfAccountMappings() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize] = useState(20);
  const [itemsCount, setItemsCount] = useState(0);
  const [savingCode, setSavingCode] = useState(null);

  const fetchItems = () => {
    setLoading(true);
    listSystemGeneralLedgerMappings({ pageIndex, pageSize })
      .then((page) => {
        setItems(page?.pageCollection || page?.PageCollection || []);
        setItemsCount(page?.itemsCount || page?.ItemsCount || 0);
      })
      .catch(() => { setItems([]); setItemsCount(0); })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageIndex]);

  useEffect(() => {
    setLoadingAccounts(true);
    getChartOfAccountTree()
      .then((tree) => setAccounts(Array.isArray(tree) ? tree : []))
      .catch(() => setAccounts([]))
      .finally(() => setLoadingAccounts(false));
  }, []);

  const handleMap = async (row, chartOfAccountId) => {
    setSavingCode(row.SystemGeneralLedgerAccountCode);
    try {
      await mapSystemGeneralLedgerAccountCode(row.SystemGeneralLedgerAccountCode, chartOfAccountId);
      Swal.fire("Success", "Mapping saved successfully", "success");
      fetchItems();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setSavingCode(null);
    }
  };

  const hasNextPage = itemsCount ? (pageIndex + 1) * pageSize < itemsCount : items.length === pageSize;

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
      <div className="flex items-center justify-between gap-3 mb-6 bg-indigo-700 px-6 py-3 rounded-2xl">
        <div className="flex items-center gap-3">
          <FaCogs className="text-white text-xl" />
          <h2 className="text-xl font-bold text-white">G/L Account Determination</h2>
        </div>
        <Link to="/Accounts/ChartOfAccounts" className="text-sm text-white/80 hover:text-white">
          &larr; Back to Chart of Accounts
        </Link>
      </div>

      <div className="grid grid-cols-12 gap-2 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-3">
        <span className="col-span-5">Transaction</span>
        <span className="col-span-6">Mapped Chart of Account</span>
        <span className="col-span-1"></span>
      </div>

      {loading ? (
        <div className="space-y-2 animate-pulse">
          {[1, 2, 3].map((i) => <div key={i} className="h-12 bg-gray-100 rounded-lg" />)}
        </div>
      ) : items.length > 0 ? (
        <div className="space-y-2">
          {items.map((row) => (
            <div key={row.Id} className="grid grid-cols-12 gap-2 items-center bg-white px-4 py-3 rounded-lg shadow border">
              <span className="col-span-5 text-sm text-gray-700">{row.SystemGeneralLedgerAccountCodeDescription}</span>
              <div className="col-span-6">
                <Select
                  value={row.ChartOfAccountId || ""}
                  onValueChange={(v) => handleMap(row, v)}
                  disabled={loadingAccounts || savingCode === row.SystemGeneralLedgerAccountCode}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingAccounts ? "Loading..." : "Select chart of account"}>
                      {row.ChartOfAccountName || "Not mapped"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    {accounts.map((a) => (
                      <SelectItem key={a.Id} value={a.Id}>
                        {"— ".repeat(a.Depth || 0)}{a.Code} — {a.Description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <span className="col-span-1 text-right text-xs text-gray-400">
                {savingCode === row.SystemGeneralLedgerAccountCode ? "Saving..." : ""}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center mt-4">
          <img src={NotFoundImage} alt="Not Found" className="mx-auto w-32 h-auto" />
          <p className="text-gray-400 mt-2">No G/L account mappings found.</p>
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
  );
}
