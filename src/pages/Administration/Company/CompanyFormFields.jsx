import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  PROFILE_FIELDS, ADDRESS_FIELDS,
  RECEIPT_NUMBER_FIELDS, RECEIPT_TEXT_FIELDS, RECEIPT_TOGGLES,
  SCHEDULE_NUMBER_FIELDS, SCHEDULE_TIME_FIELDS,
  VERIFICATION_TOGGLES, BATCH_AUDIT_TOGGLES, OPERATIONAL_TOGGLES,
  SECURITY_TOGGLES, NOTIFICATION_TOGGLES,
} from "./companyFormConfig";

function FieldGroup({ label, children }) {
  return (
    <div>
      <Label className="text-sm font-semibold text-gray-700">{label}</Label>
      {children}
    </div>
  );
}

function TextFields({ fields, form, update }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {fields.map(([key, label]) => (
        <FieldGroup key={key} label={label}>
          <Input value={form[key] || ""} onChange={(e) => update(key, e.target.value)} />
        </FieldGroup>
      ))}
    </div>
  );
}

function ToggleGrid({ toggles, form, update }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {toggles.map(([key, label]) => (
        <label key={key} className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={!!form[key]}
            onChange={(e) => update(key, e.target.checked)}
            className="w-4 h-4 accent-indigo-600"
          />
          <span className="text-sm font-medium text-gray-700">{label}</span>
        </label>
      ))}
    </div>
  );
}

function SectionTitle({ children }) {
  return <h3 className="text-lg font-semibold mb-3 bg-indigo-700 text-white p-3 rounded-2xl">{children}</h3>;
}

export default function CompanyFormFields({
  activeTab, form, update,
  products, loadingProducts, selectedProductIds, toggleProduct,
}) {
  if (activeTab === "profile") {
    return (
      <section>
        <SectionTitle>Profile</SectionTitle>
        <TextFields fields={PROFILE_FIELDS} form={form} update={update} />
      </section>
    );
  }

  if (activeTab === "address") {
    return (
      <section>
        <SectionTitle>Address Information</SectionTitle>
        <TextFields fields={ADDRESS_FIELDS} form={form} update={update} />
      </section>
    );
  }

  if (activeTab === "receipt") {
    return (
      <section className="space-y-4">
        <SectionTitle>Receipt Settings</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {RECEIPT_NUMBER_FIELDS.map(([key, label]) => (
            <FieldGroup key={key} label={label}>
              <Input type="number" value={form[key] ?? 0} onChange={(e) => update(key, Number(e.target.value))} />
            </FieldGroup>
          ))}
          {RECEIPT_TEXT_FIELDS.map(([key, label]) => (
            <div key={key} className="md:col-span-2">
              <FieldGroup label={label}>
                <Input value={form[key] || ""} onChange={(e) => update(key, e.target.value)} />
              </FieldGroup>
            </div>
          ))}
        </div>
        <ToggleGrid toggles={RECEIPT_TOGGLES} form={form} update={update} />
      </section>
    );
  }

  if (activeTab === "schedule") {
    return (
      <section>
        <SectionTitle>Schedule & Limits</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SCHEDULE_NUMBER_FIELDS.map(([key, label]) => (
            <FieldGroup key={key} label={label}>
              <Input type="number" value={form[key] ?? 0} onChange={(e) => update(key, Number(e.target.value))} />
            </FieldGroup>
          ))}
          {SCHEDULE_TIME_FIELDS.map(([key, label]) => (
            <FieldGroup key={key} label={label}>
              <Input type="time" value={form[key] || ""} onChange={(e) => update(key, e.target.value)} />
            </FieldGroup>
          ))}
        </div>
      </section>
    );
  }

  if (activeTab === "verification") {
    return (
      <section className="space-y-4">
        <SectionTitle>Verification & Batch Audits</SectionTitle>
        <ToggleGrid toggles={VERIFICATION_TOGGLES} form={form} update={update} />
        <p className="text-xs text-gray-400 pt-2">
          "Bypass" toggles skip the corresponding maker-checker verification step for that batch type.
        </p>
        <ToggleGrid toggles={BATCH_AUDIT_TOGGLES} form={form} update={update} />
      </section>
    );
  }

  if (activeTab === "operational") {
    return (
      <section>
        <SectionTitle>Operational Policies</SectionTitle>
        <ToggleGrid toggles={OPERATIONAL_TOGGLES} form={form} update={update} />
      </section>
    );
  }

  if (activeTab === "security") {
    return (
      <section className="space-y-4">
        <SectionTitle>Security & Access</SectionTitle>
        <ToggleGrid toggles={SECURITY_TOGGLES} form={form} update={update} />
        <div className="rounded-lg border p-3 bg-gray-50">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={!!form.isLocked}
              onChange={(e) => update("isLocked", e.target.checked)}
              className="w-4 h-4 accent-indigo-600"
            />
            <span className="text-sm font-medium text-gray-700">Is Locked</span>
          </label>
          <p className="text-xs text-gray-400 mt-1">
            Checking this on a previously-unlocked company locks it as part of saving this form — there's
            no separate lock/unlock action, this checkbox is the lock switch.
          </p>
        </div>
      </section>
    );
  }

  if (activeTab === "notifications") {
    return (
      <section>
        <SectionTitle>Notifications</SectionTitle>
        <ToggleGrid toggles={NOTIFICATION_TOGGLES} form={form} update={update} />
      </section>
    );
  }

  if (activeTab === "products") {
    return (
      <section>
        <SectionTitle>Mandatory Products</SectionTitle>
        <p className="text-sm text-gray-500 mb-3">
          Savings/investment products every new customer at this company gets auto-attached.
        </p>
        {loadingProducts ? (
          <p className="text-sm text-gray-400">Loading products...</p>
        ) : products.length === 0 ? (
          <p className="text-sm text-gray-400">No products available.</p>
        ) : (
          <div className="divide-y rounded-lg border">
            {products.map((p) => (
              <label key={p.Id} className="flex items-center gap-2 px-3 py-2.5 cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={selectedProductIds.includes(p.Id)}
                  onChange={() => toggleProduct(p.Id)}
                  className="w-4 h-4 accent-indigo-600"
                />
                <span className="text-sm text-gray-700">{p.ProductType} — {p.Description}</span>
              </label>
            ))}
          </div>
        )}
      </section>
    );
  }

  if (activeTab === "debitTypes") {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        This section isn't wired up yet — no debit-types list endpoint is documented for this
        controller to build a picker against. Coming soon.
      </div>
    );
  }

  return null;
}
