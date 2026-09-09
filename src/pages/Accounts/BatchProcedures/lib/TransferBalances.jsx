const money = (value) => Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export default function TransferBalances({ account }) {
  if (!account) return null;
  const loan = Number(account.CustomerAccountTypeProductCode) === 2;
  return <div className="rounded-lg bg-gray-50 border p-3 text-sm text-gray-700">
    <p className="font-semibold">{account.FullAccountNumber} · {account.CustomerAccountTypeTargetProductDescription}</p>
    {loan ? <div className="grid grid-cols-2 gap-3 mt-2"><span>Outstanding principal: <strong>{money(Math.abs(account.PrincipalBalance))}</strong></span><span>Outstanding interest: <strong>{money(Math.abs(account.InterestBalance))}</strong></span></div> : <p className="mt-2">{Number(account.CustomerAccountTypeProductCode) === 1 ? "Available balance" : "Book balance"}: <strong>{money(Number(account.CustomerAccountTypeProductCode) === 1 ? account.AvailableBalance : account.BookBalance)}</strong></p>}
  </div>;
}
