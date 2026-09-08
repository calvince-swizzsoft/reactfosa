import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const options = [
  { value: "0", label: "Loans" },
  { value: "1", label: "Investments" },
  { value: "2", label: "Savings" },
  { value: "3", label: "Direct Debits" },
];

export default function RecoveryPrioritySelect({ value, onChange }) {
  return (
    <Select value={String(value ?? "")} onValueChange={(next) => onChange(Number(next))}>
      <SelectTrigger aria-label="Recovery Priority">
        <SelectValue placeholder="Select recovery category" />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
