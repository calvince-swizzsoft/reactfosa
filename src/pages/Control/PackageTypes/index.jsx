import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import NotFoundImage from "/assets/scopefinding.png";
import { FaEdit, FaPlus, FaChevronLeft, FaChevronRight, FaBoxOpen } from "react-icons/fa";
import { listPackageTypes } from "./api";
import PackageTypeDrawer from "./PackageTypeDrawer";

export default function PackageTypes() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize] = useState(20);
  const [itemsCount, setItemsCount] = useState(0);
  const [drawerItem, setDrawerItem] = useState(undefined);

  const fetchItems = () => {
    setLoading(true);
    listPackageTypes({ text: search, pageIndex, pageSize })
      .then(({ items: results, itemsCount: count }) => { setItems(results); setItemsCount(count); })
      .catch(() => { setItems([]); setItemsCount(0); })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, pageIndex]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPageIndex(0);
  };

  const hasNextPage = itemsCount ? (pageIndex + 1) * pageSize < itemsCount : items.length === pageSize;

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
      <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FaBoxOpen /> Package Types
        </h2>
        <Button onClick={() => setDrawerItem(null)} className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2">
          <FaPlus /> Add Package Type
        </Button>
      </div>

      <div className="flex flex-wrap justify-between items-center mb-4 gap-3">
        <Input
          value={search}
          onChange={handleSearchChange}
          placeholder="Search by name..."
          className="max-w-xs"
        />
      </div>

      <div className="bg-gray-200 p-4 rounded-sm">
        <div className="grid grid-cols-12 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4">
          <span className="col-span-4">Name</span>
          <span className="col-span-6">Remarks</span>
          <span className="col-span-2 text-right">Actions</span>
        </div>

        {loading ? (
          <div className="space-y-2 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="grid grid-cols-12 gap-2 bg-gray-50 p-6 rounded">
                {Array.from({ length: 12 }).map((_, j) => (
                  <div key={j} className="h-4 bg-gray-200 rounded"></div>
                ))}
              </div>
            ))}
          </div>
        ) : items.length > 0 ? (
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.Id} className="bg-white rounded-lg shadow-lg border">
                <div className="grid grid-cols-12 gap-2 items-center py-4 px-6 hover:shadow-xl transition-all">
                  <span className="col-span-4 font-medium text-indigo-700 truncate">{item.Name}</span>
                  <span className="col-span-6 text-sm text-gray-700 truncate">{item.Remarks || "—"}</span>
                  <span className="col-span-2 text-right flex justify-end gap-1">
                    <Button size="sm" variant="outline" onClick={() => setDrawerItem(item)} title="Edit package type"><FaEdit /></Button>
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-center mt-4">
            <img src={NotFoundImage} alt="Not Found" className="mx-auto w-42" />
            <p className="font-medium text-gray-400">No package types found.</p>
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

      <PackageTypeDrawer open={drawerItem !== undefined} onClose={() => setDrawerItem(undefined)} onSuccess={fetchItems} item={drawerItem} />
    </div>
  );
}
