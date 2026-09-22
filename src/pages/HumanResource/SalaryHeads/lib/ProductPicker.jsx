import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import FieldHelp from "@/pages/Accounts/SavingsProducts/FieldHelp";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { listSavingsProducts, listInvestmentProducts, listLoanProducts } from "./api";
import { ProductCode, PRODUCT_CODE_LABEL } from "./enums";

function FieldGroup({ label, help, htmlFor, children }) {
  return (
    <div>
      <div className="mb-1 flex items-center gap-1.5">
        <Label htmlFor={htmlFor} className="text-sm font-semibold text-gray-700">{label}</Label>
        <FieldHelp label={label}>{help}</FieldHelp>
      </div>
      {children}
    </div>
  );
}

const LISTERS = {
  [ProductCode.Savings]: listSavingsProducts,
  [ProductCode.Loan]: listLoanProducts,
  [ProductCode.Investment]: listInvestmentProducts,
};

// Two-step picker: pick a product type (Savings/Loan/Investment), then a
// specific product from that type's real list — captures both the
// product's Id (the real FK, CustomerAccountTypeTargetProductId) and its
// own Code (denormalized onto CustomerAccountTypeTargetProductCode).
export default function ProductPicker({ productCode, targetProductId, onChange }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const list = LISTERS[productCode];
    setProducts([]);
    if (!list) {
      setLoading(false);
      return;
    }
    setLoading(true);
    list()
      .then((items) => { if (active) setProducts(items); })
      .catch(() => { if (active) setProducts([]); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [productCode]);

  return (
    <>
      <FieldGroup label="Product Type" htmlFor="salaryhead-product-type" help="The kind of employee account linked to this salary head: Savings for savings accounts, Loan for loan repayments, or Investment for deposit and share contributions.">
        <Select
          value={productCode ? String(productCode) : ""}
          onValueChange={(v) => {
            // Empty native events during mount/loading are not user selections.
            if (v && Number(v) !== Number(productCode)) {
              onChange({ productCode: Number(v), targetProductId: "", targetProductCode: 0 });
            }
          }}
        >
          <SelectTrigger id="salaryhead-product-type"><SelectValue placeholder="Select Product Type" /></SelectTrigger>
          <SelectContent>
            {Object.entries(PRODUCT_CODE_LABEL).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldGroup>

      {productCode ? (
        <FieldGroup label="Product" htmlFor="salaryhead-product" help="Choose the specific product used to identify the employee account for this payroll item, such as the staff loan product or Deposit Contribution. Changing Product Type clears this selection.">
          <Select
            value={targetProductId || ""}
            onValueChange={(v) => {
              const product = products.find((p) => p.Id === v);
              if (product) onChange({ productCode: Number(productCode), targetProductId: product.Id, targetProductCode: product.Code });
            }}
            disabled={loading}
          >
            <SelectTrigger id="salaryhead-product"><SelectValue placeholder={loading ? "Loading..." : "Select Product"} /></SelectTrigger>
            <SelectContent className="max-h-60 overflow-y-auto">
              {products.map((p) => (
                <SelectItem key={p.Id} value={p.Id}>{p.Description}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldGroup>
      ) : null}
    </>
  );
}
