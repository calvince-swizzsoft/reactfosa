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

const toTimeSpan = (hhmm) => (hhmm ? `${hhmm}:00` : "00:00:00");
// TimeSpan usually comes back as "HH:mm:ss" (or "d.HH:mm:ss") — trim to "HH:mm" for the time input.
const fromTimeSpan = (ts) => (typeof ts === "string" ? ts.split(".").pop().slice(0, 5) : "");

// PascalCase-keyed list row (from GET /) -> the camelCase form shape shared
// with AddCompanies. Field names taken directly from CompanyDTO.cs, not
// guessed — a previous version of this mapping was already missing
// `enforceCustomerMakerChecker` entirely.
const normalizeCompany = (data) => ({
  ...emptyCompanyForm,
  id: data.Id,
  description: data.Description || "",
  vision: data.Vision || "",
  mission: data.Mission || "",
  motto: data.Motto || "",
  registrationNumber: data.RegistrationNumber || "",
  personalIdentificationNumber: data.PersonalIdentificationNumber || "",
  applicationDisplayName: data.ApplicationDisplayName || "",
  recoveryPriority: data.RecoveryPriority || "",
  addressAddressLine1: data.AddressAddressLine1 || "",
  addressAddressLine2: data.AddressAddressLine2 || "",
  addressStreet: data.AddressStreet || "",
  addressPostalCode: data.AddressPostalCode || "",
  addressCity: data.AddressCity || "",
  addressEmail: data.AddressEmail || "",
  addressLandLine: data.AddressLandLine || "",
  addressMobileLine: data.AddressMobileLine || "",
  transactionReceiptTopIndentation: data.TransactionReceiptTopIndentation ?? 0,
  transactionReceiptLeftIndentation: data.TransactionReceiptLeftIndentation ?? 0,
  transactionReceiptFooter: data.TransactionReceiptFooter || "",
  fingerprintBiometricThreshold: data.FingerprintBiometricThreshold ?? 0,
  membershipTerminationNoticePeriod: data.MembershipTerminationNoticePeriod ?? 0,
  timeDurationStartTime: fromTimeSpan(data.TimeDurationStartTime),
  timeDurationEndTime: fromTimeSpan(data.TimeDurationEndTime),
  applicationMembershipTextAlertsEnabled: !!data.ApplicationMembershipTextAlertsEnabled,
  enforceCustomerAccountMakerChecker: !!data.EnforceCustomerAccountMakerChecker,
  enforceCustomerMakerChecker: !!data.EnforceCustomerMakerChecker,
  bypassJournalVoucherAudit: !!data.BypassJournalVoucherAudit,
  bypassCreditBatchAudit: !!data.BypassCreditBatchAudit,
  bypassDebitBatchAudit: !!data.BypassDebitBatchAudit,
  bypassRefundBatchAudit: !!data.BypassRefundBatchAudit,
  bypassWireTransferBatchAudit: !!data.BypassWireTransferBatchAudit,
  bypassLoanDisbursementBatchAudit: !!data.BypassLoanDisbursementBatchAudit,
  bypassJournalReversalBatchAudit: !!data.BypassJournalReversalBatchAudit,
  bypassInterAccountTransferBatchAudit: !!data.BypassInterAccountTransferBatchAudit,
  bypassExpensePayableAudit: !!data.BypassExpensePayableAudit,
  bypassGeneralLedgerAudit: !!data.BypassGeneralLedgerAudit,
  excludeChargesInTransactionReceipt: !!data.ExcludeChargesInTransactionReceipt,
  excludeChequeMaturityDateInTransactionReceipt: !!data.ExcludeChequeMaturityDateInTransactionReceipt,
  trackGuarantorCommittedInvestments: !!data.TrackGuarantorCommittedInvestments,
  transferNetRefundableAmountToSavingsAccountOnDeathClaimSettlement:
    !!data.TransferNetRefundableAmountToSavingsAccountOnDeathClaimSettlement,
  receiveLoanRequestBeforeLoanRegistration: !!data.ReceiveLoanRequestBeforeLoanRegistration,
  localizeOnlineNotifications: !!data.LocalizeOnlineNotifications,
  isWithholdingTaxAgent: !!data.IsWithholdingTaxAgent,
  enforceBudgetControl: !!data.EnforceBudgetControl,
  isFileTrackingEnforced: !!data.IsFileTrackingEnforced,
  excludeCustomerAccountBalanceInTransactionReceipt: !!data.ExcludeCustomerAccountBalanceInTransactionReceipt,
  enforceFixedDepositBands: !!data.EnforceFixedDepositBands,
  enforceBiometricsForCashWithdrawal: !!data.EnforceBiometricsForCashWithdrawal,
  enforceTwoFactorAuthentication: !!data.EnforceTwoFactorAuthentication,
  recoverArrearsOnCashDeposit: !!data.RecoverArrearsOnCashDeposit,
  recoverArrearsOnExternalChequeClearance: !!data.RecoverArrearsOnExternalChequeClearance,
  recoverArrearsOnFixedDepositPayment: !!data.RecoverArrearsOnFixedDepositPayment,
  allowDebitBatchToOverdrawAccount: !!data.AllowDebitBatchToOverdrawAccount,
  enforceSystemLock: !!data.EnforceSystemLock,
  enforceTellerLimits: !!data.EnforceTellerLimits,
  enforceTellerCashTransferAcknowledgement: !!data.EnforceTellerCashTransferAcknowledgement,
  enforceSingleUserSession: !!data.EnforceSingleUserSession,
  customerMembershipTextAlertsEnabled: !!data.CustomerMembershipTextAlertsEnabled,
  enforceInvestmentProductExemptions: !!data.EnforceInvestmentProductExemptions,
  enforceMobileToBankReconciliationVerification: !!data.EnforceMobileToBankReconciliationVerification,
  isLocked: !!data.IsLocked,
  createdBy: data.CreatedBy,
  createdDate: data.CreatedDate,
});

export default function EditCompanies({ open, onClose, data, refresh }) {
  const [activeTab, setActiveTab] = useState("profile");
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);

  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [productsDirty, setProductsDirty] = useState(false);

  useEffect(() => {
    if (!open || !data) return;
    setActiveTab("profile");
    setForm(normalizeCompany(data));
    setProductsDirty(false);
    setLoadingProducts(true);
    Promise.all([
      apiJson(`${FIN_BASE}/api/accounts/savingsproducts`, {}, { fallbackMessage: "Failed to load savings products." }),
      apiJson(`${FIN_BASE}/api/accounts/investmentsproducts`, {}, { fallbackMessage: "Failed to load investment products." }),
      apiJson(`${COMPANY_BASE}/${data.Id}/attached-products`, {}, { fallbackMessage: "Failed to load attached products." }),
    ]).then(([savingsData, investmentData, attachedData]) => {
      const savings = normalizeList(savingsData).map((p) => ({ ...p, ProductType: "Savings" }));
      const investments = normalizeList(investmentData).map((p) => ({ ...p, ProductType: "Investment" }));
      setProducts([...savings, ...investments]);

      const attached = attachedData?.data ?? attachedData?.Data ?? {};
      const attachedIds = [
        ...(attached.investmentProductCollection || attached.InvestmentProductCollection || []),
        ...(attached.savingsProductCollection || attached.SavingsProductCollection || []),
      ].map((p) => p.id || p.Id);
      setSelectedProductIds(attachedIds);
    }).catch((error) => {
      setProducts([]);
      setSelectedProductIds([]);
      Swal.fire("Error", apiErrorMessage(error, "Unable to load mandatory products."), "error");
    }).finally(() => setLoadingProducts(false));
  }, [open, data]);

  const update = (key, value) => setForm((p) => ({ ...p, [key]: value }));
  const toggleProduct = (id) => {
    setSelectedProductIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    setProductsDirty(true);
  };

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const payload = {
        ...form,
        timeDurationStartTime: toTimeSpan(form.timeDurationStartTime),
        timeDurationEndTime: toTimeSpan(form.timeDurationEndTime),
      };
      const respData = await apiJson(`${COMPANY_BASE}/${form.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      }, { fallbackMessage: "Failed to update company." });

      // Attached products are a separate sub-resource — full-replace PUT,
      // so only fire it if the user actually touched the Mandatory Products
      // tab this session (an untouched copy could silently drop products
      // that were never loaded into `products` yet).
      if (productsDirty) {
        const selectedProducts = products.filter((p) => selectedProductIds.includes(p.Id));
        await apiJson(`${COMPANY_BASE}/${form.id}/attached-products`, {
          method: "PUT",
          body: JSON.stringify({
            investmentProductCollection: selectedProducts.filter((p) => p.ProductType === "Investment").map((p) => ({ id: p.Id })),
            savingsProductCollection: selectedProducts.filter((p) => p.ProductType === "Savings").map((p) => ({ id: p.Id })),
          }),
        }, { fallbackMessage: "Failed to update mandatory products." });
      }

      Swal.fire("Updated!", respData.message || "Company updated successfully", "success");
      refresh();
      onClose();
    } catch (err) {
      Swal.fire("Error", apiErrorMessage(err, "Unable to update company."), "error");
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
              <h2 className="font-bold text-xl text-white">Edit Company</h2>
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
              <Button onClick={handleUpdate} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
                {loading ? "Updating..." : "Update Company"}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
