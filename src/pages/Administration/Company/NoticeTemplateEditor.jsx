import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import FieldLabel from '@/pages/Accounts/BatchProcedures/lib/BatchFieldLabel';
import { templateDetails, starterMessage, sampleMessage } from './noticeTemplates';

export default function NoticeTemplateEditor({ stage, index, onChange }) {
  const textarea = useRef(null);
  const [previous, setPrevious] = useState(null);
  const [error, setError] = useState('');
  const template = stage.template || '';
  const preview = sampleMessage(template, stage);
  function insert(key) {
    const input = textarea.current;
    const start = input?.selectionStart ?? template.length;
    const end = input?.selectionEnd ?? start;
    const token = `{{${key}}}`;
    const next = template.slice(0, start) + token + template.slice(end);
    if (next.length > 8000) { setError('The message can contain at most 8,000 characters.'); return; }
    setError('');
    onChange(next);
    requestAnimationFrame(() => { input?.focus(); input?.setSelectionRange(start + token.length, start + token.length); });
  }
  return <div className="border-t border-gray-200 pt-4 space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <FieldLabel label="Message to the recipient" help="Write the actual message here. Insert detail buttons add placeholders which are replaced with loan details when a notice is generated. Amount placeholders contain numbers; add KSh before them. Changing the notice type or channel preserves your wording; use a starter to replace it." />
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={() => {
          setPrevious(template); setError('');
          onChange(starterMessage(stage.noticeType, stage.channel, stage.recipient));
        }}>Use starter message</Button>
        {previous !== null && <Button type="button" variant="outline" onClick={() => { onChange(previous); setPrevious(null); }}>Undo starter</Button>}
      </div>
    </div>
    <p className="text-sm text-gray-500">Start with suggested wording, edit your message, then check the sample preview.</p>
    <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label={`Insert a detail in stage ${index + 1}`}>
      <span className="text-xs font-semibold text-gray-500 mr-1">Insert detail:</span>
      {templateDetails.map(([key, label]) => <button key={key} type="button" onClick={() => insert(key)} className="rounded-md border border-indigo-100 bg-indigo-50 px-2 py-1 text-xs text-indigo-700 hover:bg-indigo-100 focus-visible:outline focus-visible:outline-indigo-600">{label}</button>)}
    </div>
    <textarea ref={textarea} aria-label={`Notice template for stage ${index + 1}`} className="border rounded-md p-3 w-full min-h-40 text-sm" maxLength={8000} value={template} placeholder="Choose Use starter message, or write your own message here…" onChange={e => {setError(''); onChange(e.target.value);}} />
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-2">
      <div className="flex flex-wrap justify-between gap-2 text-xs text-gray-500">
        <strong className="text-gray-700">Sample preview · fictional details</strong>
        {stage.channel === 'SMS' && <span>{preview.length} characters after sample substitution</span>}
      </div>
      <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">{preview || 'Your message preview will appear here.'}</p>
      <p className="text-xs text-gray-500">{stage.channel === 'SMS' ? 'Keep SMS wording short. Actual length and SMS parts depend on the recipient details and characters used.' : 'Email and printed letters can use paragraphs and fuller wording.'}{stage.recipient === 'Both' ? ' This example shows the borrower copy; review the wording for guarantors too.' : ''}</p>
    </div>
  </div>;
}
