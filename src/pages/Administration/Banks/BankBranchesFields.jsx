import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FaTrash } from "react-icons/fa";

// Repeatable BankBranchDTO sub-form — the branches belonging to an
// external Bank record (not this SACCO's own branches). Field set matches
// what the legacy Administration/Bank/AddBankWithLinkagesDrawer.jsx
// already collected; only the endpoint/payload it submitted to was wrong,
// not this field shape.
export const emptyBranch = {
  Description: "",
  AddressAddressLine1: "",
  AddressAddressLine2: "",
  AddressStreet: "",
  AddressPostalCode: "",
  AddressCity: "",
  AddressEmail: "",
  AddressLandLine: "",
  AddressMobileLine: "",
  ContactPerson: "",
  PhoneNumber: "",
};

function FieldGroup({ label, children }) {
  return (
    <div>
      <Label className="text-xs font-semibold text-gray-500">{label}</Label>
      {children}
    </div>
  );
}

export default function BankBranchesFields({ branches, onChange }) {
  const updateField = (idx, field, value) => {
    const next = [...branches];
    next[idx] = { ...next[idx], [field]: value };
    onChange(next);
  };
  const addBranch = () => onChange([...branches, { ...emptyBranch }]);
  const removeBranch = (idx) => onChange(branches.filter((_, i) => i !== idx));

  return (
    <div className="space-y-3">
      {branches.map((branch, idx) => (
        <div key={idx} className="border rounded-xl p-3 space-y-3 bg-gray-50">
          <div className="flex justify-between items-center">
            <p className="text-sm font-semibold text-gray-700">Branch {idx + 1}</p>
            {branches.length > 1 && (
              <Button type="button" variant="ghost" size="sm" onClick={() => removeBranch(idx)} className="text-red-600 h-7 px-2">
                <FaTrash />
              </Button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FieldGroup label="Branch Name">
              <Input value={branch.Description} onChange={(e) => updateField(idx, "Description", e.target.value)} required />
            </FieldGroup>
            <FieldGroup label="Contact Person">
              <Input value={branch.ContactPerson} onChange={(e) => updateField(idx, "ContactPerson", e.target.value)} />
            </FieldGroup>
            <FieldGroup label="Address Line 1">
              <Input value={branch.AddressAddressLine1} onChange={(e) => updateField(idx, "AddressAddressLine1", e.target.value)} />
            </FieldGroup>
            <FieldGroup label="Address Line 2">
              <Input value={branch.AddressAddressLine2} onChange={(e) => updateField(idx, "AddressAddressLine2", e.target.value)} />
            </FieldGroup>
            <FieldGroup label="Street">
              <Input value={branch.AddressStreet} onChange={(e) => updateField(idx, "AddressStreet", e.target.value)} />
            </FieldGroup>
            <FieldGroup label="City">
              <Input value={branch.AddressCity} onChange={(e) => updateField(idx, "AddressCity", e.target.value)} />
            </FieldGroup>
            <FieldGroup label="Postal Code">
              <Input value={branch.AddressPostalCode} onChange={(e) => updateField(idx, "AddressPostalCode", e.target.value)} />
            </FieldGroup>
            <FieldGroup label="Email">
              <Input value={branch.AddressEmail} onChange={(e) => updateField(idx, "AddressEmail", e.target.value)} />
            </FieldGroup>
            <FieldGroup label="Landline">
              <Input value={branch.AddressLandLine} onChange={(e) => updateField(idx, "AddressLandLine", e.target.value)} />
            </FieldGroup>
            <FieldGroup label="Mobile">
              <Input value={branch.AddressMobileLine} onChange={(e) => updateField(idx, "AddressMobileLine", e.target.value)} />
            </FieldGroup>
            <FieldGroup label="Phone Number">
              <Input value={branch.PhoneNumber} onChange={(e) => updateField(idx, "PhoneNumber", e.target.value)} />
            </FieldGroup>
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" onClick={addBranch}>+ Add Branch</Button>
    </div>
  );
}
