import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Swal from "sweetalert2";
import { FaHandHoldingUsd, FaChevronDown } from "react-icons/fa";
import { apiErrorMessage, apiJson, normalizeList } from "@/lib/api";
import { createLoanProduct } from "./api";
import EntryPickerModal from "../BatchProcedures/lib/EntryPickerModal";
import LoanCycleRows from "./lib/LoanCycleRows";
import AppraisalFactorRows from "./lib/AppraisalFactorRows";
import DynamicChargeRows from "./lib/DynamicChargeRows";
import AuxiliaryConditionRows from "./lib/AuxiliaryConditionRows";
import DeductibleRows from "./lib/DeductibleRows";
import FieldHelp from "../SavingsProducts/FieldHelp";
import {
  LOAN_PRODUCT_SECTION_OPTIONS, LOAN_PRODUCT_CATEGORY_OPTIONS, INTEREST_CALCULATION_MODE_OPTIONS,
  INTEREST_CHARGE_MODE_OPTIONS, INTEREST_RECOVERY_MODE_OPTIONS, PAYMENT_FREQUENCY_PER_YEAR_OPTIONS,
  PAYMENT_DUE_DATE_OPTIONS, GUARANTOR_SECURITY_MODE_OPTIONS, STANDING_ORDER_TRIGGER_OPTIONS,
  PAYOUT_RECOVERY_MODE_OPTIONS, AGGREGATE_CHECK_OFF_RECOVERY_MODE_OPTIONS, ROUNDING_TYPE_OPTIONS,
  CHARGE_TYPE_OPTIONS, LoanProductSection, LoanProductCategory, InterestChargeMode, InterestRecoveryMode,
  InterestCalculationMode, PaymentFrequencyPerYear, PaymentDueDate, GuarantorSecurityMode, StandingOrderTrigger,
  PayoutRecoveryMode, AggregateCheckOffRecoveryMode, RoundingType, ChargeType,
} from "./lib/loanProductEnums";

const FIN_BASE = `${import.meta.env.VITE_APP_FIN_URL}`;

const FIELD_HELP = {
  Section: "Classifies the product by the operating section that owns and processes the loan.",
  Category: "Groups the product by lending duration/category for downstream appraisal and reporting.",
  "Annual Percentage Rate": "The annual interest rate used by the selected calculation mode when generating loan interest and repayment schedules.",
  "Calculation Mode": "Determines whether interest is calculated on a reducing balance, straight-line basis, amortized basis, or as fixed interest.",
  "Charge Mode": "Controls whether interest is charged upfront or periodically during the loan term.",
  "Recovery Mode": "Controls whether charged interest is recovered upfront or through periodic repayments.",
  "Term (Months)": "The standard repayment duration used when scheduling this product.",
  "Payment Frequency Per Year": "The number of scheduled repayments in a year, such as 12 for monthly or 52 for weekly.",
  "Minimum Principal Amount": "The smallest principal amount that may be registered under this product.",
  "Maximum Principal Amount": "The largest principal amount that may be registered under this product.",
  "Minimum Chargeable Interest Amount": "The minimum interest amount the product may charge when the calculated interest would otherwise be lower.",
  "Payment Due Date": "Places each scheduled instalment at the beginning or end of its repayment period.",
  "Grace Period (Days)": "The configured number of days allowed before normal repayment or arrears treatment begins.",
  "Consecutive Income (months)": "The number of consecutive income periods considered when assessing income eligibility.",
  "Investments Multiplier": "Multiplies eligible investment balances when determining investment-based loan entitlement.",
  "Minimum Guarantors": "The minimum number of guarantors required when the product uses guarantor security.",
  "Maximum Guarantees": "Limits how many guarantees may be attached under the product's guarantee rules.",
  "Minimum Membership Period (Months)": "The membership duration a customer must complete before qualifying for this product.",
  "Maximum Self-Guarantee Eligible %": "Caps the percentage of the required security that the borrower may provide through self-guarantee.",
  "Guarantor Security Mode": "Selects whether guarantor capacity is evaluated using income or investment balances.",
  "Reject if member has balance?": "Rejects registration when the member already has an outstanding balance for the applicable product rules.",
  "Enforce security rules?": "Requires the configured guarantor and security conditions to be satisfied during appraisal.",
  "Allow self-guarantee?": "Allows the borrower to secure part of the loan personally, subject to the maximum eligible percentage.",
  "Microcredit?": "Marks the product for the microcredit lending workflow and related processing rules.",
  "Exclude outstanding loans on max entitlement?": "Excludes existing outstanding loans from the maximum-entitlement calculation when enabled.",
  "Consider investments balance for income-based appraisal?": "Allows investment balances to contribute when the system calculates income-based eligibility.",
  "Enforce system appraisal recommendation?": "Prevents processing from disregarding the system-generated appraisal recommendation.",
  "Bypass verification on approve?": "Allows the configured loan flow to proceed without the normal verification/audit stage. Use only where governance permits.",
  "Create standing order on loan verification?": "Automatically creates the recovery standing order when the loan passes verification.",
  "Charge clearance fee?": "Applies the configured clearance fee when the relevant loan-clearing operation occurs.",
  "Track arrears?": "Enables arrears tracking for missed or underpaid scheduled amounts.",
  "Charge arrears fee?": "Allows configured arrears charges to be applied when the account falls into arrears.",
  "Disburse micro loan less deductions?": "Pays out a microloan net of applicable deductions instead of disbursing the gross approved amount.",
  "Throttle scheduled arrears recovery?": "Limits scheduled arrears recovery according to the system's throttling rules rather than recovering without that constraint.",
  "Standing Order Trigger": "Selects the event that creates or activates standing-order recovery for this product.",
  "Payout Recovery Mode": "Determines how recoveries are handled when a payout is processed.",
  "Payout Recovery %": "The percentage of a qualifying payout directed to recovery under the selected payout mode.",
  "Aggregate Check-Off Recovery Mode": "Determines how aggregate check-off receipts are allocated against the loan.",
  "Rounding Type": "Controls how calculated repayment and recovery amounts are rounded.",
  "Recovery Priority": "Sets this product's order when available funds must be shared across multiple recoveries.",
  Type: "Selects whether the minimum take-home requirement is expressed as a percentage or a fixed amount.",
  Percentage: "The minimum percentage of income that must remain after proposed loan deductions.",
  "Fixed Amount": "The minimum fixed amount that must remain after proposed loan deductions.",
  "Principal G/L Account": "The control account that carries the outstanding loan principal in the general ledger.",
  "Interest Received G/L Account": "The income account credited when loan interest is received.",
  "Interest Receivable G/L Account": "The asset account used for interest that has been charged but not yet collected.",
  "Interest Charged G/L Account": "The account used when recognizing interest charged by this loan product.",
  "Lock product?": "Prevents this product from being selected for new operational activity until an administrator unlocks it.",
};

function Section({ title, children }) {
  return (
    <div className="space-y-4 border-t border-gray-100 pt-6 first:border-t-0 first:pt-0">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{title}</p>
      <div className="grid grid-cols-2 gap-4">{children}</div>
    </div>
  );
}

function FieldGroup({ label, help, children, full }) {
  const guidance = help ?? FIELD_HELP[label];
  return (
    <div className={full ? "col-span-2" : ""}>
      <div className="flex items-center gap-1">
        <Label className="text-sm font-semibold text-gray-700">{label}</Label>
        {guidance && <FieldHelp label={label}>{guidance}</FieldHelp>}
      </div>
      {children}
    </div>
  );
}

function EnumSelect({ options, value, onChange }) {
  return (
    <select className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mt-1" value={value} onChange={(e) => onChange(Number(e.target.value))}>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function CheckboxField({ label, checked, onChange }) {
  return (
    <div className="flex items-center gap-1 text-sm text-gray-700">
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="w-4 h-4 accent-indigo-600" />
        {label}
      </label>
      {FIELD_HELP[label] && <FieldHelp label={label}>{FIELD_HELP[label]}</FieldHelp>}
    </div>
  );
}

function PickerField({ label, value, placeholder, onClick }) {
  return (
    <div>
      <div className="flex items-center gap-1 mb-1">
        <Label className="text-sm font-semibold text-gray-700">{label}</Label>
        {FIELD_HELP[label] && <FieldHelp label={label}>{FIELD_HELP[label]}</FieldHelp>}
      </div>
      <button
        type="button"
        onClick={onClick}
        className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md bg-white text-sm hover:border-indigo-400 transition-colors text-left"
      >
        <span className={value ? "text-gray-800 truncate" : "text-gray-400"}>{value || placeholder}</span>
        <FaChevronDown className="text-gray-400 text-xs flex-shrink-0 ml-2" />
      </button>
    </div>
  );
}

const emptyForm = {
  Description: "",
  LoanRegistrationLoanProductSection: LoanProductSection.FOSA,
  LoanRegistrationLoanProductCategory: LoanProductCategory.ShortTerm,
  LoanInterestAnnualPercentageRate: 0,
  LoanInterestChargeMode: InterestChargeMode.Upfront,
  LoanInterestRecoveryMode: InterestRecoveryMode.Upfront,
  LoanInterestCalculationMode: InterestCalculationMode.ReducingBalance,
  LoanRegistrationTermInMonths: 1,
  LoanRegistrationMinimumAmount: 0,
  LoanRegistrationMaximumAmount: 0,
  LoanRegistrationMinimumInterestAmount: 0,
  LoanRegistrationPaymentFrequencyPerYear: PaymentFrequencyPerYear.Monthly,
  LoanRegistrationPaymentDueDate: PaymentDueDate.EndOfPeriod,
  LoanRegistrationGracePeriod: 0,
  LoanRegistrationConsecutiveIncome: 0,
  LoanRegistrationInvestmentsMultiplier: 0,
  LoanRegistrationMinimumGuarantors: 0,
  LoanRegistrationMaximumGuarantees: 1,
  LoanRegistrationRejectIfMemberHasBalance: false,
  LoanRegistrationAllowSelfGuarantee: false,
  LoanRegistrationMinimumMembershipPeriod: 0,
  LoanRegistrationMaximumSelfGuaranteeEligiblePercentage: 0,
  LoanRegistrationGuarantorSecurityMode: GuarantorSecurityMode.Income,
  LoanRegistrationExcludeOutstandingLoansOnMaximumEntitlement: false,
  LoanRegistrationConsiderInvestmentsBalanceForIncomeBasedLoanAppraisal: false,
  LoanRegistrationEnforceSystemAppraisalRecommendation: false,
  LoanRegistrationSecurityRequired: false,
  LoanRegistrationMicrocredit: false,
  LoanRegistrationBypassAudit: false,
  LoanRegistrationCreateStandingOrderOnLoanAudit: false,
  LoanRegistrationChargeClearanceFee: false,
  LoanRegistrationTrackArrears: false,
  LoanRegistrationChargeArrearsFee: false,
  LoanRegistrationDisburseMicroLoanLessDeductions: false,
  LoanRegistrationThrottleScheduledArrearsRecovery: false,
  LoanRegistrationStandingOrderTrigger: StandingOrderTrigger.Payout,
  LoanRegistrationPayoutRecoveryMode: PayoutRecoveryMode.StandingOrder,
  LoanRegistrationPayoutRecoveryPercentage: 0,
  LoanRegistrationAggregateCheckOffRecoveryMode: AggregateCheckOffRecoveryMode.OutstandingBalance,
  LoanRegistrationRoundingType: RoundingType.NoRounding,
  TakeHomeType: ChargeType.Percentage,
  TakeHomePercentage: 0,
  TakeHomeFixedAmount: 0,
  Priority: 0,
  IsLocked: false,
  ChartOfAccountId: "", ChartOfAccountLabel: "",
  InterestReceivedChartOfAccountId: "", InterestReceivedChartOfAccountLabel: "",
  InterestReceivableChartOfAccountId: "", InterestReceivableChartOfAccountLabel: "",
  InterestChargedChartOfAccountId: "", InterestChargedChartOfAccountLabel: "",
};

export default function CreateLoanProduct() {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [picker, setPicker] = useState(null);

  const [loanProducts, setLoanProducts] = useState([]);
  const [savingsProducts, setSavingsProducts] = useState([]);
  const [investmentProducts, setInvestmentProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [loanCycles, setLoanCycles] = useState([]);
  const [appraisalFactors, setAppraisalFactors] = useState([]);
  const [dynamicCharges, setDynamicCharges] = useState([]);
  const [auxiliaryConditions, setAuxiliaryConditions] = useState([]);
  const [deductibles, setDeductibles] = useState([]);

  useEffect(() => {
    setLoadingProducts(true);
    Promise.all([
      apiJson(`${FIN_BASE}/api/accounts/loanproducts`),
      apiJson(`${FIN_BASE}/api/accounts/savingsproducts`),
      apiJson(`${FIN_BASE}/api/accounts/investmentsproducts`),
    ]).then(([loanData, savingsData, investmentData]) => {
      setLoanProducts(normalizeList(loanData));
      setSavingsProducts(normalizeList(savingsData));
      setInvestmentProducts(normalizeList(investmentData));
    }).finally(() => setLoadingProducts(false));
  }, []);

  const set = (field) => (value) => setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = [];
    if (!form.Description?.trim()) errors.push("Name is required.");
    if (!form.ChartOfAccountId) errors.push("Principal G/L Account is required.");
    if (!form.InterestReceivedChartOfAccountId) errors.push("Interest Received G/L Account is required.");
    if (!form.InterestReceivableChartOfAccountId) errors.push("Interest Receivable G/L Account is required.");
    if (!form.InterestChargedChartOfAccountId) errors.push("Interest Charged G/L Account is required.");
    const accountIds = [form.ChartOfAccountId, form.InterestReceivedChartOfAccountId, form.InterestReceivableChartOfAccountId, form.InterestChargedChartOfAccountId].filter(Boolean);
    if (new Set(accountIds).size !== accountIds.length) errors.push("Principal and interest G/L accounts must be distinct.");
    if (form.LoanInterestAnnualPercentageRate < 0 || form.LoanInterestAnnualPercentageRate > 100) errors.push("Annual Percentage Rate must be between 0% and 100%.");
    if (form.LoanRegistrationTermInMonths <= 0) errors.push("Term must be greater than zero.");
    if (form.LoanRegistrationMinimumAmount < 0) errors.push("Minimum Principal Amount cannot be negative.");
    if (form.LoanRegistrationMaximumAmount <= 0) errors.push("Maximum Principal Amount must be greater than zero.");
    if (form.LoanRegistrationMaximumAmount < form.LoanRegistrationMinimumAmount) errors.push("Maximum Principal Amount cannot be lower than Minimum Principal Amount.");
    if (form.LoanRegistrationMinimumInterestAmount < 0) errors.push("Minimum Chargeable Interest Amount cannot be negative.");
    if (form.LoanRegistrationConsecutiveIncome < 0 || form.LoanRegistrationInvestmentsMultiplier < 0 || form.LoanRegistrationMinimumGuarantors < 0 || form.LoanRegistrationGracePeriod < 0 || form.LoanRegistrationMinimumMembershipPeriod < 0) errors.push("Eligibility periods, multipliers, guarantors, and grace periods cannot be negative.");
    if (form.LoanRegistrationMaximumGuarantees <= 0) errors.push("Maximum Guarantees must be greater than zero.");
    if (form.LoanRegistrationSecurityRequired && form.LoanRegistrationMinimumGuarantors <= 0 && !form.LoanRegistrationAllowSelfGuarantee) errors.push("Security requires at least one guarantor unless self-guarantee is allowed.");
    if (form.LoanRegistrationPayoutRecoveryPercentage < 0 || form.LoanRegistrationPayoutRecoveryPercentage > 100) errors.push("Payout Recovery Percentage must be between 0% and 100%.");
    if (form.LoanRegistrationMaximumSelfGuaranteeEligiblePercentage < 0 || form.LoanRegistrationMaximumSelfGuaranteeEligiblePercentage > 100) errors.push("Maximum Self-Guarantee Eligible Percentage must be between 0% and 100%.");
    if (form.LoanRegistrationAllowSelfGuarantee && form.LoanRegistrationMaximumSelfGuaranteeEligiblePercentage <= 0) errors.push("Set a positive self-guarantee percentage when self-guarantee is allowed.");
    if (form.TakeHomeType === ChargeType.Percentage && (form.TakeHomePercentage < 0 || form.TakeHomePercentage > 100)) errors.push("Take-Home Percentage must be between 0% and 100%.");
    if (form.TakeHomeType === ChargeType.FixedAmount && form.TakeHomeFixedAmount < 0) errors.push("Take-Home Fixed Amount cannot be negative.");
    if (form.Priority < 0 || form.Priority > 3) errors.push("Recovery Priority must be between 0 and 3.");
    const rangesOverlap = (rows) => rows
      .map((row) => [Number(row.RangeLowerLimit), Number(row.RangeUpperLimit)])
      .sort((left, right) => left[0] - right[0])
      .some((range, index, sorted) => index > 0 && range[0] <= sorted[index - 1][1]);
    if (loanCycles.some((row) => row.RangeLowerLimit < 0 || row.RangeUpperLimit < row.RangeLowerLimit)) errors.push("Every loan-cycle band needs a valid non-negative range.");
    if (rangesOverlap(loanCycles)) errors.push("Loan-cycle bands cannot overlap.");
    if (appraisalFactors.some((row) => row.RangeLowerLimit < 0 || row.RangeUpperLimit < row.RangeLowerLimit || row.LoaneeMultiplier < 0 || row.GuarantorMultiplier < 0)) errors.push("Every appraisal-factor band needs a valid range and non-negative multipliers.");
    if (rangesOverlap(appraisalFactors)) errors.push("Appraisal-factor bands cannot overlap.");
    if (auxiliaryConditions.some((row) => !row.TargetLoanProductId || !row.Condition || row.MaximumEligiblePercentage < 0 || row.MaximumEligiblePercentage > 100)) errors.push("Every auxiliary condition needs a target product, at least one condition, and a percentage between 0% and 100%.");
    if (deductibles.some((row) => !row.Description?.trim() || !row.CustomerAccountTypeTargetProductId || row.ChargePercentage < 0 || row.ChargePercentage > 100 || row.ChargeFixedAmount < 0)) errors.push("Every deductible needs a name, target product, and valid non-negative charge.");
    if (dynamicCharges.some((row) => !(row.Id ?? row.id))) errors.push("Every dynamic-charge row must reference an existing charge.");
    if (errors.length) {
      Swal.fire({ icon: "warning", title: "Review Loan Product", html: `<div style="text-align:left">${errors.map((message) => `<div>• ${message}</div>`).join("")}</div>` });
      return;
    }
    setLoading(true);
    try {
      const loanProduct = { ...form };
      delete loanProduct.ChartOfAccountLabel;
      delete loanProduct.InterestReceivedChartOfAccountLabel;
      delete loanProduct.InterestReceivableChartOfAccountLabel;
      delete loanProduct.InterestChargedChartOfAccountLabel;

      await createLoanProduct({
        LoanProduct: loanProduct,
        LoanCycles: loanCycles.length ? loanCycles : null,
        AuxiliaryAppraisalFactors: appraisalFactors.length ? appraisalFactors : null,
        DynamicCharges: dynamicCharges.length ? dynamicCharges : null,
        AuxiliaryConditions: auxiliaryConditions.length ? auxiliaryConditions : null,
        Deductibles: deductibles.length ? deductibles : null,
      });
      Swal.fire("Success", "Loan product created.", "success");
      navigate("/Accounts/LoanProducts");
    } catch (err) {
      Swal.fire("Error", apiErrorMessage(err, "Unable to create the loan product."), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
      <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FaHandHoldingUsd /> New Loan Product
        </h2>
        <Button variant="outline" onClick={() => navigate("/Accounts/LoanProducts")}>Cancel</Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
        <Section title="Identity & Classification">
          <FieldGroup label="Name" full>
            <Input value={form.Description} onChange={(e) => set("Description")(e.target.value)} required />
          </FieldGroup>
          <FieldGroup label="Section">
            <EnumSelect options={LOAN_PRODUCT_SECTION_OPTIONS} value={form.LoanRegistrationLoanProductSection} onChange={set("LoanRegistrationLoanProductSection")} />
          </FieldGroup>
          <FieldGroup label="Category">
            <EnumSelect options={LOAN_PRODUCT_CATEGORY_OPTIONS} value={form.LoanRegistrationLoanProductCategory} onChange={set("LoanRegistrationLoanProductCategory")} />
          </FieldGroup>
        </Section>

        <Section title="Interest Settings">
          <FieldGroup label="Annual Percentage Rate">
            <Input type="number" step="0.01" value={form.LoanInterestAnnualPercentageRate} onChange={(e) => set("LoanInterestAnnualPercentageRate")(Number(e.target.value))} />
          </FieldGroup>
          <FieldGroup label="Calculation Mode">
            <EnumSelect options={INTEREST_CALCULATION_MODE_OPTIONS} value={form.LoanInterestCalculationMode} onChange={set("LoanInterestCalculationMode")} />
          </FieldGroup>
          <FieldGroup label="Charge Mode">
            <EnumSelect options={INTEREST_CHARGE_MODE_OPTIONS} value={form.LoanInterestChargeMode} onChange={set("LoanInterestChargeMode")} />
          </FieldGroup>
          <FieldGroup label="Recovery Mode">
            <EnumSelect options={INTEREST_RECOVERY_MODE_OPTIONS} value={form.LoanInterestRecoveryMode} onChange={set("LoanInterestRecoveryMode")} />
          </FieldGroup>
        </Section>

        <Section title="Term & Amount Settings">
          <FieldGroup label="Term (Months)">
            <Input type="number" min="1" value={form.LoanRegistrationTermInMonths} onChange={(e) => set("LoanRegistrationTermInMonths")(Number(e.target.value))} required />
          </FieldGroup>
          <FieldGroup label="Payment Frequency Per Year">
            <EnumSelect options={PAYMENT_FREQUENCY_PER_YEAR_OPTIONS} value={form.LoanRegistrationPaymentFrequencyPerYear} onChange={set("LoanRegistrationPaymentFrequencyPerYear")} />
          </FieldGroup>
          <FieldGroup label="Minimum Principal Amount">
            <Input type="number" value={form.LoanRegistrationMinimumAmount} onChange={(e) => set("LoanRegistrationMinimumAmount")(Number(e.target.value))} />
          </FieldGroup>
          <FieldGroup label="Maximum Principal Amount">
            <Input type="number" value={form.LoanRegistrationMaximumAmount} onChange={(e) => set("LoanRegistrationMaximumAmount")(Number(e.target.value))} />
          </FieldGroup>
          <FieldGroup label="Minimum Chargeable Interest Amount">
            <Input type="number" value={form.LoanRegistrationMinimumInterestAmount} onChange={(e) => set("LoanRegistrationMinimumInterestAmount")(Number(e.target.value))} />
          </FieldGroup>
          <FieldGroup label="Payment Due Date">
            <EnumSelect options={PAYMENT_DUE_DATE_OPTIONS} value={form.LoanRegistrationPaymentDueDate} onChange={set("LoanRegistrationPaymentDueDate")} />
          </FieldGroup>
          <FieldGroup label="Grace Period (Days)">
            <Input type="number" value={form.LoanRegistrationGracePeriod} onChange={(e) => set("LoanRegistrationGracePeriod")(Number(e.target.value))} />
          </FieldGroup>
        </Section>

        <Section title="Eligibility & Appraisal Settings">
          <FieldGroup label="Consecutive Income (months)">
            <Input type="number" value={form.LoanRegistrationConsecutiveIncome} onChange={(e) => set("LoanRegistrationConsecutiveIncome")(Number(e.target.value))} />
          </FieldGroup>
          <FieldGroup label="Investments Multiplier">
            <Input type="number" step="0.01" value={form.LoanRegistrationInvestmentsMultiplier} onChange={(e) => set("LoanRegistrationInvestmentsMultiplier")(Number(e.target.value))} />
          </FieldGroup>
          <FieldGroup label="Minimum Guarantors">
            <Input type="number" value={form.LoanRegistrationMinimumGuarantors} onChange={(e) => set("LoanRegistrationMinimumGuarantors")(Number(e.target.value))} />
          </FieldGroup>
          <FieldGroup label="Maximum Guarantees">
            <Input type="number" min="1" value={form.LoanRegistrationMaximumGuarantees} onChange={(e) => set("LoanRegistrationMaximumGuarantees")(Number(e.target.value))} />
          </FieldGroup>
          <FieldGroup label="Minimum Membership Period (Months)">
            <Input type="number" value={form.LoanRegistrationMinimumMembershipPeriod} onChange={(e) => set("LoanRegistrationMinimumMembershipPeriod")(Number(e.target.value))} />
          </FieldGroup>
          <FieldGroup label="Maximum Self-Guarantee Eligible %">
            <Input type="number" step="0.01" value={form.LoanRegistrationMaximumSelfGuaranteeEligiblePercentage} onChange={(e) => set("LoanRegistrationMaximumSelfGuaranteeEligiblePercentage")(Number(e.target.value))} />
          </FieldGroup>
          <FieldGroup label="Guarantor Security Mode">
            <EnumSelect options={GUARANTOR_SECURITY_MODE_OPTIONS} value={form.LoanRegistrationGuarantorSecurityMode} onChange={set("LoanRegistrationGuarantorSecurityMode")} />
          </FieldGroup>
          <div className="col-span-2 grid grid-cols-2 gap-2">
            <CheckboxField label="Reject if member has balance?" checked={form.LoanRegistrationRejectIfMemberHasBalance} onChange={set("LoanRegistrationRejectIfMemberHasBalance")} />
            <CheckboxField label="Enforce security rules?" checked={form.LoanRegistrationSecurityRequired} onChange={set("LoanRegistrationSecurityRequired")} />
            <CheckboxField label="Allow self-guarantee?" checked={form.LoanRegistrationAllowSelfGuarantee} onChange={set("LoanRegistrationAllowSelfGuarantee")} />
            <CheckboxField label="Microcredit?" checked={form.LoanRegistrationMicrocredit} onChange={set("LoanRegistrationMicrocredit")} />
            <CheckboxField label="Exclude outstanding loans on max entitlement?" checked={form.LoanRegistrationExcludeOutstandingLoansOnMaximumEntitlement} onChange={set("LoanRegistrationExcludeOutstandingLoansOnMaximumEntitlement")} />
            <CheckboxField label="Consider investments balance for income-based appraisal?" checked={form.LoanRegistrationConsiderInvestmentsBalanceForIncomeBasedLoanAppraisal} onChange={set("LoanRegistrationConsiderInvestmentsBalanceForIncomeBasedLoanAppraisal")} />
            <CheckboxField label="Enforce system appraisal recommendation?" checked={form.LoanRegistrationEnforceSystemAppraisalRecommendation} onChange={set("LoanRegistrationEnforceSystemAppraisalRecommendation")} />
          </div>
        </Section>

        <Section title="Registration Flags">
          <div className="col-span-2 grid grid-cols-2 gap-2">
            <CheckboxField label="Bypass verification on approve?" checked={form.LoanRegistrationBypassAudit} onChange={set("LoanRegistrationBypassAudit")} />
            <CheckboxField label="Create standing order on loan verification?" checked={form.LoanRegistrationCreateStandingOrderOnLoanAudit} onChange={set("LoanRegistrationCreateStandingOrderOnLoanAudit")} />
            <CheckboxField label="Charge clearance fee?" checked={form.LoanRegistrationChargeClearanceFee} onChange={set("LoanRegistrationChargeClearanceFee")} />
            <CheckboxField label="Track arrears?" checked={form.LoanRegistrationTrackArrears} onChange={set("LoanRegistrationTrackArrears")} />
            <CheckboxField label="Charge arrears fee?" checked={form.LoanRegistrationChargeArrearsFee} onChange={set("LoanRegistrationChargeArrearsFee")} />
            <CheckboxField label="Disburse micro loan less deductions?" checked={form.LoanRegistrationDisburseMicroLoanLessDeductions} onChange={set("LoanRegistrationDisburseMicroLoanLessDeductions")} />
            <CheckboxField label="Throttle scheduled arrears recovery?" checked={form.LoanRegistrationThrottleScheduledArrearsRecovery} onChange={set("LoanRegistrationThrottleScheduledArrearsRecovery")} />
            <CheckboxField label="Lock product?" checked={form.IsLocked} onChange={set("IsLocked")} />
          </div>
        </Section>

        <Section title="Recovery, Payout & Rounding">
          <FieldGroup label="Standing Order Trigger">
            <EnumSelect options={STANDING_ORDER_TRIGGER_OPTIONS} value={form.LoanRegistrationStandingOrderTrigger} onChange={set("LoanRegistrationStandingOrderTrigger")} />
          </FieldGroup>
          <FieldGroup label="Payout Recovery Mode">
            <EnumSelect options={PAYOUT_RECOVERY_MODE_OPTIONS} value={form.LoanRegistrationPayoutRecoveryMode} onChange={set("LoanRegistrationPayoutRecoveryMode")} />
          </FieldGroup>
          <FieldGroup label="Payout Recovery %">
            <Input type="number" step="0.01" value={form.LoanRegistrationPayoutRecoveryPercentage} onChange={(e) => set("LoanRegistrationPayoutRecoveryPercentage")(Number(e.target.value))} />
          </FieldGroup>
          <FieldGroup label="Aggregate Check-Off Recovery Mode">
            <EnumSelect options={AGGREGATE_CHECK_OFF_RECOVERY_MODE_OPTIONS} value={form.LoanRegistrationAggregateCheckOffRecoveryMode} onChange={set("LoanRegistrationAggregateCheckOffRecoveryMode")} />
          </FieldGroup>
          <FieldGroup label="Rounding Type">
            <EnumSelect options={ROUNDING_TYPE_OPTIONS} value={form.LoanRegistrationRoundingType} onChange={set("LoanRegistrationRoundingType")} />
          </FieldGroup>
          <FieldGroup label="Recovery Priority">
            <Input type="number" min="0" max="3" value={form.Priority} onChange={(e) => set("Priority")(Number(e.target.value))} />
          </FieldGroup>
        </Section>

        <Section title="Take-Home">
          <FieldGroup label="Type">
            <EnumSelect options={CHARGE_TYPE_OPTIONS} value={form.TakeHomeType} onChange={set("TakeHomeType")} />
          </FieldGroup>
          <FieldGroup label={form.TakeHomeType === ChargeType.Percentage ? "Percentage" : "Fixed Amount"}>
            {form.TakeHomeType === ChargeType.Percentage ? (
              <Input type="number" step="0.01" value={form.TakeHomePercentage} onChange={(e) => set("TakeHomePercentage")(Number(e.target.value))} />
            ) : (
              <Input type="number" value={form.TakeHomeFixedAmount} onChange={(e) => set("TakeHomeFixedAmount")(Number(e.target.value))} />
            )}
          </FieldGroup>
        </Section>

        <Section title="G/L Accounts">
          <PickerField label="Principal G/L Account" value={form.ChartOfAccountLabel} placeholder="Search & select..." onClick={() => setPicker("chartOfAccount")} />
          <PickerField label="Interest Received G/L Account" value={form.InterestReceivedChartOfAccountLabel} placeholder="Search & select..." onClick={() => setPicker("interestReceived")} />
          <PickerField label="Interest Receivable G/L Account" value={form.InterestReceivableChartOfAccountLabel} placeholder="Search & select..." onClick={() => setPicker("interestReceivable")} />
          <PickerField label="Interest Charged G/L Account" value={form.InterestChargedChartOfAccountLabel} placeholder="Search & select..." onClick={() => setPicker("interestCharged")} />
        </Section>

        <Section title="Loan Cycles (optional)">
          <div className="col-span-2">
            <LoanCycleRows rows={loanCycles} onChange={setLoanCycles} />
          </div>
        </Section>

        <Section title="Auxiliary Appraisal Factors (optional)">
          <div className="col-span-2">
            <AppraisalFactorRows rows={appraisalFactors} onChange={setAppraisalFactors} />
          </div>
        </Section>

        <Section title="Auxiliary Conditions (optional)">
          <div className="col-span-2">
            <AuxiliaryConditionRows rows={auxiliaryConditions} onChange={setAuxiliaryConditions} loanProducts={loanProducts} loadingLoanProducts={loadingProducts} />
          </div>
        </Section>

        <Section title="Deductibles (optional)">
          <div className="col-span-2">
            <DeductibleRows
              rows={deductibles}
              onChange={setDeductibles}
              savingsProducts={savingsProducts}
              loanProducts={loanProducts}
              investmentProducts={investmentProducts}
              loadingProducts={loadingProducts}
            />
          </div>
        </Section>

        <Section title="Dynamic Charges (optional)">
          <div className="col-span-2">
            <DynamicChargeRows rows={dynamicCharges} onChange={setDynamicCharges} />
          </div>
        </Section>

        <div className="pt-4">
          <Button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700">
            {loading ? "Creating..." : "Create Loan Product"}
          </Button>
        </div>
      </form>

      {picker && (
        <EntryPickerModal
          title="Select G/L Account"
          fetchUrl={`${FIN_BASE}/api/accounts/chartofaccounts?pageSize=1000`}
          getLabel={(i) => `${i.AccountCode} — ${i.AccountName}`}
          onSelect={(i) => {
            const label = `${i.AccountCode} — ${i.AccountName}`;
            if (picker === "chartOfAccount") setForm((p) => ({ ...p, ChartOfAccountId: i.Id, ChartOfAccountLabel: label }));
            if (picker === "interestReceived") setForm((p) => ({ ...p, InterestReceivedChartOfAccountId: i.Id, InterestReceivedChartOfAccountLabel: label }));
            if (picker === "interestReceivable") setForm((p) => ({ ...p, InterestReceivableChartOfAccountId: i.Id, InterestReceivableChartOfAccountLabel: label }));
            if (picker === "interestCharged") setForm((p) => ({ ...p, InterestChargedChartOfAccountId: i.Id, InterestChargedChartOfAccountLabel: label }));
          }}
          onClose={() => setPicker(null)}
        />
      )}
    </div>
  );
}
