import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import Swal from "sweetalert2";
import { FaCogs } from "react-icons/fa";
import NotFoundImage from "/assets/scopefinding.png";
import {
  listSystemGeneralLedgerMappings, mapSystemGeneralLedgerAccountCode, getChartOfAccountTree,
} from "./api";
import { SYSTEM_GENERAL_LEDGER_ACCOUNT_CODES } from "../lib/systemGeneralLedgerAccountCodes";

// "G/L Account Determination" — which chart-of-account each
// SystemGeneralLedgerAccountCode posts to by default. Genuinely distinct
// nav entry from the main Chart of Accounts screen (NavigationMenu.cs
// Code 0x000059D8+6, "G/L Account Determination", ControllerName
// SystemGeneralLedgerAccountMapping) even though it's served by the same
// ChartOfAccountController — docs/api/chartofaccount-api-spec.md §3.6/3.7.
// Edit-only: MapSystemGeneralLedgerAccountCodeToChartOfAccount is a single
// idempotent upsert, there's no create/delete of a mapping row as such.
//
// GET /systemgeneralledgermappings only returns codes that already have a
// persisted mapping row (confirmed against ChartOfAccountAppService
// source — it queries the mapping repository directly, never the
// SystemGeneralLedgerAccountCode C# enum). A code nobody has mapped yet
// has no row and never appears, even though the PUT is a real upsert that
// can create one. Fixed here by rendering the full fixed 32-code universe
// (SYSTEM_GENERAL_LEDGER_ACCOUNT_CODES, transcribed from the enum) and
// left-joining whatever rows the GET returns onto it — every mappable
// code is now visible and editable, not just the ones already touched.
// 32 codes comfortably fits one unpaged fetch (pageSize=1000), so there's
// no server-side Prev/Next here — just a client-side search box.

export default function ChartOfAccountMappings() {
  const [mappingRows, setMappingRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [savingCode, setSavingCode] = useState(null);
  const [search, setSearch] = useState("");

  const fetchMappings = () => {
    setLoading(true);
    listSystemGeneralLedgerMappings({ pageIndex: 0, pageSize: 1000 })
      .then((page) => setMappingRows(page?.pageCollection || page?.PageCollection || []))
      .catch(() => setMappingRows([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchMappings(); }, []);

  useEffect(() => {
    setLoadingAccounts(true);
    getChartOfAccountTree()
      .then((tree) => setAccounts(Array.isArray(tree) ? tree : []))
      .catch(() => setAccounts([]))
      .finally(() => setLoadingAccounts(false));
  }, []);

  // Left-join the full 32-code universe onto whatever rows the API
  // returned, matched by SystemGeneralLedgerAccountCode — unmapped codes
  // get a synthetic row with no ChartOfAccountId, same as a real
  // "Not mapped" row would look, so the same Select drives both.
  const items = useMemo(() => {
    const byCode = new Map(mappingRows.map((r) => [r.SystemGeneralLedgerAccountCode, r]));
    return SYSTEM_GENERAL_LEDGER_ACCOUNT_CODES.map(({ value, label }) => {
      const existing = byCode.get(value);
      return existing ?? {
        Id: `unmapped-${value}`,
        SystemGeneralLedgerAccountCode: value,
        SystemGeneralLedgerAccountCodeDescription: label,
        ChartOfAccountId: "",
        ChartOfAccountName: "",
      };
    });
  }, [mappingRows]);

  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter((item) =>
      (item.SystemGeneralLedgerAccountCodeDescription || "").toLowerCase().includes(q)
      || (item.ChartOfAccountName || "").toLowerCase().includes(q)
    );
  }, [items, search]);

  const handleMap = async (row, chartOfAccountId) => {
    setSavingCode(row.SystemGeneralLedgerAccountCode);
    try {
      await mapSystemGeneralLedgerAccountCode(row.SystemGeneralLedgerAccountCode, chartOfAccountId);
      Swal.fire("Success", "Mapping saved successfully", "success");
      fetchMappings();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setSavingCode(null);
    }
  };

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
      <div className="flex items-center justify-between gap-3 mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
        <div className="flex items-center gap-3">
          <FaCogs className="text-white text-xl" />
          <h2 className="text-xl font-bold text-white">G/L Account Determination</h2>
        </div>
        <Link to="/Accounts/ChartOfAccounts" className="text-sm text-white/80 hover:text-white">
          &larr; Back to Chart of Accounts
        </Link>
      </div>

      <div className="flex flex-wrap justify-between items-center mb-4 gap-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by transaction or mapped account..."
          className="max-w-xs"
        />
        <p className="text-xs text-gray-400">
          {mappingRows.length} of {SYSTEM_GENERAL_LEDGER_ACCOUNT_CODES.length} codes mapped
        </p>
      </div>

      <div className="bg-gray-200 p-4 rounded-sm">
        <div className="grid grid-cols-12 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4">
          <span className="col-span-5">Transaction</span>
          <span className="col-span-6">Mapped Chart of Account</span>
          <span className="col-span-1"></span>
        </div>

        {loading || loadingAccounts ? (
          <div className="space-y-2 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="grid grid-cols-12 gap-2 bg-gray-50 p-6 rounded">
                {Array.from({ length: 12 }).map((_, j) => <div key={j} className="h-4 bg-gray-200 rounded"></div>)}
              </div>
            ))}
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="space-y-2">
            {filteredItems.map((row) => (
              <div key={row.Id} className="bg-white rounded-lg shadow-lg border">
                <div className="grid grid-cols-12 gap-2 items-center py-4 px-6 hover:shadow-xl transition-all">
                  <span className="col-span-5 text-sm text-gray-700">{row.SystemGeneralLedgerAccountCodeDescription}</span>
                  <div className="col-span-6">
                    <Select
                      value={row.ChartOfAccountId || ""}
                      onValueChange={(v) => handleMap(row, v)}
                      disabled={savingCode === row.SystemGeneralLedgerAccountCode}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select chart of account">
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
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-center mt-4">
            <img src={NotFoundImage} alt="Not Found" className="mx-auto w-42" />
            <p className="font-medium text-gray-400">No matching G/L account codes.</p>
          </div>
        )}
      </div>
    </div>
  );
}
