import { apiJson } from "@/lib/api";

const BASE = `${import.meta.env.VITE_APP_FIN_URL}/api/accounts/recurringbatches`;

const normalizeKeys = (value) => {
  if (Array.isArray(value)) return value.map(normalizeKeys);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [
    `${key[0].toLowerCase()}${key.slice(1)}`,
    normalizeKeys(item),
  ]));
};

const unwrap = async (promise) => {
  const body = await promise;
  return normalizeKeys(body.data ?? body.Data);
};

const query = (values) => {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
  });
  return params.toString();
};

export const listRecurringBatches = ({ type, pageIndex = 0, pageSize = 20 } = {}) =>
  unwrap(apiJson(`${BASE}?${query({ type, pageIndex, pageSize })}`));

export const getRecurringBatch = (id) => unwrap(apiJson(`${BASE}/${id}`));

export const listRecurringBatchEntries = (id, { text = "", pageIndex = 0, pageSize = 20 } = {}) =>
  unwrap(apiJson(`${BASE}/${id}/entries?${query({ text, pageIndex, pageSize })}`));

export const listQueueableRecurringEntries = ({ pageIndex = 0, pageSize = 20 } = {}) =>
  unwrap(apiJson(`${BASE}/queueable?${query({ pageIndex, pageSize })}`));
