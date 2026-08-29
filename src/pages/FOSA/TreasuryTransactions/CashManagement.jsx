import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import Swal from "sweetalert2";
import { FaExchangeAlt } from "react-icons/fa";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { apiErrorMessage, apiJson, normalizeList } from "@/lib/api";
import { TreasuryTransactionType } from "../lib/frontOfficeEnums";
import DenominationCountFields, { emptyDenominationCounts, sumDenominations, toDenominationSubtotals } from "../lib/DenominationCountFields";

const FIN_BASE = `${import.meta.env.VITE_APP_FIN_URL}`;
const CASH_MANAGEMENT_BASE = `${FIN_BASE}/api/frontoffice/cashmanagement`;

// Read directly from CashManagementController.Create (the doc's §5.1 was
// too thin to build this form correctly):
// - `branchId` on the body is the SOURCE branch — the server resolves
//   "your" treasury from it (FindTreasuryByBranchId), it is not a picker
//   for an arbitrary branch.
// - `id` on the body is overloaded: it holds the counterparty Bank Linkage id
//   for BankToTreasury/TreasuryToBank, or the destination Treasury's id
//   for TreasuryToTreasury. TreasuryToTeller uses a real dedicated
//   `tellerId` field instead.
// - `destinationBranchId` only matters for TreasuryToTreasury (the branch
//   the destination treasury belongs to) — derived automatically from the
//   selected destination treasury's own BranchId, not asked for directly.
// - This endpoint's response is genuinely just { success, message } — no
//   `data`, no JournalDTO — so there is no receipt to render here.
const TRANSACTION_TYPE_OPTIONS = [
  { value: TreasuryTransactionType.BankToTreasury, label: "Bank to Treasury" },
  { value: TreasuryTransactionType.TreasuryToBank, label: "Treasury to Bank" },
  { value: TreasuryTransactionType.TreasuryToTeller, label: "Treasury to Teller" },
  { value: TreasuryTransactionType.TreasuryToTreasury, label: "Treasury to Treasury" },
];

function FieldGroup({ label, children }) {
  return (
    <div>
      <Label className="text-sm font-semibold text-gray-700">{label}</Label>
      {children}
    </div>
  );
}

export default function CashManagement() {
  const [branches, setBranches] = useState([]);
  const [tellers, setTellers] = useState([]);
  const [treasuries, setTreasuries] = useState([]);
  const [banks, setBanks] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [loading, setLoading] = useState(false);
  const [movementOpen, setMovementOpen] = useState(false);
  const [actionableTransfers, setActionableTransfers] = useState([]);
  const [loadingTransfers, setLoadingTransfers] = useState(true);

  const [branchId, setBranchId] = useState("");
  const [transactionType, setTransactionType] = useState(TreasuryTransactionType.TreasuryToTeller);
  const [tellerId, setTellerId] = useState("");
  const [destinationTreasuryId, setDestinationTreasuryId] = useState("");
  const [bankLinkageId, setBankLinkageId] = useState("");
  const [reference, setReference] = useState("");
  const [counts, setCounts] = useState(emptyDenominationCounts);

  useEffect(() => {
    setLoadingData(true);
    Promise.all([
      apiJson(`${FIN_BASE}/api/administration/branches`),
      // TellerController/TreasurysController.Index are both genuinely
      // paged now (default pageSize 20) — these are picker dropdowns, not
      // paginated lists, so ask for a page big enough to not silently drop
      // options past the 20th teller/treasury.
      apiJson(`${FIN_BASE}/api/frontoffice/tellers?pageSize=1000`),
      // Treasury master data moved to Areas/Accounts
      // (docs/api/treasury-api-spec.md) — api/frontoffice/treasurys no
      // longer resolves at all, that controller was removed/merged.
      apiJson(`${FIN_BASE}/api/accounts/treasurys?pageSize=1000`),
      // The active BankLinkageController enriches the unpaged `all`
      // response with bank details and live G/L balances.
      apiJson(`${FIN_BASE}/api/accounts/banklinkages/all`),
    ]).then(([branchData, tellerData, treasuryData, bankData]) => {
      setBranches(normalizeList(branchData));
      setTellers(normalizeList(tellerData));
      setTreasuries(normalizeList(treasuryData));
      setBanks(normalizeList(bankData));
    }).catch((error) => {
      setBranches([]);
      setTellers([]);
      setTreasuries([]);
      setBanks([]);
      Swal.fire("Error", apiErrorMessage(error, "Unable to load treasury transaction options."), "error");
    }).finally(() => setLoadingData(false));
  }, []);

  const loadActionableTransfers = () => {
    setLoadingTransfers(true);
    apiJson(`${FIN_BASE}/api/frontoffice/transfers/cash/actionable`)
      .then((data) => setActionableTransfers(normalizeList(data)))
      .catch((error) => {
        setActionableTransfers([]);
        Swal.fire("Error", apiErrorMessage(error, "Unable to load actionable cash transfers."), "error");
      })
      .finally(() => setLoadingTransfers(false));
  };

  useEffect(() => { loadActionableTransfers(); }, []);

  const actionTransfer = async (transfer, option) => {
    const rejecting = option === 3;
    const result = await Swal.fire({
      title: rejecting ? "Reject cash transfer?" : "Acknowledge cash transfer?",
      input: "text",
      inputLabel: "Remarks",
      inputPlaceholder: rejecting ? "Reason for rejection" : "Optional remarks",
      inputValidator: (value) => rejecting && !value?.trim() ? "A rejection reason is required." : undefined,
      icon: rejecting ? "warning" : "question",
      showCancelButton: true,
      confirmButtonColor: rejecting ? "#dc2626" : "#4f46e5",
      confirmButtonText: rejecting ? "Reject" : "Acknowledge",
    });
    if (!result.isConfirmed) return;
    try {
      await apiJson(`${FIN_BASE}/api/frontoffice/transfers/cash/acknowledge?option=${option}`, {
        method: "POST",
        body: JSON.stringify({ Id: transfer.Id, Remarks: result.value || "" }),
      });
      Swal.fire("Success", rejecting ? "Transfer rejected." : "Transfer acknowledged.", "success");
      loadActionableTransfers();
    } catch (error) {
      Swal.fire("Error", apiErrorMessage(error, "Unable to action the cash transfer."), "error");
    }
  };

  const handleCountChange = (key, value) => setCounts((p) => ({ ...p, [key]: value }));
  const totalValue = sumDenominations(counts);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!branchId) {
      Swal.fire("Missing Field", "Select your branch first.", "warning");
      return;
    }
    if (totalValue <= 0) {
      Swal.fire("Missing Amount", "Enter a denomination count first.", "warning");
      return;
    }
    if (transactionType === TreasuryTransactionType.TreasuryToTeller && !tellerId) {
      Swal.fire("Missing Field", "Select a destination teller.", "warning");
      return;
    }
    if (transactionType === TreasuryTransactionType.TreasuryToTreasury && !destinationTreasuryId) {
      Swal.fire("Missing Field", "Select a destination treasury.", "warning");
      return;
    }
    if ((transactionType === TreasuryTransactionType.BankToTreasury || transactionType === TreasuryTransactionType.TreasuryToBank) && !bankLinkageId) {
      Swal.fire("Missing Field", "Select a bank.", "warning");
      return;
    }

    const destinationTreasury = treasuries.find((t) => t.Id === destinationTreasuryId);

    const payload = {
      BranchId: branchId,
      TransactionType: transactionType,
      TotalValue: totalValue,
      Reference: reference,
      TellerId: transactionType === TreasuryTransactionType.TreasuryToTeller ? tellerId : undefined,
      Id: transactionType === TreasuryTransactionType.TreasuryToTreasury
        ? destinationTreasuryId
        : (transactionType === TreasuryTransactionType.BankToTreasury || transactionType === TreasuryTransactionType.TreasuryToBank)
          ? bankLinkageId
          : undefined,
      DestinationBranchId: transactionType === TreasuryTransactionType.TreasuryToTreasury ? destinationTreasury?.BranchId : undefined,
      // Server reconciles these 11 fields as a plain sum against TotalValue
      // (DENOMINATION-CAPTURE-FRONTEND-GUIDE.md) — each must be the
      // pre-multiplied subtotal, not the raw piece count `counts` holds.
      ...toDenominationSubtotals(counts),
    };

    setLoading(true);
    try {
      const data = await apiJson(CASH_MANAGEMENT_BASE, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      Swal.fire("Success", data.message || "Cash movement posted successfully", "success");
      setCounts(emptyDenominationCounts);
      setReference("");
      setMovementOpen(false);
    } catch (err) {
      Swal.fire("Error", apiErrorMessage(err, "Unable to post the cash movement."), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FaExchangeAlt /> Treasury Cash Movement
        </h2>
        <Button onClick={() => setMovementOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white">
          New Treasury Transaction
        </Button>
      </div>

      <section className="mb-8">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-3">Actionable teller cash transfers</h3>
        <div className="bg-gray-200 p-4 rounded-sm">
          <div className="grid grid-cols-12 gap-4 bg-gray-700 text-gray-100 font-semibold p-3 rounded-lg mb-4 text-sm">
            <span className="col-span-3">Teller</span>
            <span className="col-span-3">Reference</span>
            <span className="col-span-2">Amount</span>
            <span className="col-span-2">Created</span>
            <span className="col-span-2 text-right">Actions</span>
          </div>
          {loadingTransfers ? (
            <div className="bg-gray-50 rounded-lg p-5 animate-pulse"><div className="h-4 bg-gray-300 rounded w-2/3" /></div>
          ) : actionableTransfers.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">No teller cash transfers currently require action.</p>
          ) : (
            <div className="space-y-2">
              {actionableTransfers.map((transfer) => (
                <div key={transfer.Id} className="grid grid-cols-12 gap-4 items-center bg-white rounded-lg shadow-lg border p-4 hover:shadow-xl transition-all text-sm">
                  <span className="col-span-3 text-gray-700">{transfer.EmployeeCustomerFullName || transfer.CreatedBy || "Teller"}</span>
                  <span className="col-span-3 font-mono text-xs text-gray-500">{transfer.Reference || "—"}</span>
                  <span className="col-span-2 font-semibold text-indigo-700">{Number(transfer.Amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  <span className="col-span-2 text-xs text-gray-500">{transfer.CreatedDate ? new Date(transfer.CreatedDate).toLocaleString() : "—"}</span>
                  <span className="col-span-2 flex justify-end gap-2">
                    <Button size="sm" onClick={() => actionTransfer(transfer, 2)} className="bg-indigo-600 hover:bg-indigo-700"><FaCheckCircle className="mr-1" /> Accept</Button>
                    <Button size="sm" onClick={() => actionTransfer(transfer, 3)} className="bg-red-600 hover:bg-red-700"><FaTimesCircle className="mr-1" /> Reject</Button>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {movementOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onMouseDown={() => setMovementOpen(false)}>
          <aside className="h-full w-full max-w-2xl bg-white shadow-2xl flex flex-col" onMouseDown={(event) => event.stopPropagation()}>
            <div className="m-2 rounded-2xl bg-indigo-600 px-6 py-4 flex items-center justify-between shrink-0">
              <h3 className="text-lg font-bold text-white flex items-center gap-2"><FaExchangeAlt /> Treasury Transaction</h3>
              <Button type="button" variant="outline" onClick={() => setMovementOpen(false)} className="border-white text-white hover:text-indigo-700">Close</Button>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-1 min-h-0 flex-col">
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FieldGroup label="Your Branch">
            <Select value={branchId ? String(branchId) : ""} onValueChange={setBranchId} disabled={loadingData}>
              <SelectTrigger><SelectValue placeholder={loadingData ? "Loading..." : "Select Branch"} /></SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto">
                {branches.map((b) => <SelectItem key={String(b.Id)} value={String(b.Id)}>{b.Description}</SelectItem>)}
              </SelectContent>
            </Select>
          </FieldGroup>

          <FieldGroup label="Movement">
            <Select value={String(transactionType)} onValueChange={(v) => setTransactionType(Number(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TRANSACTION_TYPE_OPTIONS.map((o) => <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </FieldGroup>

          {transactionType === TreasuryTransactionType.TreasuryToTeller && (
            <FieldGroup label="Destination Teller">
              <Select value={tellerId ? String(tellerId) : ""} onValueChange={setTellerId} disabled={loadingData}>
                <SelectTrigger><SelectValue placeholder={loadingData ? "Loading..." : "Select Teller"} /></SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  {tellers.map((t) => <SelectItem key={String(t.Id)} value={String(t.Id)}>{t.Description}</SelectItem>)}
                </SelectContent>
              </Select>
            </FieldGroup>
          )}

          {transactionType === TreasuryTransactionType.TreasuryToTreasury && (
            <FieldGroup label="Destination Treasury">
              <Select value={destinationTreasuryId ? String(destinationTreasuryId) : ""} onValueChange={setDestinationTreasuryId} disabled={loadingData}>
                <SelectTrigger><SelectValue placeholder={loadingData ? "Loading..." : "Select Treasury"} /></SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  {treasuries.map((t) => <SelectItem key={String(t.Id)} value={String(t.Id)}>{t.Description} ({t.BranchDescription})</SelectItem>)}
                </SelectContent>
              </Select>
            </FieldGroup>
          )}

          {(transactionType === TreasuryTransactionType.BankToTreasury || transactionType === TreasuryTransactionType.TreasuryToBank) && (
            <FieldGroup label="Bank">
              <Select value={bankLinkageId ? String(bankLinkageId) : ""} onValueChange={setBankLinkageId} disabled={loadingData}>
                <SelectTrigger><SelectValue placeholder={loadingData ? "Loading..." : "Select Bank"} /></SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  {banks.map((b) => (
                    <SelectItem key={String(b.Id)} value={String(b.Id)}>
                      {b.BankName || b.Description}{b.BankAccountNumber ? ` — ${b.BankAccountNumber}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldGroup>
          )}

          <FieldGroup label="Reference">
            <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Optional" />
          </FieldGroup>
        </div>

        <div>
          <Label className="text-sm font-semibold text-gray-700 mb-2 block">Denomination Count</Label>
          <DenominationCountFields counts={counts} onChange={handleCountChange} />
        </div>
              </div>
              <div className="shrink-0 border-t bg-white p-4">
                <Button type="submit" disabled={loading || loadingData} className="w-full bg-indigo-600 hover:bg-indigo-700">
                  {loading ? "Submitting..." : "Submit Movement"}
                </Button>
              </div>
            </form>
          </aside>
        </div>
      )}
    </div>
  );
}
