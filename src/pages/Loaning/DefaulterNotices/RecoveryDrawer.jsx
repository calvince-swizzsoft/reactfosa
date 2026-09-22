import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Swal from 'sweetalert2';
import { Button } from '@/components/ui/button';
import FieldLabel from '@/pages/Accounts/BatchProcedures/lib/BatchFieldLabel';

const money = value => Number(value ?? 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function Member({ member, borrower = false, selected, onSelect, disabled }) {
  return <div className="bg-white rounded-lg border shadow-lg p-4 text-sm text-gray-700">
    <div className="flex justify-between gap-3 mb-3"><span className="font-semibold">{member.name}</span><span className="font-semibold text-indigo-700 tabular-nums">{money(member.amount)}</span></div>
    <div className="grid grid-cols-2 gap-3">
      {!borrower && <><span>Amount guaranteed<strong className="block tabular-nums">{money(member.guaranteed)}</strong></span><span>Remaining guarantee<strong className="block tabular-nums">{money(member.remainingGuarantee)}</strong></span></>}
      <span>Other commitments<strong className="block tabular-nums">{money(member.otherCommitments)}</strong></span>
      <span>Selected deposits available<strong className="block tabular-nums">{money(member.available)}</strong></span>
    </div>
    <fieldset className="mt-3" disabled={disabled}><legend className="font-semibold">Recover deposits from</legend><div className="mt-2 space-y-2">
      {member.accounts.length ? member.accounts.map(account => <label key={account.id} className="flex items-center gap-3 border-t pt-2 cursor-pointer"><input type="checkbox" className="w-4 h-4 accent-indigo-600" checked={selected.includes(account.id)} onChange={e => onSelect(account.id, e.target.checked)} /><span className="flex-1">{account.product}<span className="block text-xs text-gray-500">Available: {money(account.available)}</span></span><span className="tabular-nums">{money(account.amount)}</span></label>) : <p className="text-gray-500">No eligible deposit accounts.</p>}
    </div></fieldset>
  </div>;
}

export default function RecoveryDrawer({ row, request, onClose, onRecovered }) {
  const [plan, setPlan] = useState(null), [loading, setLoading] = useState(true), [posting, setPosting] = useState(false), [error, setError] = useState(''), [refresh, setRefresh] = useState(0);
  const [selected, setSelected] = useState([]);
  const panel = useRef(null), operation = useRef(false), requestId = useRef(null);
  useEffect(() => {
    let active = true; setLoading(true); setError('');
    request('/loans/recovery/preview', { method: 'POST', body: JSON.stringify({ loanCaseId: row.loanCaseId, selectedAccountIds: selected }) }).then(data => { if (active) { setPlan(data); requestId.current = crypto.randomUUID(); } }).catch(e => { if (active) setError(e.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [row.loanCaseId, request, refresh, selected]);
  useEffect(() => {
    const previous = document.activeElement, overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden'; panel.current?.focus();
    return () => { document.body.style.overflow = overflow; previous?.focus(); };
  }, []);
  function selectAccount(id, checked) {
    if (operation.current) return;
    setLoading(true);
    setSelected(current => checked ? [...current, id] : current.filter(value => value !== id));
  }
  function keys(e) {
    if (e.key === 'Escape' && !operation.current) onClose();
    if (e.key !== 'Tab') return;
    const items = [...panel.current.querySelectorAll('button:not(:disabled), input:not(:disabled), summary, [tabindex="0"]')];
    const first = items[0], last = items.at(-1);
    if (e.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) { e.preventDefault(); last?.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
  }
  async function post() {
    if (operation.current || loading || error || !plan || !selected.length) return;
    operation.current = true; setPosting(true); setError('');
    try {
      const result = await Swal.fire({ icon: 'warning', title: 'Confirm deposit recovery?', text: `Debit ${money(plan.totalRecovery)} from the listed deposit accounts and apply it to loan ${row.caseNumber}.`, showCancelButton: true, confirmButtonText: 'Recover deposits', confirmButtonColor: '#4f46e5' });
      if (!result.isConfirmed) return;
      const receipt = await request('/loans/recovery', { method: 'POST', body: JSON.stringify({ loanCaseId: row.loanCaseId, requestId: requestId.current, basisHash: plan.basisHash, selectedAccountIds: selected }) });
      await Swal.fire({ icon: 'success', title: 'Recovery posted', text: `${money(receipt.total)} applied to loan ${row.caseNumber}.`, confirmButtonColor: '#4f46e5' });
      onRecovered();
    } catch (e) { setError(e.message); }
    finally { operation.current = false; setPosting(false); }
  }
  return <div className="fixed inset-0 z-50">
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} className="absolute inset-0 bg-black" onClick={() => { if (!operation.current) onClose(); }} />
    <motion.section ref={panel} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="recovery-title" onKeyDown={keys} initial={{ x: '100%' }} animate={{ x: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} className="absolute right-0 top-0 bottom-0 w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col outline-none">
      <header className="m-2 bg-indigo-600 rounded-2xl p-4 text-white flex justify-between items-center shrink-0"><h2 id="recovery-title" className="text-xl font-bold">Recover loan {row.caseNumber}</h2><Button variant="outline" className="text-gray-700" disabled={posting} onClick={onClose}>Close</Button></header>
      <div className="flex-1 overflow-y-auto p-5 space-y-5" aria-busy={loading}>
        {error && <p role="alert" className="p-3 rounded-lg bg-red-50 text-red-700">{error}</p>}
        {loading && !plan ? <div className="space-y-4 animate-pulse">{[1, 2, 3].map(n => <div key={n} className="h-24 rounded-lg bg-gray-100" />)}</div> : plan && <>
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-700"><span>Principal overdue<strong className="block text-lg tabular-nums">{money(plan.principalDue)}</strong></span><span>Recoverable interest<strong className="block text-lg tabular-nums">{money(plan.interestDue)}</strong></span></div>
          {plan.unpostedInterest > 0 && <div className="text-sm"><FieldLabel label={`Interest pending posting: ${money(plan.unpostedInterest)}`} help="Only interest already posted to the loan's interest receivable account can be recovered here." /></div>}
          <section><h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Borrower deposits first</h3><Member member={plan.borrower} borrower selected={selected} onSelect={selectAccount} disabled={posting || loading} /></section>
          <section><div className="mb-2"><FieldLabel label="Guarantor recovery" help="The remaining overdue balance is allocated proportionally to each active guarantor's remaining guarantee, capped by available deposits. Other loan commitments, minimum balances, immature funds and share capital are excluded." /></div><div className="bg-gray-200 p-3 rounded-sm space-y-3">{plan.guarantors.length ? plan.guarantors.map(member => <Member key={member.guarantorId} member={member} selected={selected} onSelect={selectAccount} disabled={posting || loading} />) : <p className="text-sm text-gray-500 text-center">No active guarantors.</p>}</div></section>
          <div className="grid grid-cols-2 gap-4 border-t pt-4 text-sm text-gray-700"><span>Principal recovered<strong className="block tabular-nums">{money(plan.principalRecovery)}</strong></span><span>Interest recovered<strong className="block tabular-nums">{money(plan.interestRecovery)}</strong></span><span className="font-semibold">Total recovery<strong className="block text-lg text-indigo-700 tabular-nums">{money(plan.totalRecovery)}</strong></span><span className="font-semibold">Uncovered shortfall<strong className="block text-lg tabular-nums">{money(plan.shortfall)}</strong></span></div>
        </>}
      </div>
      <footer className="shrink-0 p-4 border-t flex justify-end gap-3"><Button variant="outline" disabled={loading || posting} onClick={() => setRefresh(n => n + 1)}>Recalculate</Button><Button className="bg-indigo-600 hover:bg-indigo-700" disabled={loading || posting || !!error || !selected.length || !(plan?.totalRecovery > 0)} onClick={post}>{posting ? 'Processing…' : loading ? 'Calculating…' : 'Recover deposits'}</Button></footer>
    </motion.section>
  </div>;
}
