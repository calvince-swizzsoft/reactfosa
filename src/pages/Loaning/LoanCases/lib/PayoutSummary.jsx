const valueOf = (item, ...names) => {
  for (const name of names) {
    if (item?.[name] !== undefined && item?.[name] !== null) return item[name];
  }
  return undefined;
};

const money = (value) => Number(value || 0).toLocaleString(undefined, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export default function PayoutSummary({ item, accounts = [] }) {
  const accountId = valueOf(item, "CustomerAccountId", "customerAccountId", "CreditCustomerAccountId", "creditCustomerAccountId");
  const accountRecord = accounts.find((account) => String(valueOf(account, "Id", "id")) === String(accountId));
  const product = valueOf(
    item,
    "CustomerAccountTypeTargetProductDescription", "customerAccountTypeTargetProductDescription",
    "CustomerAccountCustomerAccountTypeTargetProductDescription", "customerAccountCustomerAccountTypeTargetProductDescription",
    "ProductDescription", "productDescription",
    "LoanCaseLoanProductDescription", "loanCaseLoanProductDescription",
    "CreditTypeDescription", "creditTypeDescription",
  ) || valueOf(accountRecord, "CustomerAccountTypeTargetProductDescription", "customerAccountTypeTargetProductDescription", "ProductDescription", "productDescription") || "Product name unavailable";
  const accountNumber = valueOf(
    item,
    "CustomerAccountFullAccountNumber", "customerAccountFullAccountNumber",
    "FullAccountNumber", "fullAccountNumber",
  ) || valueOf(accountRecord, "FullAccountNumber", "fullAccountNumber");
  const reference = valueOf(item, "Reference", "reference", "BatchNumber", "batchNumber");
  const description = valueOf(item, "PrimaryDescription", "primaryDescription", "Description", "description");
  const principal = Number(valueOf(item, "Principal", "principal") || 0);
  const interest = Number(valueOf(item, "Interest", "interest") || 0);
  const explicitTotal = valueOf(item, "TotalValue", "totalValue", "Amount", "amount");
  const total = principal + interest > 0 ? principal + interest : Number(explicitTotal || 0);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold text-gray-800">{product}</p>
          {accountNumber && <p className="truncate text-xs text-gray-400" title={accountNumber}>{accountNumber}</p>}
        </div>
        <div className="text-right">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Amount</p>
          <p className="font-semibold text-indigo-700">{money(total)}</p>
        </div>
      </div>
      {(description || reference) && (
        <p className="text-xs text-gray-500">
          {description && <span>{description}</span>}
          {description && reference && <span> · </span>}
          {reference && <span>Reference: {reference}</span>}
        </p>
      )}
    </div>
  );
}
