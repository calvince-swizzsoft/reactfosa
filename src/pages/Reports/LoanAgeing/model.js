export const allocationPolicy = 'PRINCIPAL-FIFO-V1';
export function validatePlan(plan) {
  if (!plan?.instalments?.length) return 'Add the contractual principal instalments.';
  if (!plan.isConfirmed) return 'Confirm the due dates and principal amounts against the loan agreement.';
  if (!plan.evidence?.trim()) return 'Describe the supporting agreement or approved repayment schedule.';
  if (plan.isRestructuring && (!plan.interestTermsConfirmed || plan.priorRiskCategory == null)) return 'Confirm replacement interest terms and the retained pre-restructure risk category. Confirm earlier schedules first if the opening classification is unknown.';
  if (plan.interestTermsConfirmed && (!plan.interestReceivableChartOfAccountId || !plan.interestChargedChartOfAccountId || plan.interestReceivableChartOfAccountId === plan.principalChartOfAccountId || plan.interestReceivableChartOfAccountId === plan.interestChargedChartOfAccountId || plan.interestChargedChartOfAccountId === plan.principalChartOfAccountId)) return 'Configure distinct principal, interest-receivable and interest-charged accounts on the loan product before confirming interest.';
  let previous = plan.disbursementDate.slice(0, 10), cents = 0;
  for (let i = 0; i < plan.instalments.length; i++) {
    const row = plan.instalments[i], date = row.dueDate?.slice(0, 10), amount = Number(row.principal);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '') || date < previous || (i > 0 && date === previous)) return `Instalment ${i + 1}: enter increasing due dates on or after disbursement.`;
    if (!Number.isFinite(amount) || amount <= 0 || Math.abs(amount * 100 - Math.round(amount * 100)) > 0.000001) return `Instalment ${i + 1}: enter a positive amount with at most two decimal places.`;
    cents += Math.round(amount * 100); previous = date;
    if (row.interest != null && row.interest !== '' && (!Number.isFinite(Number(row.interest)) || Number(row.interest) < 0 || Math.abs(Number(row.interest) * 100 - Math.round(Number(row.interest) * 100)) > 0.000001)) return `Instalment ${i + 1}: interest must be non-negative with at most two decimals.`;
    if (row.interestDueDate && (row.interestDueDate.slice(0, 10) < plan.disbursementDate.slice(0, 10) || row.interestDueDate.slice(0, 10) > '9998-12-31')) return `Instalment ${i + 1}: interest due date must be on or after disbursement.`;
    if (plan.interestTermsConfirmed) {
      const interest = Number(row.interest), interestDate = row.interestDueDate?.slice(0, 10);
      if (row.interest == null || row.interest === '' || !Number.isFinite(interest) || interest < 0 || Math.abs(interest * 100 - Math.round(interest * 100)) > 0.000001) return `Instalment ${i + 1}: enter agreed interest with at most two decimals, or zero explicitly.`;
      if (interest > 0 && (!/^\d{4}-\d{2}-\d{2}$/.test(interestDate || '') || interestDate < plan.disbursementDate.slice(0, 10))) return `Instalment ${i + 1}: enter the contractual interest due date on or after disbursement.`;
    }
  }
  if (cents !== Math.round(Number(plan.principal) * 100)) return 'Instalment principal must equal the scheduled principal exactly. Adjust the final instalment for rounding.';
  return '';
}
export function equalPrincipalSchedule(principal, firstDueDate, count, monthsBetween) {
  count = Number(count); monthsBetween = Number(monthsBetween);
  if (!Number.isInteger(count) || count < 1 || count > 1200 || !Number.isInteger(monthsBetween) || monthsBetween < 1 || monthsBetween > 12) throw new Error('Use 1–1,200 instalments and a monthly interval between 1 and 12.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(firstDueDate || '')) throw new Error('Enter the contractual first due date.');
  const [y,m,d] = firstDueDate.split('-').map(Number), cents = Math.round(Number(principal) * 100), base = Math.floor(cents / count);
  if (base <= 0) throw new Error('Each instalment must contain at least KSh 0.01 principal.');
  return Array.from({length: count}, (_, i) => {
    const target = new Date(Date.UTC(y, m - 1 + i * monthsBetween, 1)), year = target.getUTCFullYear(), month = target.getUTCMonth();
    if (year >= 9999) throw new Error('The schedule extends beyond the supported date range.');
    const day = Math.min(d, new Date(Date.UTC(year, month + 1, 0)).getUTCDate());
    return { number: i + 1, dueDate: `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`, principal: (i === count - 1 ? cents - base * (count - 1) : base) / 100 };
  });
}
