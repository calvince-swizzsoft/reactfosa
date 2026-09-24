import { apiJson } from "@/lib/api";
export const normalize = value => Array.isArray(value) ? value.map(normalize) : value && typeof value === "object" ? Object.fromEntries(Object.entries(value).map(([k,v]) => [k[0].toLowerCase()+k.slice(1),normalize(v)])) : value;
export async function request(path, method="GET", body) {
  const r=await apiJson(`${import.meta.env.VITE_APP_FIN_URL}/api/accounts/sasra/insiders${path}`,{method,cache:"no-store",...(body === undefined ? {} : {body:JSON.stringify(body)})});
  return normalize(r.data ?? r.Data);
}
export async function downloadRun(id) {
  const file=await request(`/runs/${id}/export`);
  const blob=new Blob([Uint8Array.from(atob(file.workbookBase64),c=>c.charCodeAt(0))],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"});
  const url=URL.createObjectURL(blob);const link=document.createElement("a");link.href=url;link.download=file.fileName;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
export const day = value => value ? String(value).slice(0,10) : "";
export const money = value => value == null ? "Unavailable" : Number(value).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
