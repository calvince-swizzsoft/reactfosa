export const manualInputs = [
  ['D15', 'Bank time deposits over 90 days', 'Amount already included in commercial-bank balances with maturity over 90 days, following the workbook label. Do not also exclude it from D13. The older completion notes say over 91 days; confirm boundary cases with your reporting policy.'],
  ['D16', 'Additional bank obligations', 'Matured bank loans and separately recorded overdrafts, including relevant accrued interest. Credit balances on bank accounts mapped above are added automatically; do not enter those again.'],
  ['D24', 'Matured non-bank borrowings', 'Matured loans and advances from other financial institutions. Exclude amounts already deducted under balances due.'],
  ['D37', 'Deposit deductions: SACCOs', 'Amounts due to other SACCOs already included in gross deposit totals. This disclosure reduces net deposits; the official liquidity ratio uses gross deposits.'],
  ['D38', 'Deposit deductions: banks', 'Amounts due to banks already included in gross deposit totals. Do not enter the overdraft deducted from liquid assets here unless it is actually part of those deposit totals.'],
  ['D39', 'Deposit deductions: other institutions', 'Amounts due to other financial institutions already included in gross deposits.'],
  ['D44', 'Other matured liabilities', 'Other liabilities already due for payment, including crystallized commitments. Use a maturity schedule; do not duplicate deposits or obligations already deducted from liquid assets.'],
  ['D45', 'Other liabilities within 91 days', 'Other liabilities maturing within 91 days, following the workbook label. The older completion notes say within 90 days; confirm boundary cases with your reporting policy. Exclude already-matured amounts entered above.'],
].map(([key, label, help]) => ({ key, label: `${label} (KSh)`, help }));
export const exclusionCells = ['D9', 'D10', 'D13', 'D19', 'D20', 'D22', 'D23', 'D27', 'D28', 'D33', 'D34'];
export function newLiquidityInputs() { return { manualAmounts: Object.fromEntries(manualInputs.map(x => [x.key, ''])), exclusions: Object.fromEntries(exclusionCells.map(k => [k, ''])), liquidityReviewed: false, reviewNotes: '' }; }
export function validateLiquidityInputs(inputs, start, end) {
  const s = new Date(start), e = new Date(end), next = new Date(s); next.setUTCFullYear(s.getUTCFullYear() + 1);
  if (!start || !end || !Number.isFinite(+s) || !Number.isFinite(+e) || s.getUTCFullYear() < 1753 || e.getUTCFullYear() >= 9999 || e < s || e >= next) return 'Choose an as-at date within the selected financial year.';
  for (const [group, keys] of [['manualAmounts', manualInputs.map(x => x.key)], ['exclusions', exclusionCells]]) {
    for (const key of keys) { const value = inputs[group]?.[key]; if (value == null || String(value).trim() === '' || !Number.isFinite(Number(value)) || Number(value) < 0 || Number(value) > 1e15) return `Enter a non-negative KSh amount for ${key}, including an explicit zero where none applies.`; }
  }
  if (!inputs.reviewNotes?.trim() || inputs.reviewNotes.length > 1000) return 'Identify the supporting bank, maturity, deposit and restriction schedules (up to 1,000 characters).';
  return '';
}
export function liquidityPayload(inputs) { return { ...inputs, ...Object.fromEntries(['manualAmounts', 'exclusions'].map(group => [group, Object.fromEntries(Object.entries(inputs[group]).map(([k, v]) => [k, Number(v)]))])) }; }
export function exclusionHelp(cell) {
  if (['D9', 'D10'].includes(cell)) return 'Exclude unavailable cash. Foreign notes must already be valued in KSh at the reporting-date rate. Cheques in hand are not notes or coins.';
  if (cell === 'D13') return 'Exclude uncleared or otherwise unavailable balances. Long-term time deposits are entered separately in D15, not deducted here. Positive balances and credit balances are split per mapped bank account.';
  if (['D27', 'D28'].includes(cell)) return 'Exclude pledged or otherwise encumbered securities from the mapped carrying value. Map bills and bonds separately; do not include private shares.';
  if (['D22', 'D23'].includes(cell)) return 'Exclude portions outside the eligible maturity scope, supported by your schedule. Do not repeat amounts entered as matured non-bank borrowings.';
  if (['D33', 'D34'].includes(cell)) return 'Exclude uncleared effects only where included in the G/L deposit figure. Include accrued interest and non-withdrawable member deposits; share capital is not a deposit.';
  return 'Exclude uncleared effects, restricted or ineligible placements, including institutions under liquidation. Support maturity eligibility with a schedule.';
}
