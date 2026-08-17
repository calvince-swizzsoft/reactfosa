import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { FaSearch, FaTimes, FaSpinner } from "react-icons/fa";
import { apiFetch, normalizeList } from "@/lib/api";

const FIN_BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
const CUSTOMER_PAGE_SIZE = 1000;
const MAX_CUSTOMER_PAGES = 500;

async function fetchAllCustomers(text, signal) {
  const customers = [];
  const seenIds = new Set();
  let previousPageSignature = null;

  for (let pageIndex = 0; pageIndex < MAX_CUSTOMER_PAGES; pageIndex += 1) {
    const params = new URLSearchParams({
      text,
      customerFilter: "0",
      pageIndex: String(pageIndex),
      pageSize: String(CUSTOMER_PAGE_SIZE),
    });
    const response = await apiFetch(`${FIN_BASE}/api/registry/customer?${params.toString()}`, { signal });
    if (!response.ok) throw new Error(`Could not load customers (${response.status})`);

    const body = await response.json();
    const payload = body?.data ?? body?.Data ?? body;
    const page = normalizeList(body);

    // A bare-array response is unpaged, so the first response is complete.
    const isBareArray = Array.isArray(payload);
    page.forEach((customer) => {
      const key = customer.Id || customer.id;
      if (!key || !seenIds.has(key)) {
        if (key) seenIds.add(key);
        customers.push(customer);
      }
    });

    const itemsCount = payload?.itemsCount ?? payload?.ItemsCount
      ?? payload?.totalCount ?? payload?.TotalCount;
    const pageSignature = page.map((customer) => customer.Id || customer.id).join("|");
    const serverRepeatedPage = page.length > 0 && pageSignature === previousPageSignature;

    if (isBareArray || page.length === 0 || serverRepeatedPage || (itemsCount != null && customers.length >= Number(itemsCount))) {
      break;
    }
    previousPageSignature = pageSignature;
  }

  return customers;
}

// CustomerDTO.FullName is a server-computed getter that can come back
// blank — IndividualSalutationDescription (and several sibling
// *Description getters on this same DTO) call EnumHelper.GetDescription
// without the Enum.IsDefined guard every other Description getter in this
// backend uses, which falls through to a literal null on an undefined
// enum value (same root cause already chased down and worked around for
// CustomerAccountDTO.CustomerFullName in the Accounts pickers — see that
// fix's commit message for the full story). Fall back to the raw
// first/last name, then the non-individual description, before ever
// showing a blank row.
export function customerDisplayName(c = {}) {
  const customer = c.Customer || c.customer || {};
  const individualName = [
    c.IndividualFirstName ?? c.CustomerIndividualFirstName ?? customer.IndividualFirstName,
    c.IndividualLastName ?? c.CustomerIndividualLastName ?? customer.IndividualLastName,
  ].filter(Boolean).join(" ").trim();

  return c.FullName
    || c.CustomerFullName
    || customer.FullName
    || individualName
    || c.NonIndividualDescription
    || c.CustomerNonIndividualDescription
    || customer.NonIndividualDescription
    || `Customer #${c.PaddedSerialNumber || c.SerialNumber || customer.PaddedSerialNumber || customer.SerialNumber || ""}`;
}

export function searchableCustomerText(customer) {
  const nested = customer.Customer || customer.customer || {};
  return [
    customerDisplayName(customer),
    customer.PaddedSerialNumber,
    customer.SerialNumber,
    customer.IdentificationNumber,
    customer.IndividualIdentificationNumber,
    customer.CustomerIndividualIdentificationNumber,
    customer.PayrollNumber,
    customer.IndividualPayrollNumber,
    customer.IndividualPayrollNumbers,
    customer.CustomerIndividualPayrollNumber,
    customer.Reference2,
    customer.Reference3,
    customer.AddressEmail,
    customer.CustomerAddressEmail,
    customer.AddressMobileLine,
    customer.CustomerAddressMobileLine,
    nested.PaddedSerialNumber,
    nested.SerialNumber,
    nested.IdentificationNumber,
    nested.PayrollNumber,
    nested.IndividualPayrollNumbers,
    nested.Reference2,
    nested.Reference3,
  ].filter((value) => value !== undefined && value !== null).join(" ").toLowerCase();
}

// Load every paginated customer once per picker opening, then search the
// complete result locally. Re-fetching every server page after each keypress
// made the picker sluggish and made matching depend on the API's narrower
// text filter.
export default function CustomerPickerModal({ title = "Select Customer", onSelect, onClose }) {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    fetchAllCustomers("", controller.signal)
      .then(setItems)
      .catch((error) => {
        if (error.name !== "AbortError") setItems([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  const filteredItems = useMemo(() => {
    const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (terms.length === 0) return items;
    return items.filter((customer) => {
      const searchable = searchableCustomerText(customer);
      return terms.every((term) => searchable.includes(term));
    });
  }, [items, query]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-[480px] max-h-[80vh] flex flex-col z-10">
        <div className="flex justify-between items-center px-5 py-4 bg-indigo-600 rounded-t-2xl">
          <h3 className="font-bold text-white text-base">{title}</h3>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors"><FaTimes /></button>
        </div>
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
            <Input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name, serial number..." className="pl-8 text-sm" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-2 py-2">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-gray-400 gap-2">
              <FaSpinner className="animate-spin" /><span className="text-sm">Loading all customers...</span>
            </div>
          ) : filteredItems.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-8">{query ? "No customers match your search." : "No customers found."}</p>
          ) : (
            filteredItems.map((c) => (
              <button
                key={c.Id}
                type="button"
                onClick={() => { onSelect({ ...c, FullName: customerDisplayName(c) }); onClose(); }}
                className="w-full text-left px-4 py-2.5 rounded-xl hover:bg-indigo-50 transition-colors"
              >
                <p className="text-sm font-semibold text-gray-800">{customerDisplayName(c)}</p>
                <p className="text-xs text-gray-500">#{c.PaddedSerialNumber} · {c.RecordStatusDescription}</p>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
