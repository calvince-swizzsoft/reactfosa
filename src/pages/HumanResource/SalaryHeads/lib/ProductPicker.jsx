import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { listSavingsProducts, listInvestmentProducts, listLoanProducts } from "./api";
import { ProductCode, PRODUCT_CODE_LABEL } from "./enums";

function FieldGroup({ label, children }) {
  return (
    <div>
      <Label className="text-sm font-semibold text-gray-700">{label}</Label>
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
    if (!productCode) {
      setProducts([]);
      return;
    }
    setLoading(true);
    LISTERS[productCode]()
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [productCode]);

  return (
    <>
      <FieldGroup label="Product Type">
        <Select
          value={productCode ? String(productCode) : ""}
          onValueChange={(v) => onChange({ productCode: Number(v), targetProductId: "", targetProductCode: 0 })}
        >
          <SelectTrigger><SelectValue placeholder="Select Product Type" /></SelectTrigger>
          <SelectContent>
            {Object.entries(PRODUCT_CODE_LABEL).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldGroup>

      {productCode ? (
        <FieldGroup label="Product">
          <Select
            value={targetProductId || ""}
            onValueChange={(v) => {
              const product = products.find((p) => p.Id === v);
              onChange({ productCode, targetProductId: v, targetProductCode: product?.Code ?? 0 });
            }}
            disabled={loading}
          >
            <SelectTrigger><SelectValue placeholder={loading ? "Loading..." : "Select Product"} /></SelectTrigger>
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
