import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Swal from "sweetalert2";
import { FaChevronLeft, FaChevronRight, FaIdCard, FaSearch, FaUserCircle } from "react-icons/fa";
import NotFoundImage from "/assets/scopefinding.png";
import { getAccountHistory, getCustomerStatus, searchCustomers } from "./api";

const TABS = [
  ["accounts", "Account Listings"], ["selected", "Selected Account Details"],
  ["particulars", "Individual Particulars"], ["address", "Address"],
  ["referees", "Referees & Specimen"], ["related", "Related Facilities"],
];
const RELATED = [
  ["signatories", "Signatories"], ["standingOrders", "Standing Orders"],
  ["alternateChannels", "Alternate Channels"], ["unclearedCheques", "Uncleared Cheques"],
  ["fixedDeposits", "Fixed Deposits"], ["loansGuaranteed", "Loans Guaranteed"],
  ["loanGuarantors", "Loan Guarantors"], ["electronicFundsTransfers", "Electronic Funds Transfers"],
];
const CUSTOMER_FILTERS = [
  [2, "First name"], [3, "Last name"], [4, "Identity card number"],
  [5, "Payroll / employment number"], [16, "Account number"],
  [0, "Serial number"], [1, "Personal identification number"],
  [6, "Organisation name"], [7, "Organisation registration number"],
];
const v = (obj, ...names) => names.map((name) => obj?.[name]).find((value) => value !== undefined && value !== null) ?? "";
const money = (value) => Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const customerName = (c) => v(c, "FullName", "fullName") || [v(c, "IndividualFirstName", "individualFirstName"), v(c, "IndividualLastName", "individualLastName")].filter(Boolean).join(" ") || v(c, "NonIndividualDescription", "nonIndividualDescription") || "Unnamed customer";
const accountId = (a) => v(a, "Id", "id");

function DetailGrid({ items }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">{items.map(([label, value]) => <div key={label} className="bg-gray-50 border rounded-lg p-3"><p className="text-xs uppercase tracking-wide text-gray-400">{label}</p><p className="text-sm font-medium text-gray-700 break-words">{value || "—"}</p></div>)}</div>;
}

function RelatedList({ rows }) {
  if (!rows?.length) return <p className="text-center text-gray-400 py-8">No records found.</p>;
  return <div className="space-y-2">{rows.map((row, index) => <div key={v(row, "Id", "id") || index} className="bg-white rounded-lg shadow border p-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">{Object.entries(row).filter(([key]) => !/^id$/i.test(key) && !/customeraccountid/i.test(key)).slice(0, 9).map(([key, value]) => <div key={key}><span className="text-xs text-gray-400 block">{key.replace(/([A-Z])/g, " $1").trim()}</span><span className="text-gray-700">{typeof value === "boolean" ? (value ? "Yes" : "No") : value === null || value === "" ? "—" : String(value)}</span></div>)}</div>)}</div>;
}

export default function AccountStatuses() {
  const [search, setSearch] = useState("");
  const [customerFilter, setCustomerFilter] = useState(2);
  const [customers, setCustomers] = useState([]);
  const [itemsCount, setItemsCount] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [status, setStatus] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [tab, setTab] = useState("accounts");
  const [relatedTab, setRelatedTab] = useState("signatories");
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [history, setHistory] = useState([]);

  const fetchCustomers = async () => {
    setLoadingCustomers(true);
    try {
      const page = await searchCustomers({ text: search.trim(), customerFilter, pageIndex, pageSize: 20 });
      setCustomers(v(page, "PageCollection", "pageCollection") || []);
      setItemsCount(Number(v(page, "ItemsCount", "itemsCount") || 0));
    } catch (error) { setCustomers([]); Swal.fire("Unable to search customers", error.message, "error"); }
    finally { setLoadingCustomers(false); }
  };
  useEffect(() => { fetchCustomers(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [pageIndex]);

  const selectCustomer = async (customer) => {
    setLoadingStatus(true); setStatus(null); setSelectedAccount(null); setHistory([]);
    try { setStatus(await getCustomerStatus(v(customer, "Id", "id"))); setTab("accounts"); }
    catch (error) { Swal.fire(error.message.includes("permission") ? "Access denied" : "Unable to load account status", error.message, error.message.includes("permission") ? "warning" : "error"); }
    finally { setLoadingStatus(false); }
  };

  const selectAccount = async (account) => {
    setSelectedAccount(account); setTab("selected"); setHistory([]);
    try { const result = await getAccountHistory(accountId(account)); setHistory(Array.isArray(result) ? result : v(result, "PageCollection", "pageCollection") || []); }
    catch { setHistory([]); }
  };

  const customer = v(status, "customer", "Customer") || {};
  const accounts = v(status, "accounts", "Accounts") || [];
  const selectedId = accountId(selectedAccount);
  const selectedSignatories = (v(status, "signatories", "Signatories") || []).filter((x) => String(v(x, "CustomerAccountId", "customerAccountId")) === String(selectedId));
  const selectedOrders = (v(status, "standingOrders", "StandingOrders") || []).filter((x) => [v(x, "BenefactorCustomerAccountId", "benefactorCustomerAccountId"), v(x, "BeneficiaryCustomerAccountId", "beneficiaryCustomerAccountId")].map(String).includes(String(selectedId)));
  const selectedChannels = (v(status, "alternateChannels", "AlternateChannels") || []).filter((x) => String(v(x, "CustomerAccountId", "customerAccountId")) === String(selectedId));
  const specimen = useMemo(() => [
    ["Passport", Boolean(v(customer, "PassportImageId", "passportImageId"))], ["Signature", Boolean(v(customer, "SignatureImageId", "signatureImageId"))],
    ["Identity Card Front", Boolean(v(customer, "IdentityCardFrontSideImageId", "identityCardFrontSideImageId"))], ["Identity Card Back", Boolean(v(customer, "IdentityCardBackSideImageId", "identityCardBackSideImageId"))],
  ], [customer]);

  return <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
    <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl"><h2 className="text-xl font-bold text-white flex items-center gap-2"><FaUserCircle /> Account Statuses</h2></div>
    <div className="grid grid-cols-1 xl:grid-cols-[340px_1fr] gap-6">
      <aside className="bg-gray-200 p-4 rounded-lg self-start">
        <p className="font-semibold text-gray-700 mb-2">Customer lookup</p>
        <form onSubmit={(e) => { e.preventDefault(); if (pageIndex === 0) fetchCustomers(); else setPageIndex(0); }} className="space-y-2 mb-3"><select value={customerFilter} onChange={(e) => setCustomerFilter(Number(e.target.value))} className="w-full h-10 border border-gray-300 rounded-md bg-white px-3 text-sm">{CUSTOMER_FILTERS.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select><div className="flex gap-2"><div className="relative flex-1"><FaSearch className="absolute left-3 top-3 text-gray-400" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`Search by ${CUSTOMER_FILTERS.find(([id]) => id === customerFilter)?.[1].toLowerCase()}`} className="pl-9 bg-white" /></div><Button className="bg-indigo-600 hover:bg-indigo-700">Find</Button></div></form>
        <div className="space-y-2 max-h-[62vh] overflow-y-auto">{loadingCustomers ? [1, 2, 3].map((i) => <div key={i} className="h-20 bg-gray-100 animate-pulse rounded-lg" />) : customers.map((c) => <button type="button" key={v(c, "Id", "id")} onClick={() => selectCustomer(c)} className="w-full text-left bg-white rounded-lg border shadow p-3 hover:shadow-lg transition"><p className="font-semibold text-indigo-700">{customerName(c)}</p><p className="text-xs text-gray-500">ID: {v(c, "IndividualIdentityCardNumber", "individualIdentityCardNumber") || "—"}</p><p className="text-xs text-gray-500">Account: {v(c, "Reference1", "reference1") || "—"}</p></button>)}</div>
        <div className="flex justify-center items-center mt-3"><Button size="sm" disabled={pageIndex === 0} onClick={() => setPageIndex((p) => p - 1)}><FaChevronLeft /></Button><span className="text-sm mx-3">Page {pageIndex + 1}</span><Button size="sm" disabled={itemsCount ? (pageIndex + 1) * 20 >= itemsCount : customers.length < 20} onClick={() => setPageIndex((p) => p + 1)}><FaChevronRight /></Button></div>
      </aside>
      <main className="min-w-0">
        {loadingStatus ? <div className="space-y-3 animate-pulse">{[1, 2, 3].map((i) => <div key={i} className="h-24 bg-gray-100 rounded-lg" />)}</div> : !status ? <div className="text-center py-20"><img src={NotFoundImage} alt="Select customer" className="mx-auto w-32" /><p className="text-gray-400">Select a customer to view their complete account status.</p></div> : <>
          <div className="bg-gray-100 rounded-lg p-4 mb-4 flex flex-wrap justify-between gap-3"><div><p className="text-lg font-bold text-gray-800">{customerName(customer)}</p><p className="text-sm text-gray-500">Serial: {v(customer, "SerialNumber", "serialNumber") || "—"} · Payroll: {v(customer, "IndividualPayrollNumbers", "individualPayrollNumbers") || "—"}</p></div><div className="flex gap-2">{v(status, "isEmployeeAccount", "IsEmployeeAccount") && <span className="px-2 py-1 rounded text-xs font-semibold bg-amber-100 text-amber-600 h-fit">Employee account</span>}{v(status, "isOwnEmployeeAccount", "IsOwnEmployeeAccount") && <span className="px-2 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-600 h-fit">Own account · inquiry only</span>}</div></div>
          <div className="flex flex-wrap gap-2 mb-4">{TABS.map(([id, label]) => <button type="button" key={id} onClick={() => setTab(id)} className={`px-3 py-2 rounded-md text-sm font-semibold ${tab === id ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{label}</button>)}</div>
          {tab === "accounts" && <div className="bg-gray-200 p-4 rounded-sm"><div className="grid grid-cols-12 gap-3 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-3 text-sm"><span className="col-span-2">Status</span><span className="col-span-3">Account</span><span className="col-span-3">Product</span><span className="col-span-1">Branch</span><span className="col-span-1 text-right">Book</span><span className="col-span-1 text-right">Available</span><span className="col-span-1 text-right">Principal</span></div><div className="space-y-2">{accounts.map((a) => <button type="button" key={accountId(a)} onClick={() => selectAccount(a)} className="w-full grid grid-cols-12 gap-3 bg-white rounded-lg shadow-lg border p-4 hover:shadow-xl transition text-sm text-left"><span className="col-span-2">{v(a, "StatusDescription", "statusDescription")}</span><span className="col-span-3 font-medium text-indigo-700">{v(a, "FullAccountNumber", "fullAccountNumber")}</span><span className="col-span-3">{v(a, "CustomerAccountTypeTargetProductDescription", "customerAccountTypeTargetProductDescription")}</span><span className="col-span-1">{v(a, "BranchDescription", "branchDescription")}</span><span className="col-span-1 text-right">{money(v(a, "BookBalance", "bookBalance"))}</span><span className="col-span-1 text-right">{money(v(a, "AvailableBalance", "availableBalance"))}</span><span className="col-span-1 text-right">{money(v(a, "PrincipalBalance", "principalBalance"))}</span></button>)}</div></div>}
          {tab === "selected" && (!selectedAccount ? <p className="text-center text-gray-400 py-10">Select an account from Account Listings.</p> : <div className="space-y-5"><DetailGrid items={[["Status",v(selectedAccount,"StatusDescription","statusDescription")],["Full Account Number",v(selectedAccount,"FullAccountNumber","fullAccountNumber")],["Product",v(selectedAccount,"CustomerAccountTypeTargetProductDescription","customerAccountTypeTargetProductDescription")],["Branch",v(selectedAccount,"BranchDescription","branchDescription")],["Book Balance",money(v(selectedAccount,"BookBalance","bookBalance"))],["Available Balance",money(v(selectedAccount,"AvailableBalance","availableBalance"))],["Principal Balance",money(v(selectedAccount,"PrincipalBalance","principalBalance"))],["Signing Instructions",v(selectedAccount,"SigningInstructions","signingInstructions")],["Remarks",v(selectedAccount,"Remarks","remarks")]]} /><h3 className="font-semibold text-gray-700">Management History</h3><RelatedList rows={history} /><h3 className="font-semibold text-gray-700">Account Signatories</h3><RelatedList rows={selectedSignatories} /><h3 className="font-semibold text-gray-700">Standing Orders</h3><RelatedList rows={selectedOrders} /><h3 className="font-semibold text-gray-700">Alternate Channels</h3><RelatedList rows={selectedChannels} /></div>)}
          {tab === "particulars" && <DetailGrid items={[["Salutation",v(customer,"IndividualSalutationDescription","individualSalutationDescription")],["First Name",v(customer,"IndividualFirstName","individualFirstName")],["Last Name",v(customer,"IndividualLastName","individualLastName")],["Gender",v(customer,"IndividualGenderDescription","individualGenderDescription")],["Marital Status",v(customer,"IndividualMaritalStatusDescription","individualMaritalStatusDescription")],["Nationality",v(customer,"IndividualNationalityDescription","individualNationalityDescription")],["Identity Number",v(customer,"IndividualIdentityCardNumber","individualIdentityCardNumber")],["Payroll Number",v(customer,"IndividualPayrollNumbers","individualPayrollNumbers")],["Employment Designation",v(customer,"IndividualEmploymentDesignation","individualEmploymentDesignation")],["Registration Date",v(customer,"RegistrationDate","registrationDate")],["Remarks",v(customer,"Remarks","remarks")]]} />}
          {tab === "address" && <DetailGrid items={[["Address Line 1",v(customer,"AddressAddressLine1","addressAddressLine1")],["Address Line 2",v(customer,"AddressAddressLine2","addressAddressLine2")],["Street",v(customer,"AddressStreet","addressStreet")],["City",v(customer,"AddressCity","addressCity")],["Postal Code",v(customer,"AddressPostalCode","addressPostalCode")],["Email",v(customer,"AddressEmail","addressEmail")],["Land Line",v(customer,"AddressLandLine","addressLandLine")],["Mobile",v(customer,"AddressMobileLine","addressMobileLine")]]} />}
          {tab === "referees" && <div className="space-y-5"><h3 className="font-semibold text-gray-700">Referees</h3><RelatedList rows={v(status,"referees","Referees") || []} /><h3 className="font-semibold text-gray-700 flex items-center gap-2"><FaIdCard /> Specimen availability</h3><div className="grid grid-cols-2 md:grid-cols-4 gap-3">{specimen.map(([label, available]) => <div key={label} className="bg-gray-50 border rounded-lg p-4 text-center"><p className="text-sm font-medium">{label}</p><span className={`mt-2 inline-block px-2 py-1 rounded text-xs font-semibold ${available ? "bg-green-100 text-green-600" : "bg-gray-200 text-gray-500"}`}>{available ? "Available" : "Not captured"}</span></div>)}</div></div>}
          {tab === "related" && <div><div className="flex flex-wrap gap-2 mb-4">{RELATED.map(([id,label]) => <button type="button" key={id} onClick={() => setRelatedTab(id)} className={`px-3 py-2 rounded-md text-sm ${relatedTab === id ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-600"}`}>{label}</button>)}</div><RelatedList rows={v(status,relatedTab,relatedTab[0].toUpperCase()+relatedTab.slice(1)) || []} /></div>}
        </>}
      </main>
    </div>
  </div>;
}
