export const emailStatuses = [
  [4, "Pending"], [8, "Sent"], [2, "Failed"],
  [1, "Unknown"], [16, "Not Applicable"], [32, "Submitted (legacy)"],
];

export function emailStatusLabel(item) {
  const code = Number(item?.mailMessageDLRStatus ?? item?.MailMessageDLRStatus);
  const label = emailStatuses.find(([value]) => value === code)?.[1];
  const description = item?.mailMessageDLRStatusDescription ?? item?.MailMessageDLRStatusDescription;
  return label || (description === "Delivered" ? "Sent" : description) || "Unknown";
}

export const emailStatusHelp = "Pending: waiting to send. Sent: accepted by the outgoing mail server; this does not confirm inbox delivery or reading. Failed: a send attempt raised an error; automatic retries stop once the failure is saved. Unknown: an unclassified record that may still be queued. Not Applicable: excluded from automatic sending. Submitted: a legacy status unused by the current email sender.";
