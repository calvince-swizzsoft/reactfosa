import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import NotFoundImage from "/assets/scopefinding.png";
import { FaUserPlus } from "react-icons/fa";
import { apiFetch } from "@/lib/api";
import CreateCustomerDrawer from "./create";

const BASE = `${import.meta.env.VITE_APP_FIN_URL}`;

const customerTypeLabels = {
  0: "Individual",
  1: "Partnership",
  2: "Corporation",
  3: "MicroCredit",
};

export default function Customers() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);

  const normalizeList = (d) =>
    Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : Array.isArray(d?.Data) ? d.Data : [];

  const fetchItems = () => {
    setLoading(true);
    apiFetch(`${BASE}/api/registry/customers`)
      .then((r) => r.json())
      .then((d) => setItems(normalizeList(d)))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const customerName = (item) =>
    [item.IndividualFirstName, item.IndividualLastName].filter(Boolean).join(" ") ||
    item.NonIndividualDescription ||
    item.Description ||
    "—";

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
      <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FaUserPlus /> Customers
        </h2>
        <Button onClick={() => setAddOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2">
          <FaUserPlus /> Add Customer
        </Button>
      </div>

      <div className="bg-gray-200 p-4 rounded-sm">
        <div className="grid grid-cols-12 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4">
          <span className="col-span-3">Name</span>
          <span className="col-span-2">ID Number</span>
          <span className="col-span-2">Type</span>
          <span className="col-span-3">Mobile</span>
          <span className="col-span-2">Status</span>
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
                  <span className="col-span-3 font-medium text-indigo-700">{customerName(item)}</span>
                  <span className="col-span-2 text-sm text-gray-600">{item.IndividualIdentityCardNumber || "—"}</span>
                  <span className="col-span-2 text-sm text-gray-600">{item.TypeDescription || customerTypeLabels[item.Type] || "—"}</span>
                  <span className="col-span-3 text-sm text-gray-600">{item.AddressMobileLine || "—"}</span>
                  <span className="col-span-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${item.IsLocked ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}>
                      {item.IsLocked ? "Locked" : "Active"}
                    </span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-center mt-4">
            <img src={NotFoundImage} alt="Not Found" className="mx-auto w-42" />
            <p className="font-medium text-gray-400">No customers found.</p>
          </div>
        )}
      </div>

      <CreateCustomerDrawer open={addOpen} onClose={() => setAddOpen(false)} onSuccess={fetchItems} />
    </div>
  );
}
