import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Swal from "sweetalert2";
import NotFoundImage from "/assets/scopefinding.png";
import { FaPlus, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { apiErrorMessage, apiJson, normalizeList } from "@/lib/api";
import {
  listChartOfAccounts, getChartOfAccount, getChartOfAccountTree, updateChartOfAccount,
} from "./api";
import ChartOfAccountForm from "./ChartOfAccountForm";

const FIN_BASE = `${import.meta.env.VITE_APP_FIN_URL}`;

function EditChartOfAccountDrawer({ open, onClose, onSuccess, accountId, parentOptions, costCenters, loadingLists }) {
  const [form, setForm] = useState(null);
  const [loadingItem, setLoadingItem] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !accountId) return;
    setLoadingItem(true);
    // The tree/list row shapes don't carry every editable field (e.g.
    // CostCenterId, IsControlAccount) — always fetch the full DTO before
    // rendering the edit form, per chartofaccount-api-spec.md §2.
    getChartOfAccount(accountId)
      .then((dto) => setForm({
        ParentId: dto.ParentId || "",
        AccountType: dto.AccountType,
        AccountCategory: dto.AccountCategory,
        AccountCode: dto.AccountCode ?? "",
        AccountName: dto.AccountName || "",
        CostCenterId: dto.CostCenterId || "",
        IsControlAccount: !!dto.IsControlAccount,
        IsReconciliationAccount: !!dto.IsReconciliationAccount,
        PostAutomaticallyOnly: !!dto.PostAutomaticallyOnly,
        IsLocked: !!dto.IsLocked,
      }))
      .catch((error) => {
        setForm(null);
        Swal.fire("Error", apiErrorMessage(error, "Unable to load the chart account."), "error");
      })
      .finally(() => setLoadingItem(false));
  }, [open, accountId]);

  const handleChange = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        ParentId: form.ParentId || null,
        CostCenterId: form.IsControlAccount ? null : (form.CostCenterId || null),
        AccountCode: Number(form.AccountCode),
      };
      await updateChartOfAccount(accountId, payload);
      Swal.fire("Success", "Chart of account updated successfully", "success");
      onSuccess();
      onClose();
    } catch (err) {
      Swal.fire("Error", apiErrorMessage(err, "Unable to update the chart account."), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 bg-black z-40" initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            className="fixed top-5 right-3 w-[480px] bg-white shadow-xl z-50 flex flex-col rounded-2xl p-3 max-h-[95vh] overflow-y-auto"
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="p-4 flex justify-between items-center bg-indigo-600 rounded-2xl m-2">
              <h2 className="font-bold text-lg text-white">Edit Chart of Account</h2>
              <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
            </div>
            <div className="p-4">
              {loadingItem || !form ? (
                <p className="text-sm text-gray-400">Loading...</p>
              ) : (
                <ChartOfAccountForm
                  form={form}
                  onChange={handleChange}
                  parentOptions={parentOptions.filter((p) => p.Id !== accountId)}
                  costCenters={costCenters}
                  loading={loading}
                  loadingData={loadingLists}
                  submitLabel="Update Account"
                  onSubmit={handleSubmit}
                />
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default function ChartOfAccounts() {
  const [search, setSearch] = useState("");
  const [treeItems, setTreeItems] = useState([]);
  const [loadingTree, setLoadingTree] = useState(true);
  const [searchItems, setSearchItems] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize] = useState(20);
  const [itemsCount, setItemsCount] = useState(0);
  const [editAccountId, setEditAccountId] = useState(null);
  const [costCenters, setCostCenters] = useState([]);
  const [loadingLists, setLoadingLists] = useState(true);

  const isSearching = search.trim() !== "";

  const fetchTree = () => {
    setLoadingTree(true);
    // GET /tree has no text filter and is the only endpoint with a
    // correctly-populated Depth — used for the default hierarchy browse
    // view (chartofaccount-api-spec.md §3.3).
    getChartOfAccountTree()
      .then((data) => setTreeItems(Array.isArray(data) ? data : []))
      .catch((error) => {
        setTreeItems([]);
        Swal.fire("Error", apiErrorMessage(error, "Unable to load the chart-of-accounts tree."), "error");
      })
      .finally(() => setLoadingTree(false));
  };

  const fetchSearch = () => {
    setLoadingSearch(true);
    // Flat GET /?text= — Depth always comes back 0 here, so this is
    // rendered unindented (search-result mode), not tree mode.
    listChartOfAccounts({ text: search, pageIndex, pageSize })
      .then((page) => {
        setSearchItems(page?.pageCollection || page?.PageCollection || []);
        setItemsCount(page?.itemsCount || page?.ItemsCount || 0);
      })
      .catch((error) => {
        setSearchItems([]);
        setItemsCount(0);
        Swal.fire("Error", apiErrorMessage(error, "Unable to search chart accounts."), "error");
      })
      .finally(() => setLoadingSearch(false));
  };

  useEffect(() => { fetchTree(); }, []);

  useEffect(() => {
    setLoadingLists(true);
    apiJson(`${FIN_BASE}/api/accounts/costcenters?pageSize=1000`)
      .then((costCenterData) => setCostCenters(normalizeList(costCenterData)))
      .catch((error) => {
        setCostCenters([]);
        Swal.fire("Error", apiErrorMessage(error, "Unable to load cost centers."), "error");
      })
      .finally(() => setLoadingLists(false));
  }, []);

  useEffect(() => {
    if (!isSearching) return;
    fetchSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, pageIndex]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPageIndex(0);
  };

  const refetchCurrent = () => {
    fetchTree();
    if (isSearching) fetchSearch();
  };

  const hasNextPage = itemsCount ? (pageIndex + 1) * pageSize < itemsCount : searchItems.length === pageSize;

  return (
    <div>
      <div className="flex justify-between items-center mb-3 gap-3">
        <Input
          value={search}
          onChange={handleSearchChange}
          placeholder="Search accounts by name..."
          className="max-w-xs"
        />
        <Link
          to="/Accounts/ChartOfAccounts/create"
          className="inline-flex items-center gap-2 rounded-md bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-sm font-medium text-white"
        >
          <FaPlus /> Add Account
        </Link>
      </div>

      <div className="grid grid-cols-12 gap-2 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-3">
        <span className="col-span-2">Code</span>
        <span className="col-span-6">Description</span>
        <span className="col-span-2">Type</span>
        <span className="col-span-2">Category</span>
      </div>

      {isSearching ? (
        loadingSearch ? (
          <div className="space-y-2 animate-pulse">
            {[1, 2, 3].map((i) => <div key={i} className="h-12 bg-gray-100 rounded-lg" />)}
          </div>
        ) : searchItems.length > 0 ? (
          <div className="space-y-2">
            {searchItems.map((item) => (
              <button
                key={item.Id}
                onClick={() => setEditAccountId(item.Id)}
                className="w-full text-left grid grid-cols-12 gap-2 items-center bg-white px-4 py-3 rounded-lg shadow border hover:border-indigo-400 transition-all"
              >
                <span className="col-span-2 font-mono text-sm text-gray-600">{item.AccountCode}</span>
                <span className="col-span-6 font-medium text-indigo-700">{item.AccountName}</span>
                <span className="col-span-2 text-sm text-gray-600">{item.AccountTypeDescription || "—"}</span>
                <span className="col-span-2 text-sm text-gray-600">{item.AccountCategoryDescription || "—"}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center mt-4">
            <img src={NotFoundImage} alt="Not Found" className="mx-auto w-32 h-auto" />
            <p className="text-gray-400 mt-2">No accounts match your search.</p>
          </div>
        )
      ) : loadingTree ? (
        <div className="space-y-2 animate-pulse">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-12 bg-gray-100 rounded-lg" />)}
        </div>
      ) : treeItems.length > 0 ? (
        <div className="space-y-2">
          {treeItems.map((item) => (
            <button
              key={item.Id}
              onClick={() => setEditAccountId(item.Id)}
              className="w-full text-left grid grid-cols-12 gap-2 items-center bg-white px-4 py-3 rounded-lg shadow border hover:border-indigo-400 transition-all"
              style={{ marginLeft: `${(item.Depth || 0) * 20}px`, width: `calc(100% - ${(item.Depth || 0) * 20}px)` }}
            >
              <span className="col-span-2 font-mono text-sm text-gray-600">{item.Code}</span>
              <span className="col-span-6 font-medium text-indigo-700">
                {item.Depth > 0 && <span className="text-gray-300 mr-1">{"— ".repeat(item.Depth)}</span>}
                {item.Description}
              </span>
              <span className="col-span-2 text-sm text-gray-600">{item.TypeDescription || "—"}</span>
              <span className="col-span-2 text-sm text-gray-600">{item.CategoryDescription || "—"}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="text-center mt-4">
          <img src={NotFoundImage} alt="Not Found" className="mx-auto w-32 h-auto" />
          <p className="text-gray-400 mt-2">No chart of accounts found.</p>
        </div>
      )}

      {isSearching && (
        <div className="flex justify-center items-center mt-4">
          <Button type="button" size="sm" disabled={pageIndex === 0} onClick={() => setPageIndex((p) => Math.max(0, p - 1))} className="flex items-center gap-1 m-2">
            <FaChevronLeft /> Prev
          </Button>
          <span>Page {pageIndex + 1}</span>
          <Button type="button" size="sm" disabled={!hasNextPage} onClick={() => setPageIndex((p) => p + 1)} className="flex items-center gap-1 m-2">
            Next <FaChevronRight />
          </Button>
        </div>
      )}

      <EditChartOfAccountDrawer
        open={!!editAccountId}
        onClose={() => setEditAccountId(null)}
        onSuccess={refetchCurrent}
        accountId={editAccountId}
        parentOptions={treeItems}
        costCenters={costCenters}
        loadingLists={loadingLists || loadingTree}
      />
    </div>
  );
}
