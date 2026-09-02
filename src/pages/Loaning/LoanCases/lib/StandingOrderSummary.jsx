const valueOf = (item, ...names) => {
  for (const name of names) {
    if (item?.[name] !== undefined && item?.[name] !== null) return item[name];
  }
  return undefined;
};

const TRIGGER_LABELS = { 0: "Payout", 1: "Check-Off", 2: "Schedule", 3: "Sweep", 4: "Microloan" };

const formatNumber = (value) => Number(value || 0).toLocaleString(undefined, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export default function StandingOrderSummary({ item, accounts = [] }) {
  const triggerValue = Number(valueOf(item, "Trigger", "trigger"));
  const trigger = valueOf(item, "TriggerDescription", "triggerDescription") || TRIGGER_LABELS[triggerValue] || "Standing order";
  const sourceAccountId = valueOf(item, "BenefactorCustomerAccountId", "benefactorCustomerAccountId");
  const destinationAccountId = valueOf(item, "BeneficiaryCustomerAccountId", "beneficiaryCustomerAccountId");
  const sourceAccountRecord = accounts.find((account) => String(valueOf(account, "Id", "id")) === String(sourceAccountId));
  const destinationAccountRecord = accounts.find((account) => String(valueOf(account, "Id", "id")) === String(destinationAccountId));
  const sourceProduct = valueOf(
    item,
    "BenefactorCustomerAccountTypeTargetProductDescription", "benefactorCustomerAccountTypeTargetProductDescription",
    "BenefactorCustomerAccountCustomerAccountTypeTargetProductDescription", "benefactorCustomerAccountCustomerAccountTypeTargetProductDescription",
    "BenefactorProductDescription", "benefactorProductDescription",
  ) || valueOf(sourceAccountRecord, "CustomerAccountTypeTargetProductDescription", "customerAccountTypeTargetProductDescription", "ProductDescription", "productDescription") || "Product name unavailable";
  const destinationProduct = valueOf(
    item,
    "BeneficiaryCustomerAccountTypeTargetProductDescription", "beneficiaryCustomerAccountTypeTargetProductDescription",
    "BeneficiaryCustomerAccountCustomerAccountTypeTargetProductDescription", "beneficiaryCustomerAccountCustomerAccountTypeTargetProductDescription",
    "BeneficiaryProductDescription", "beneficiaryProductDescription",
  ) || valueOf(destinationAccountRecord, "CustomerAccountTypeTargetProductDescription", "customerAccountTypeTargetProductDescription", "ProductDescription", "productDescription") || "Product name unavailable";
  const sourceAccount = valueOf(item, "BenefactorFullAccountNumber", "benefactorFullAccountNumber") || valueOf(sourceAccountRecord, "FullAccountNumber", "fullAccountNumber");
  const destinationAccount = valueOf(item, "BeneficiaryFullAccountNumber", "beneficiaryFullAccountNumber") || valueOf(destinationAccountRecord, "FullAccountNumber", "fullAccountNumber");
  const frequency = valueOf(item, "ScheduleFrequencyDescription", "scheduleFrequencyDescription");
  const principal = Number(valueOf(item, "Principal", "principal") || 0);
  const interest = Number(valueOf(item, "Interest", "interest") || 0);
  const loanPayment = principal + interest;
  const fixedAmount = Number(valueOf(item, "ChargeFixedAmount", "chargeFixedAmount", "Amount", "amount") || 0);
  const percentage = Number(valueOf(item, "ChargePercentage", "chargePercentage") || 0);
  const amount = loanPayment > 0
    ? formatNumber(loanPayment)
    : fixedAmount > 0
      ? formatNumber(fixedAmount)
      : percentage > 0
        ? `${percentage.toLocaleString()}%`
        : triggerValue === 3 ? "Full available balance" : "Amount not configured";

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="rounded bg-indigo-100 px-2 py-1 text-xs font-semibold text-indigo-700">Trigger: {trigger}</span>
        <span className="font-semibold text-gray-800">{amount}</span>
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold text-gray-800">{sourceProduct}</p>
          <p className="truncate text-xs text-gray-400" title={sourceAccount}>{sourceAccount || "Account number unavailable"}</p>
        </div>
        <span className="text-gray-400" aria-hidden="true">→</span>
        <div className="min-w-0 text-right">
          <p className="truncate font-semibold text-gray-800">{destinationProduct}</p>
          <p className="truncate text-xs text-gray-400" title={destinationAccount}>{destinationAccount || "Account number unavailable"}</p>
        </div>
      </div>
      {frequency && <p className="text-xs text-gray-500">Frequency: {frequency}</p>}
    </div>
  );
}
