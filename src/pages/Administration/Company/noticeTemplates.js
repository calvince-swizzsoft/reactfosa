export const templateDetails = [
  ['borrowerName', 'Borrower name'], ['recipientName', 'Recipient name'],
  ['companyName', 'Company name'], ['loanNumber', 'Loan number'],
  ['arrears', 'Overdue amount'], ['principalOverdue', 'Overdue principal'],
  ['interestOverdue', 'Overdue interest'], ['daysOverdue', 'Days overdue'],
  ['asAt', 'Balance date'], ['responseDeadline', 'Response deadline'],
];

export function starterMessage(type, channel, recipient) {
  const guarantor = recipient === 'Guarantors' || type.startsWith('Guarantor');
  const opening = {
    Reminder: 'This is a reminder that repayments on loan {{loanNumber}} are overdue.',
    FirstNotice: 'Our records show overdue repayments on loan {{loanNumber}}. Please treat this as your first defaulter notice.',
    SecondNotice: 'This is a second notice concerning overdue repayments on loan {{loanNumber}}.',
    FinalDemand: 'This is a final payment demand concerning overdue repayments on loan {{loanNumber}}.',
    GuarantorNotification: 'We are contacting you as a guarantor for {{borrowerName}} concerning overdue repayments on loan {{loanNumber}}.',
    GuarantorDemand: 'We are contacting you about your guarantee for {{borrowerName}} on loan {{loanNumber}}. Please contact us to discuss payment under the terms of your guarantee.',
  }[type] || 'Repayments on loan {{loanNumber}} are overdue.';
  if (channel === 'SMS') {
    return guarantor
      ? '{{companyName}}: {{borrowerName}} loan {{loanNumber}} has arrears of KSh {{arrears}} as at {{asAt}}. Please contact us about your guarantee by {{responseDeadline}}.'
      : '{{companyName}}: Loan {{loanNumber}} has arrears of KSh {{arrears}} as at {{asAt}}. Please pay or contact us by {{responseDeadline}}. If paid, contact us to reconcile.';
  }
  return `Dear {{recipientName}},\n\n${opening}\n\nThe overdue amount is KSh {{arrears}} as at {{asAt}}.\n\n${guarantor ? 'Please contact us by {{responseDeadline}} to discuss the arrears and your guarantee.' : 'Please make payment or contact us by {{responseDeadline}} to discuss repayment. If you have already paid, please contact us so we can reconcile your account.'}\n\n{{companyName}}`;
}

export function sampleMessage(template, stage) {
  const date = new Date(Date.UTC(2026, 8, 16));
  date.setUTCDate(date.getUTCDate() + (Number.isInteger(stage.responseDays) ? stage.responseDays : 7));
  const values = {
    borrowerName: 'Alex Mwangi', recipientName: stage.recipient === 'Guarantors' ? 'Pat Wanjiru' : 'Alex Mwangi',
    companyName: 'Sample SACCO', loanNumber: 'LN-000123', arrears: '12,500.00',
    principalOverdue: '10,000.00', interestOverdue: '2,500.00', daysOverdue: '30',
    asAt: '16 Sep 2026', responseDeadline: date.toLocaleDateString('en-GB', {day:'2-digit', month:'short', year:'numeric', timeZone:'UTC'}),
  };
  return String(template || '').replace(/\{\{(.*?)\}\}/g, (token, key) => values[key] ?? token);
}
