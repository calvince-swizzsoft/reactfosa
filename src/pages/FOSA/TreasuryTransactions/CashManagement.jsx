import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import Swal from "sweetalert2";
import { FaExchangeAlt } from "react-icons/fa";
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
// - `id` on the body is overloaded: it holds the *counterparty* Bank's id
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

  const [branchId, setBranchId] = useState("");
  const [transactionType, setTransactionType] = useState(TreasuryTransactionType.TreasuryToTeller);
  const [tellerId, setTellerId] = useState("");
  const [destinationTreasuryId, setDestinationTreasuryId] = useState("");
  const [bankId, setBankId] = useState("");
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
      // ValuesController.getBankWithLinkages — the right source for this
      // picker since it's the only endpoint that enriches BankLinkageDTO
      // rows with live balance/display fields (bank-linkage-api-spec.md
      // §4: bankLinkageBalance/address/city/etc. aren't populated by the
      // plain api/accounts/banklinkages CRUD controller). Confirmed
      // directly against the controller source: each row is a
      // BankLinkageDTO with a real, distinct `BankId` field — that's what
      // gets submitted below, NOT the row's own `Id` (the linkage's own
      // id) — see the picker's key/value binding.
      apiJson(`${FIN_BASE}/api/values/getBankWithLinkages`),
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
    if ((transactionType === TreasuryTransactionType.BankToTreasury || transactionType === TreasuryTransactionType.TreasuryToBank) && !bankId) {
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
          ? bankId
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
    } catch (err) {
      Swal.fire("Error", apiErrorMessage(err, "Unable to post the cash movement."), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white m-8 px-8 py-8 shadow-2xl rounded-lg relative max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6 bg-indigo-800 px-6 py-3 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FaExchangeAlt /> Treasury Cash Movement
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
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
              <Select value={bankId ? String(bankId) : ""} onValueChange={setBankId} disabled={loadingData}>
                <SelectTrigger><SelectValue placeholder={loadingData ? "Loading..." : "Select Bank"} /></SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  {/* CashManagementController.Create resolves the raw Bank
                      by fiscalCountDTO.Id, so this must submit the
                      linkage's BankId (the real FK), not the linkage
                      row's own Id. */}
                  {banks.map((b) => <SelectItem key={String(b.BankId)} value={String(b.BankId)}>{b.BankName || b.Description}</SelectItem>)}
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

        <Button type="submit" disabled={loading || loadingData} className="w-full bg-indigo-600 hover:bg-indigo-700">
          {loading ? "Submitting..." : "Submit Movement"}
        </Button>
      </form>
    </div>
  );
}
