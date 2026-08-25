import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Swal from "sweetalert2";
import { apiErrorMessage, apiJson } from "@/lib/api";
import { TABS, emptyCompanyForm } from "./companyFormConfig";
import CompanyFormFields from "./CompanyFormFields";

const FIN_BASE = `${import.meta.env.VITE_APP_MEMBERSHIP_URL}`;
const COMPANY_BASE = `${FIN_BASE}/api/administration/companies`;

const normalizeList = (d) => {
  const payload = d?.data ?? d?.Data ?? d;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.PageCollection)) return payload.PageCollection;
  if (Array.isArray(payload?.pageCollection)) return payload.pageCollection;
  return [];
};

// TimeSpan fields need "HH:mm:ss"; the <input type="time"> only gives "HH:mm".
const toTimeSpan = (hhmm) => (hhmm ? `${hhmm}:00` : "00:00:00");

export default function AddCompanies({ open, onClose, refresh }) {
  const [activeTab, setActiveTab] = useState("profile");
  const [form, setForm] = useState(emptyCompanyForm);
  const [loading, setLoading] = useState(false);

  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState([]);

  useEffect(() => {
    if (!open) return;
    setActiveTab("profile");
    setForm(emptyCompanyForm);
    setSelectedProductIds([]);
    setLoadingProducts(true);
    Promise.all([
      apiJson(`${FIN_BASE}/api/accounts/savingsproducts`, {}, { fallbackMessage: "Failed to load savings products." }),
      apiJson(`${FIN_BASE}/api/accounts/investmentsproducts`, {}, { fallbackMessage: "Failed to load investment products." }),
    ]).then(([savingsData, investmentData]) => {
      const savings = normalizeList(savingsData).map((p) => ({ ...p, ProductType: "Savings" }));
      const investments = normalizeList(investmentData).map((p) => ({ ...p, ProductType: "Investment" }));
      setProducts([...savings, ...investments]);
    }).catch((error) => {
      setProducts([]);
      Swal.fire("Error", apiErrorMessage(error, "Unable to load mandatory products."), "error");
    }).finally(() => setLoadingProducts(false));
  }, [open]);

  const update = (key, value) => setForm((p) => ({ ...p, [key]: value }));
  const toggleProduct = (id) =>
    setSelectedProductIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const handleSubmit = async () => {
    if (!form.description) {
      Swal.fire("Missing Field", "Description is required.", "warning");
      return;
    }
    setLoading(true);
    try {
      const selectedProducts = products.filter((p) => selectedProductIds.includes(p.Id));
      const payload = {
        company: {
          ...form,
          timeDurationStartTime: toTimeSpan(form.timeDurationStartTime),
          timeDurationEndTime: toTimeSpan(form.timeDurationEndTime),
        },
        mandatoryProducts: {
          investmentProductCollection: selectedProducts.filter((p) => p.ProductType === "Investment").map((p) => ({ id: p.Id })),
          savingsProductCollection: selectedProducts.filter((p) => p.ProductType === "Savings").map((p) => ({ id: p.Id })),
        },
      };

      const data = await apiJson(COMPANY_BASE, {
        method: "POST",
        body: JSON.stringify(payload),
      }, { fallbackMessage: "Failed to add company." });

      Swal.fire("Success!", data.message || "Company added successfully", "success");
      refresh();
      onClose();
    } catch (err) {
      Swal.fire("Error", apiErrorMessage(err, "Unable to add company."), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-black z-40"
            initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed top-3 right-3 w-[85vw] max-w-[1150px] h-[92vh] max-h-[92vh] bg-white shadow-2xl z-50 flex flex-col rounded-2xl overflow-hidden"
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 280, damping: 28 }}
          >
            <div className="p-4 flex justify-between items-center bg-indigo-700 rounded-2xl m-2 shrink-0">
              <h2 className="font-bold text-xl text-white">Add New Company</h2>
              <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
            </div>

            <div className="grid grid-cols-12 gap-3 px-3 pt-2 pb-3 flex-1 overflow-hidden">
              <aside className="col-span-3 bg-gray-200 p-3 rounded-lg overflow-y-auto">
                {TABS.map((tab) => (
                  <Card
                    key={tab.id}
                    className={`p-3 mb-2 cursor-pointer border text-sm font-medium transition-colors ${activeTab === tab.id
                      ? "bg-indigo-700 border-indigo-500 text-white"
                      : "bg-white border-transparent hover:bg-gray-100 text-gray-700"
                      }`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <p>{tab.label}</p>
                    {tab.stub && <span className="block text-xs opacity-70 mt-0.5">Coming soon</span>}
                  </Card>
                ))}
              </aside>

              <main className="col-span-9 overflow-y-auto pr-1">
                <CompanyFormFields
                  activeTab={activeTab}
                  form={form}
                  update={update}
                  products={products}
                  loadingProducts={loadingProducts}
                  selectedProductIds={selectedProductIds}
                  toggleProduct={toggleProduct}
                />
              </main>
            </div>

            <div className="px-5 py-3 border-t bg-gray-50 flex justify-end rounded-b-2xl shrink-0">
              <Button onClick={handleSubmit} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
                {loading ? "Submitting..." : "Create Company"}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
