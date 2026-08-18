import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FaComments, FaPaperPlane, FaPlus, FaSearch, FaTimes, FaUsers } from "react-icons/fa";
import Swal from "sweetalert2";
import { Button } from "@/components/ui/button";
import { getUserName } from "@/lib/auth";
import { createConversation, getContacts, getConversations, getMessages, markRead, sendMessage } from "./api";

const dateText = (value) => value ? new Date(value).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : "";
const conversationName = (item) => item.isGroup ? item.title : (item.otherUser || "Direct conversation");
const contactName = (contact) => [contact.firstName, contact.otherNames].filter(Boolean).join(" ") || contact.userName;

export default function InstantMessaging() {
  const currentUser = getUserName();
  const [conversations, setConversations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [query, setQuery] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const bottomRef = useRef(null);
  const latestId = useRef(0);

  const selected = conversations.find((item) => item.id === selectedId);
  const visibleConversations = useMemo(() => conversations.filter((item) =>
    [conversationName(item), item.lastMessage, item.lastSender].some((value) => value?.toLowerCase().includes(query.toLowerCase()))
  ), [conversations, query]);

  const refreshConversations = useCallback(async (quiet = false) => {
    try {
      const rows = await getConversations();
      setConversations(rows || []);
      setSelectedId((id) => id || rows?.[0]?.id || null);
    } catch (error) {
      if (!quiet) Swal.fire("Unable to load messages", error.message, "error");
    } finally { if (!quiet) setLoading(false); }
  }, []);

  const refreshMessages = useCallback(async (conversationId, afterId = 0) => {
    if (!conversationId) return;
    try {
      const rows = await getMessages(conversationId, afterId);
      if (rows?.length) {
        setMessages((current) => afterId ? [...current, ...rows.filter((row) => !current.some((item) => item.id === row.id))] : rows);
        latestId.current = rows[rows.length - 1].id;
        await markRead(conversationId);
      }
    } catch (error) {
      if (!afterId) Swal.fire("Unable to load conversation", error.message, "error");
    }
  }, []);

  useEffect(() => { refreshConversations(); }, [refreshConversations]);
  useEffect(() => {
    const timer = setInterval(() => refreshConversations(true), 5000);
    return () => clearInterval(timer);
  }, [refreshConversations]);
  useEffect(() => {
    latestId.current = 0;
    setMessages([]);
    if (!selectedId) return undefined;
    refreshMessages(selectedId);
    const timer = setInterval(() => refreshMessages(selectedId, latestId.current), 3000);
    return () => clearInterval(timer);
  }, [selectedId, refreshMessages]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const submitMessage = async (event) => {
    event.preventDefault();
    const text = body.trim();
    if (!selectedId || !text || sending) return;
    setSending(true);
    try {
      const message = await sendMessage(selectedId, text);
      setMessages((current) => current.some((item) => item.id === message.id) ? current : [...current, message]);
      latestId.current = Math.max(latestId.current, message.id);
      setBody("");
      refreshConversations(true);
    } catch (error) { Swal.fire("Message not sent", error.message, "error"); }
    finally { setSending(false); }
  };

  return (
    <div className="relative m-8 rounded-lg bg-white px-8 py-8 shadow-2xl">
      <div className="mb-6 flex items-center justify-between rounded-2xl bg-indigo-800 px-6 py-3">
        <h2 className="flex items-center gap-2 text-xl font-bold text-white"><FaComments /> Instant Messaging</h2>
        <Button onClick={() => setComposeOpen(true)} className="gap-2 bg-indigo-600 hover:bg-indigo-700"><FaPlus /> New conversation</Button>
      </div>

      <div className="grid min-h-[620px] overflow-hidden rounded-xl border bg-gray-50 lg:grid-cols-[340px_1fr]">
        <aside className="border-r bg-white">
          <div className="relative border-b p-4">
            <FaSearch className="absolute left-7 top-7 text-gray-400" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search conversations" className="w-full rounded-lg border py-2 pl-10 pr-3 text-sm focus:border-indigo-500 focus:outline-none" />
          </div>
          <div className="max-h-[560px] overflow-y-auto">
            {loading ? <p className="p-6 text-center text-sm text-gray-500">Loading conversations…</p> : visibleConversations.length ? visibleConversations.map((item) => (
              <button key={item.id} type="button" onClick={() => setSelectedId(item.id)} className={`w-full border-b p-4 text-left transition ${selectedId === item.id ? "bg-indigo-50" : "hover:bg-gray-50"}`}>
                <div className="flex items-center justify-between gap-2"><span className="truncate font-semibold text-gray-800">{conversationName(item)}</span>{item.unreadCount > 0 && <span className="rounded-full bg-indigo-700 px-2 py-0.5 text-xs font-bold text-white">{item.unreadCount}</span>}</div>
                <p className="mt-1 truncate text-sm text-gray-500">{item.lastSender ? `${item.lastSender}: ` : ""}{item.lastMessage || "No messages yet"}</p>
                <p className="mt-1 text-xs text-gray-400">{dateText(item.lastMessageDate || item.modifiedDate)}</p>
              </button>
            )) : <p className="p-6 text-center text-sm text-gray-500">No conversations found.</p>}
          </div>
        </aside>

        <main className="flex min-w-0 flex-col">
          {selected ? <>
            <div className="border-b bg-white px-6 py-4"><h3 className="font-bold text-gray-800">{conversationName(selected)}</h3><p className="text-xs text-gray-500">{selected.isGroup ? `${selected.participantCount} participants` : "Direct conversation"}</p></div>
            <div className="flex-1 space-y-3 overflow-y-auto p-6">
              {messages.length ? messages.map((message) => {
                const mine = message.senderUserName?.toLowerCase() === currentUser?.toLowerCase();
                return <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}><div className={`max-w-[78%] rounded-2xl px-4 py-3 shadow-sm ${mine ? "bg-indigo-700 text-white" : "border bg-white text-gray-800"}`}><p className={`mb-1 text-xs font-semibold ${mine ? "text-indigo-100" : "text-indigo-700"}`}>{mine ? "You" : message.senderUserName}</p><p className="whitespace-pre-wrap break-words text-sm">{message.body}</p><p className={`mt-1 text-right text-[11px] ${mine ? "text-indigo-200" : "text-gray-400"}`}>{dateText(message.createdDate)}</p></div></div>;
              }) : <div className="flex h-full items-center justify-center text-sm text-gray-400">Start the conversation with a message.</div>}
              <div ref={bottomRef} />
            </div>
            <form onSubmit={submitMessage} className="flex gap-3 border-t bg-white p-4"><textarea value={body} onChange={(event) => setBody(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} maxLength={4000} rows={2} placeholder="Write a message…" className="min-h-12 flex-1 resize-none rounded-lg border p-3 text-sm focus:border-indigo-500 focus:outline-none" /><Button type="submit" disabled={!body.trim() || sending} className="self-end gap-2 bg-indigo-700 hover:bg-indigo-800"><FaPaperPlane /> Send</Button></form>
          </> : <div className="flex flex-1 flex-col items-center justify-center text-gray-400"><FaComments className="mb-3 text-5xl" /><p>Select or start a conversation.</p></div>}
        </main>
      </div>
      {composeOpen && <NewConversation onClose={() => setComposeOpen(false)} onCreated={(id) => { setComposeOpen(false); refreshConversations(true).then(() => setSelectedId(id)); }} />}
    </div>
  );
}

function NewConversation({ onClose, onCreated }) {
  const [contacts, setContacts] = useState([]);
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState("");
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => getContacts(search).then(setContacts).catch((error) => Swal.fire("Unable to load contacts", error.message, "error")), 250);
    return () => clearTimeout(timer);
  }, [search]);
  const toggle = (userName) => setSelected((items) => items.includes(userName) ? items.filter((item) => item !== userName) : [...items, userName]);
  const submit = async (event) => {
    event.preventDefault();
    if (!selected.length || (selected.length > 1 && !title.trim())) return;
    setSaving(true);
    try { const result = await createConversation(selected, title.trim()); onCreated(result.id); }
    catch (error) { Swal.fire("Conversation not created", error.message, "error"); setSaving(false); }
  };
  return <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div className="h-full w-full max-w-lg overflow-y-auto bg-white p-6 shadow-2xl">
    <div className="mb-6 flex items-center justify-between"><h3 className="flex items-center gap-2 text-lg font-bold text-gray-800"><FaUsers className="text-indigo-700" /> New conversation</h3><button type="button" onClick={onClose} className="rounded p-2 text-gray-500 hover:bg-gray-100"><FaTimes /></button></div>
    <form onSubmit={submit}>
      <label className="mb-2 block text-sm font-semibold text-gray-700">Find users</label><input autoFocus value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, username, or email" className="mb-4 w-full rounded-lg border p-3 text-sm focus:border-indigo-500 focus:outline-none" />
      <div className="mb-5 max-h-80 overflow-y-auto rounded-lg border">{contacts.length ? contacts.map((contact) => <label key={contact.userName} className="flex cursor-pointer items-center gap-3 border-b p-3 last:border-0 hover:bg-indigo-50"><input type="checkbox" checked={selected.includes(contact.userName)} onChange={() => toggle(contact.userName)} className="h-4 w-4 accent-indigo-700" /><span><span className="block font-medium text-gray-800">{contactName(contact)}</span><span className="block text-xs text-gray-500">{contact.userName}{contact.email ? ` · ${contact.email}` : ""}</span></span></label>) : <p className="p-5 text-center text-sm text-gray-500">No users found.</p>}</div>
      {selected.length > 1 && <><label className="mb-2 block text-sm font-semibold text-gray-700">Group title</label><input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={200} required className="mb-5 w-full rounded-lg border p-3 text-sm" placeholder="Enter a group name" /></>}
      <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button type="submit" disabled={!selected.length || saving || (selected.length > 1 && !title.trim())} className="bg-indigo-700 hover:bg-indigo-800">{saving ? "Creating…" : "Create conversation"}</Button></div>
    </form>
  </div></div>;
}
