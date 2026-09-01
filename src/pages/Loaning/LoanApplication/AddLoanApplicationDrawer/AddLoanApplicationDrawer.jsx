import { CreateLoanCaseDrawer } from "../../LoanCases/RegistrationScreen";

// Loan Application and Loan Case Registration are the same domain operation.
// Keep this route as a thin presentation alias so both entry points use the
// canonical LoanCaseController/AppService contract and validation rules.
export default function AddLoanApplicationDrawer({ open, onClose, onSuccess }) {
  return (
    <CreateLoanCaseDrawer
      open={open}
      onClose={onClose}
      onSuccess={onSuccess}
      title="New Loan Application"
    />
  );
}
