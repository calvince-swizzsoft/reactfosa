import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";
import { FaPlus, FaChevronDown, FaTrash, FaMoneyBillWave } from "react-icons/fa";
import NotFoundImage from "/assets/scopefinding.png";
import { listLoanCases, createLoanCase, checkInProcess, lookupGuarantorEligibility, normalizeList } from "./lib/loanCaseApi";
import { LoanCaseStatus, RecordStatus } from "./lib/loanCaseEnums";
import LoanCaseStatusBadge from "./lib/LoanCaseStatusBadge";
import LoanCaseSummary from "./lib/LoanCaseSummary";
import CustomerPickerModal from "./lib/CustomerPickerModal";
import EntryPickerModal from "../../Accounts/BatchProcedures/lib/EntryPickerModal";
import QuickCreateModal from "../lib/QuickCreateModal";
import { createLoanPurpose, createLoaningRemark } from "../lib/loanMastersApi";
import { apiFetch } from "@/lib/api";

const FIN_BASE = `${import.meta.env.VITE_APP_FIN_URL}`;

function FieldGroup({ label, children }) {
  return (
    <div>
      <Label className="text-sm font-semibold text-gray-700">{label}</Label>
      {children}
    </div>
  );
}

function PickerField({ label, value, placeholder, onClick, disabled }) {
  return (
    <div>
      <Label className="text-sm font-semibold text-gray-700 mb-1 block">{label}</Label>
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md bg-white text-sm hover:border-indigo-400 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className={value ? "text-gray-800 truncate" : "text-gray-400"}>{value || placeholder}</span>
        <FaChevronDown className="text-gray-400 text-xs flex-shrink-0 ml-2" />
      </button>
    </div>
  );
}

function PickerFieldWithCreate({ label, value, placeholder, onClick, onCreateNew }) {
  return (
    <div>
      <Label className="text-sm font-semibold text-gray-700 mb-1 block">{label}</Label>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onClick}
          className="flex-1 flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md bg-white text-sm hover:border-indigo-400 transition-colors text-left"
        >
          <span className={value ? "text-gray-800 truncate" : "text-gray-400"}>{value || placeholder}</span>
          <FaChevronDown className="text-gray-400 text-xs flex-shrink-0 ml-2" />
        </button>
        <Button type="button" variant="outline" size="icon" onClick={onCreateNew} title={`New ${label}`}>
          <FaPlus className="text-xs" />
        </Button>
      </div>
    </div>
  );
}

const emptyForm = {
  CustomerId: "", CustomerLabel: "", CustomerRecordStatus: null,
  LoanProductId: "", LoanProductLabel: "", loanProduct: null,
  SavingsProductId: "", SavingsProductLabel: "",
  LoanPurposeId: "", LoanPurposeLabel: "",
  RegistrationRemarkId: "", RegistrationRemarkLabel: "",
  BranchId: "", BranchLabel: "",
  AmountApplied: "", ReceivedDate: new Date().toISOString().split("T")[0],
};

function GuarantorRow({ row, index, loanProductId, onChange, onRemove }) {
  const [picker, setPicker] = useState(false);
  const [loadingLookup, setLoadingLookup] = useState(false);

  const handlePick = async (customer) => {
    onChange(index, { ...row, GuarantorId: customer.Id, label: customer.FullName, lookup: null });
    setLoadingLookup(true);
    try {
      const lookup = await lookupGuarantorEligibility(customer.Id, loanProductId);
      onChange(index, { ...row, GuarantorId: customer.Id, label: customer.FullName, lookup });
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setLoadingLookup(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border p-3 space-y-2">
      <div className="flex items-center justify-between">
        <PickerField label={`Guarantor ${index + 1}`} value={row.label} placeholder="Pick a customer..." onClick={() => setPicker(true)} />
        <button type="button" onClick={() => onRemove(index)} className="text-red-400 hover:text-red-600 ml-2 mt-6">
          <FaTrash className="text-xs" />
        </button>
      </div>
      {loadingLookup && <p className="text-xs text-gray-400">Checking eligibility...</p>}
      {row.lookup && (
        <p className="text-xs text-gray-500">
          Total shares: {row.lookup.totalShares?.toLocaleString()} · Committed: {row.lookup.committedShares?.toLocaleString()} ·
          Available to guarantee: <span className="font-semibold text-gray-700">{row.lookup.availableToGuarantee?.toLocaleString()}</span>
        </p>
      )}
      <FieldGroup label="Amount Guaranteed">
        <Input type="number" min="0" value={row.AmountGuaranteed} onChange={(e) => onChange(index, { ...row, AmountGuaranteed: e.target.value })} />
      </FieldGroup>
      {picker && (
        <CustomerPickerModal title="Select Guarantor" onSelect={handlePick} onClose={() => setPicker(false)} />
      )}
    </div>
  );
}

function CreateLoanCaseDrawer({ open, onClose, onSuccess }) {
  const [form, setForm] = useState(emptyForm);
  const [guarantors, setGuarantors] = useState([]);
  const [collaterals, setCollaterals] = useState([]);
  const [picker, setPicker] = useState(null);
  const [creating, setCreating] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(emptyForm);
      setGuarantors([]);
      setCollaterals([]);
    }
  }, [open]);

  const needsGuarantors = form.loanProduct && !form.loanProduct.LoanRegistrationMicrocredit && form.loanProduct.LoanRegistrationSecurityRequired;

  const handlePickCustomer = async (customer) => {
    setForm((p) => ({ ...p, CustomerId: customer.Id, CustomerLabel: customer.FullName, CustomerRecordStatus: customer.RecordStatus }));
    if (customer.RecordStatus !== RecordStatus.Approved) {
      Swal.fire("Heads Up", "This customer has not yet been approved — registration will be rejected on submit unless that changes.", "warning");
    }
    try {
      const inProcess = await checkInProcess(customer.Id);
      const list = normalizeList(inProcess) || inProcess;
      if (Array.isArray(list) && list.length > 0) {
        Swal.fire("Heads Up", "This customer already has an in-process loan application. You can still submit, but the server will reject a duplicate for the same product.", "warning");
      }
    } catch {
      // non-blocking — just a courtesy check
    }
  };

  const addGuarantorRow = () => setGuarantors((p) => [...p, { GuarantorId: "", label: "", AmountGuaranteed: "", lookup: null }]);
  const updateGuarantorRow = (index, next) => setGuarantors((p) => p.map((r, i) => (i === index ? next : r)));
  const removeGuarantorRow = (index) => setGuarantors((p) => p.filter((_, i) => i !== index));

  const addCollateral = (doc) => {
    if (collaterals.some((c) => c.Id === doc.Id)) return;
    setCollaterals((p) => [...p, doc]);
  };
  const removeCollateral = (id) => setCollaterals((p) => p.filter((c) => c.Id !== id));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.CustomerId || !form.LoanProductId || !form.SavingsProductId || !form.LoanPurposeId || !form.RegistrationRemarkId || !form.BranchId || !(Number(form.AmountApplied) > 0)) {
      Swal.fire("Missing Fields", "Customer, loan product, savings product, loan purpose, registration remark, branch and a positive amount applied are all required.", "warning");
      return;
    }
    if (needsGuarantors && guarantors.length === 0) {
      Swal.fire("Missing Guarantors", "This loan product requires guarantors.", "warning");
      return;
    }
    setLoading(true);
    try {
      await createLoanCase({
        LoanCase: {
          CustomerId: form.CustomerId,
          LoanProductId: form.LoanProductId,
          SavingsProductId: form.SavingsProductId,
          LoanPurposeId: form.LoanPurposeId,
          RegistrationRemarkId: form.RegistrationRemarkId,
          BranchId: form.BranchId,
          AmountApplied: Number(form.AmountApplied),
          ReceivedDate: form.ReceivedDate,
        },
        Guarantors: guarantors.filter((g) => g.GuarantorId).map((g) => ({ GuarantorId: g.GuarantorId, AmountGuaranteed: Number(g.AmountGuaranteed) || 0 })),
        CollateralDocumentIds: collaterals.map((c) => c.Id),
      });
      Swal.fire("Success", "Loan case registered — it's now in the Registered queue.", "success");
      onSuccess();
      onClose();
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 bg-black z-40" initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div className="fixed top-0 right-0 h-full w-[560px] bg-white shadow-2xl z-50 flex flex-col" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
            <div className="m-2 flex justify-between items-center bg-indigo-600 rounded-2xl px-4 py-3">
              <h2 className="font-bold text-white">Register Loan Case</h2>
              <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              <PickerField label="Loanee" value={form.CustomerLabel} placeholder="Search & select customer..." onClick={() => setPicker("customer")} />
              <PickerField label="Loan Product" value={form.LoanProductLabel} placeholder="Select loan product..." onClick={() => setPicker("loanProduct")} />
              <PickerField label="Savings Product" value={form.SavingsProductLabel} placeholder="Select savings product..." onClick={() => setPicker("savingsProduct")} />
              <PickerFieldWithCreate label="Loan Purpose" value={form.LoanPurposeLabel} placeholder="Select loan purpose..." onClick={() => setPicker("loanPurpose")} onCreateNew={() => setCreating("loanPurpose")} />
              <PickerFieldWithCreate label="Registration Remark" value={form.RegistrationRemarkLabel} placeholder="Select remark..." onClick={() => setPicker("registrationRemark")} onCreateNew={() => setCreating("registrationRemark")} />
              <PickerField label="Branch" value={form.BranchLabel} placeholder="Select branch..." onClick={() => setPicker("branch")} />

              <div className="grid grid-cols-2 gap-3">
                <FieldGroup label="Amount Applied">
                  <Input type="number" min="0" value={form.AmountApplied} onChange={(e) => setForm((p) => ({ ...p, AmountApplied: e.target.value }))} required />
                </FieldGroup>
                <FieldGroup label="Received Date">
                  <Input type="date" value={form.ReceivedDate} onChange={(e) => setForm((p) => ({ ...p, ReceivedDate: e.target.value }))} required />
                </FieldGroup>
              </div>

              {form.loanProduct && (
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                      Guarantors {needsGuarantors ? "(required)" : "(not required for this product)"}
                    </p>
                    <Button type="button" size="sm" variant="outline" onClick={addGuarantorRow} className="flex items-center gap-1">
                      <FaPlus className="text-xs" /> Add
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {guarantors.map((row, i) => (
                      <GuarantorRow key={i} row={row} index={i} loanProductId={form.LoanProductId} onChange={updateGuarantorRow} onRemove={removeGuarantorRow} />
                    ))}
                  </div>
                </div>
              )}

              {form.CustomerId && (
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Collateral (optional)</p>
                    <Button type="button" size="sm" variant="outline" onClick={() => setPicker("collateral")} className="flex items-center gap-1">
                      <FaPlus className="text-xs" /> Add
                    </Button>
                  </div>
                  <div className="space-y-1.5">
                    {collaterals.map((c) => (
                      <div key={c.Id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-sm">
                        <span className="text-gray-700 truncate">{c.FileTitle}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-800">{c.CollateralValue?.toLocaleString()}</span>
                          <button type="button" onClick={() => removeCollateral(c.Id)} className="text-red-400 hover:text-red-600">
                            <FaTrash className="text-xs" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </form>

            <div className="shrink-0 px-4 py-3 border-t">
              <Button onClick={handleSubmit} disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700">
                {loading ? "Registering..." : "Register Loan Case"}
              </Button>
            </div>
          </motion.div>
        </>
      )}

      {picker === "customer" && (
        <CustomerPickerModal title="Select Loanee" onSelect={handlePickCustomer} onClose={() => setPicker(null)} />
      )}
      {picker === "loanProduct" && (
        <EntryPickerModal
          title="Select Loan Product"
          fetchUrl={`${FIN_BASE}/api/accounts/loanproducts`}
          getLabel={(i) => i.Description}
          onSelect={(i) => setForm((p) => ({ ...p, LoanProductId: i.Id, LoanProductLabel: i.Description, loanProduct: i }))}
          onClose={() => setPicker(null)}
        />
      )}
      {picker === "savingsProduct" && (
        <EntryPickerModal
          title="Select Savings Product"
          fetchUrl={`${FIN_BASE}/api/accounts/savingsproducts`}
          getLabel={(i) => i.Description}
          onSelect={(i) => setForm((p) => ({ ...p, SavingsProductId: i.Id, SavingsProductLabel: i.Description }))}
          onClose={() => setPicker(null)}
        />
      )}
      {picker === "loanPurpose" && (
        <EntryPickerModal
          title="Select Loan Purpose"
          fetchUrl={`${FIN_BASE}/api/backoffice/loanpurposes`}
          getLabel={(i) => i.Description}
          onSelect={(i) => setForm((p) => ({ ...p, LoanPurposeId: i.Id, LoanPurposeLabel: i.Description }))}
          onClose={() => setPicker(null)}
        />
      )}
      {picker === "registrationRemark" && (
        <EntryPickerModal
          title="Select Registration Remark"
          fetchUrl={`${FIN_BASE}/api/backoffice/loaningremarks`}
          getLabel={(i) => i.Description}
          onSelect={(i) => setForm((p) => ({ ...p, RegistrationRemarkId: i.Id, RegistrationRemarkLabel: i.Description }))}
          onClose={() => setPicker(null)}
        />
      )}
      {picker === "branch" && (
        <EntryPickerModal
          title="Select Branch"
          fetchUrl={`${FIN_BASE}/api/administration/branches/all`}
          getLabel={(i) => i.Description}
          onSelect={(i) => setForm((p) => ({ ...p, BranchId: i.Id, BranchLabel: i.Description }))}
          onClose={() => setPicker(null)}
        />
      )}
      {picker === "collateral" && (
        <EntryPickerModal
          title="Select Collateral Document"
          fetchUrl={`${FIN_BASE}/api/registry/customerdocuments?customerId=${form.CustomerId}&type=1`}
          getLabel={(i) => i.FileTitle}
          getSublabel={(i) => i.CollateralValue?.toLocaleString()}
          onSelect={addCollateral}
          onClose={() => setPicker(null)}
        />
      )}

      {creating === "loanPurpose" && (
        <QuickCreateModal
          title="New Loan Purpose"
          onCreate={createLoanPurpose}
          onCreated={(created) => setForm((p) => ({ ...p, LoanPurposeId: created.Id, LoanPurposeLabel: created.Description }))}
          onClose={() => setCreating(null)}
        />
      )}
      {creating === "registrationRemark" && (
        <QuickCreateModal
          title="New Registration Remark"
          onCreate={createLoaningRemark}
          onCreated={(created) => setForm((p) => ({ ...p, RegistrationRemarkId: created.Id, RegistrationRemarkLabel: created.Description }))}
          onClose={() => setCreating(null)}
        />
      )}
    </AnimatePresence>
  );
}

function LoanCaseDetailDrawer({ loanCaseId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDetail = () => {
    if (!loanCaseId) return;
    setLoading(true);
    apiFetch(`${FIN_BASE}/api/backoffice/loancases/${loanCaseId}`)
      .then((r) => r.json())
      .then((body) => setData(body?.data ?? body))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchDetail(); }, [loanCaseId]);

  if (!loanCaseId) return null;

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 bg-black z-40" initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div className="fixed top-0 right-0 h-full w-[520px] bg-white shadow-2xl z-50 flex flex-col" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
        <div className="m-2 flex justify-between items-center bg-indigo-600 rounded-2xl px-4 py-3">
          <h2 className="font-bold text-white">Loan Case Detail</h2>
          <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {loading ? (
            <div className="space-y-2 animate-pulse">{[1, 2, 3].map((i) => <div key={i} className="h-10 bg-gray-100 rounded-lg" />)}</div>
          ) : data ? (
            <LoanCaseSummary loanCase={data.loanCase} guarantors={data.guarantors} collaterals={data.collaterals} editableCollaterals onCollateralsSaved={fetchDetail} />
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">Not found.</p>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function RegistrationScreen() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const fetchList = () => {
    setLoading(true);
    listLoanCases({ status: LoanCaseStatus.Registered, pageSize: 100 })
      .then((page) => setItems(page?.pageCollection || page?.PageCollection || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchList(); }, []);

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
      <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FaMoneyBillWave /> Loan Case Registration
        </h2>
        <Button onClick={() => setCreateOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2">
          <FaPlus /> New Loan Case
        </Button>
      </div>

      <div className="bg-gray-200 p-4 rounded-sm">
        <div className="grid grid-cols-12 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4 text-sm">
          <span className="col-span-2">Case No</span>
          <span className="col-span-4">Customer</span>
          <span className="col-span-2">Amount Applied</span>
          <span className="col-span-2">Product</span>
          <span className="col-span-2">Status</span>
        </div>

        {loading ? (
          <div className="space-y-2 animate-pulse">
            {[1, 2, 3].map((i) => <div key={i} className="h-12 bg-gray-100 rounded-lg" />)}
          </div>
        ) : items.length > 0 ? (
          <div className="space-y-2">
            {items.map((loanCase) => (
              <button
                key={loanCase.Id}
                type="button"
                onClick={() => setSelectedId(loanCase.Id)}
                className="w-full text-left bg-white rounded-lg shadow-lg border hover:shadow-xl transition-all"
              >
                <div className="grid grid-cols-12 gap-2 items-center py-3 px-6 text-sm">
                  <span className="col-span-2 font-medium text-indigo-700">{loanCase.PaddedCaseNumber}</span>
                  <span className="col-span-4 text-gray-700 truncate">{loanCase.CustomerFullName}</span>
                  <span className="col-span-2 font-semibold text-gray-800">{loanCase.AmountApplied?.toLocaleString()}</span>
                  <span className="col-span-2 text-gray-700 truncate">{loanCase.LoanProductDescription}</span>
                  <span className="col-span-2"><LoanCaseStatusBadge status={loanCase.Status} /></span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <img src={NotFoundImage} alt="Not Found" className="mx-auto w-42" />
            <p className="text-gray-400 font-medium">No loan cases in the Registered queue.</p>
          </div>
        )}
      </div>

      <CreateLoanCaseDrawer open={createOpen} onClose={() => setCreateOpen(false)} onSuccess={fetchList} />
      <LoanCaseDetailDrawer loanCaseId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}
