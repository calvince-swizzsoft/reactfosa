import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { FaMoneyCheck, FaPlus, FaTrash } from "react-icons/fa";
import Swal from "sweetalert2";
import { apiErrorMessage, apiJson, normalizeList } from "@/lib/api";
import { createInHouseCheques } from "../inHouseChequesApi";
import { InHouseChequeFunding } from "../../lib/frontOfficeEnums";

// Batch build — the client assembles the whole batch and submits it in one
// call (InHouseController.cs: "the client assembles the batch client-side
// ... per the ChequeBankingRequest composite-DTO precedent"). The server
// validates each entry and fails the WHOLE request on the first invalid
// one, joined message — surfaced as-is rather than guessed at per-row.
const FIN_BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
const MODULE_NAVIGATION_ITEM_CODE = 25016;

function FieldGroup({ label, children }) {
  return (
    <div>
      <Label className="text-xs text-gray-500">{label}</Label>
      {children}
    </div>
  );
}

const emptyRow = () => ({
  BranchId: "", ChequeTypeId: "", Funding: InHouseChequeFunding.DebitGeneralLedgerAccount,
  DebitChartOfAccountId: "", DebitCustomerAccountId: "", Amount: "", Payee: "", Reference: "",
  _customerId: "", _accounts: [], _loadingAccounts: false,
});

export default function CreateInHouseCheques() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([emptyRow()]);
  const [branches, setBranches] = useState([]);
  const [chequeTypes, setChequeTypes] = useState([]);
  const [chartOfAccounts, setChartOfAccounts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoadingData(true);
    Promise.all([
      apiJson(`${FIN_BASE}/api/administration/branches`),
      apiJson(`${FIN_BASE}/api/accounts/chequetypes/all`),
      apiJson(`${FIN_BASE}/api/accounts/chartofaccounts?pageSize=1000`),
      apiJson(`${FIN_BASE}/api/registry/customers`),
    ]).then(([branchData, ctData, coaData, custData]) => {
      setBranches(normalizeList(branchData));
      setChequeTypes(normalizeList(ctData));
      setChartOfAccounts(normalizeList(coaData));
      setCustomers(normalizeList(custData));
    }).catch((error) => {
      setBranches([]);
      setChequeTypes([]);
      setChartOfAccounts([]);
      setCustomers([]);
      Swal.fire("Error", apiErrorMessage(error, "Unable to load in-house cheque options."), "error");
    }).finally(() => setLoadingData(false));
  }, []);

  const updateRow = (index, patch) => {
    setRows((prev) => {
      const next = prev.slice();
      next[index] = { ...next[index], ...patch };
      return next;
    });
  };

  const handleCustomerChange = (index, customerId) => {
    updateRow(index, { _customerId: customerId, DebitCustomerAccountId: "", _accounts: [], _loadingAccounts: true });
    if (!customerId) { updateRow(index, { _loadingAccounts: false }); return; }
    apiJson(`${FIN_BASE}/api/accounts/customer-accounts/${customerId}/accounts`)
      .then((d) => updateRow(index, { _accounts: normalizeList(d), _loadingAccounts: false }))
      .catch((error) => {
        updateRow(index, { _accounts: [], _loadingAccounts: false });
        Swal.fire("Error", apiErrorMessage(error, "Unable to load customer accounts."), "error");
      });
  };

  const addRow = () => setRows((prev) => [...prev, emptyRow()]);
  const removeRow = (index) => setRows((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();
    for (const row of rows) {
      if (!row.BranchId || !row.DebitChartOfAccountId || !row.Payee.trim() || !row.Reference.trim() || !(Number(row.Amount) > 0)) {
        Swal.fire("Missing Fields", "Every row needs a branch, debit G/L account, payee, reference, and a positive amount.", "warning");
        return;
      }
      if (row.Funding === InHouseChequeFunding.DebitCustomerAccount && !row.DebitCustomerAccountId) {
        Swal.fire("Missing Fields", "Select a debit customer account for rows funded by a customer account.", "warning");
        return;
      }
    }
    setLoading(true);
    try {
      await createInHouseCheques({
        Cheques: rows.map((row) => ({
          BranchId: row.BranchId,
          ChequeTypeId: row.ChequeTypeId || null,
          Funding: row.Funding,
          DebitChartOfAccountId: row.DebitChartOfAccountId,
          DebitCustomerAccountId: row.Funding === InHouseChequeFunding.DebitCustomerAccount ? row.DebitCustomerAccountId : null,
          Amount: Number(row.Amount),
          Payee: row.Payee,
          Reference: row.Reference,
        })),
        ModuleNavigationItemCode: MODULE_NAVIGATION_ITEM_CODE,
      });
      Swal.fire("Success", "Cheque(s) submitted successfully", "success");
      navigate("/FrontOffice/InHouseCheques");
    } catch (err) {
      Swal.fire("Error", apiErrorMessage(err, "Unable to submit the in-house cheques."), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative">
      <div className="flex items-center justify-between gap-3 mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
        <div className="flex items-center gap-3">
          <FaMoneyCheck className="text-white text-xl" />
          <h2 className="text-xl font-bold text-white">New In-House Cheque Batch</h2>
        </div>
        <Link to="/FrontOffice/InHouseCheques" className="text-sm text-white/80 hover:text-white">
          &larr; Back to In-House Cheques
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-3">
          {rows.map((row, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-3 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-gray-500">Cheque {index + 1}</span>
                {rows.length > 1 && (
                  <Button type="button" variant="outline" size="sm" onClick={() => removeRow(index)} className="text-red-600">
                    <FaTrash />
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2">
                <FieldGroup label="Branch">
                  <Select value={row.BranchId} onValueChange={(v) => updateRow(index, { BranchId: v })} disabled={loadingData}>
                    <SelectTrigger><SelectValue placeholder="Branch" /></SelectTrigger>
                    <SelectContent className="max-h-60 overflow-y-auto">
                      {branches.map((b) => <SelectItem key={String(b.Id)} value={String(b.Id)}>{b.Description}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FieldGroup>
                <FieldGroup label="Cheque Type (optional)">
                  <Select value={row.ChequeTypeId} onValueChange={(v) => updateRow(index, { ChequeTypeId: v })} disabled={loadingData}>
                    <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                    <SelectContent className="max-h-60 overflow-y-auto">
                      {chequeTypes.map((ct) => <SelectItem key={String(ct.Id)} value={String(ct.Id)}>{ct.Description}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FieldGroup>
                <FieldGroup label="Funding">
                  <Select value={String(row.Funding)} onValueChange={(v) => updateRow(index, { Funding: Number(v) })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={String(InHouseChequeFunding.DebitGeneralLedgerAccount)}>Debit G/L Account</SelectItem>
                      <SelectItem value={String(InHouseChequeFunding.DebitCustomerAccount)}>Debit Customer Account</SelectItem>
                    </SelectContent>
                  </Select>
                </FieldGroup>
                <FieldGroup label="Debit G/L Account">
                  <Select value={row.DebitChartOfAccountId} onValueChange={(v) => updateRow(index, { DebitChartOfAccountId: v })} disabled={loadingData}>
                    <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                    <SelectContent className="max-h-60 overflow-y-auto">
                      {chartOfAccounts.map((a) => <SelectItem key={String(a.Id)} value={String(a.Id)}>{a.AccountCode} — {a.AccountName}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FieldGroup>
                {row.Funding === InHouseChequeFunding.DebitCustomerAccount && (
                  <>
                    <FieldGroup label="Customer">
                      <Select value={row._customerId} onValueChange={(v) => handleCustomerChange(index, v)} disabled={loadingData}>
                        <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                        <SelectContent className="max-h-60 overflow-y-auto">
                          {customers.map((c) => {
                            const name = [c.IndividualFirstName, c.IndividualLastName].filter(Boolean).join(" ")
                              || c.NonIndividualDescription || c.Description || `Customer ${c.Id}`;
                            return <SelectItem key={String(c.Id)} value={String(c.Id)}>{name}</SelectItem>;
                          })}
                        </SelectContent>
                      </Select>
                    </FieldGroup>
                    <FieldGroup label={row._loadingAccounts ? "Loading..." : "Debit Customer Account"}>
                      <Select value={row.DebitCustomerAccountId} onValueChange={(v) => updateRow(index, { DebitCustomerAccountId: v })} disabled={!row._customerId || row._loadingAccounts}>
                        <SelectTrigger><SelectValue placeholder={!row._customerId ? "Select a customer first" : "Select account"} /></SelectTrigger>
                        <SelectContent className="max-h-60 overflow-y-auto">
                          {row._accounts.map((a) => (
                            <SelectItem key={String(a.Id)} value={String(a.Id)}>{a.CustomerAccountTypeTargetProductDescription || a.FullAccountNumber || a.Id}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FieldGroup>
                  </>
                )}
                <FieldGroup label="Amount">
                  <Input type="number" min="0" value={row.Amount} onChange={(e) => updateRow(index, { Amount: e.target.value })} placeholder="e.g. 10000" />
                </FieldGroup>
                <FieldGroup label="Payee">
                  <Input value={row.Payee} onChange={(e) => updateRow(index, { Payee: e.target.value })} placeholder="e.g. Jane Doe" />
                </FieldGroup>
                <FieldGroup label="Reference">
                  <Input value={row.Reference} onChange={(e) => updateRow(index, { Reference: e.target.value })} placeholder="Reference" />
                </FieldGroup>
              </div>
            </div>
          ))}
        </div>

        <Button type="button" variant="outline" size="sm" onClick={addRow} className="flex items-center gap-1">
          <FaPlus /> Add Cheque
        </Button>

        <Button type="submit" disabled={loading || loadingData} className="w-full bg-indigo-600 hover:bg-indigo-700">
          {loading ? "Submitting..." : `Submit ${rows.length} Cheque(s)`}
        </Button>
      </form>
    </div>
  );
}
