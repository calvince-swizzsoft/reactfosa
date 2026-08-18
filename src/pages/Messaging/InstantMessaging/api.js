import { apiFetch } from "@/lib/api";

const BASE = `${import.meta.env.VITE_APP_FIN_URL}/api/messaging/instant-messages`;

async function read(responsePromise) {
  const response = await responsePromise;
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload?.success === false) throw new Error(payload?.message || `Request failed (${response.status})`);
  return payload?.data ?? payload?.Data ?? payload;
}

export const getContacts = (text = "") => read(apiFetch(`${BASE}/contacts?${new URLSearchParams({ text, pageIndex: 0, pageSize: 100 })}`));
export const getConversations = () => read(apiFetch(`${BASE}/conversations`));
export const createConversation = (participantUserNames, title = "") => read(apiFetch(`${BASE}/conversations`, { method: "POST", body: JSON.stringify({ participantUserNames, title }) }));
export const getMessages = (conversationId, afterId = 0) => read(apiFetch(`${BASE}/conversations/${conversationId}/messages?${new URLSearchParams({ afterId, pageSize: 100 })}`));
export const sendMessage = (conversationId, body) => read(apiFetch(`${BASE}/conversations/${conversationId}/messages`, { method: "POST", body: JSON.stringify({ body }) }));
export const markRead = (conversationId) => read(apiFetch(`${BASE}/conversations/${conversationId}/read`, { method: "POST" }));
