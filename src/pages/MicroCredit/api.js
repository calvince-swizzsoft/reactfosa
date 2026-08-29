import { apiJson } from "@/lib/api";
const BASE = `${import.meta.env.VITE_APP_FIN_URL}/api/microcredit`;
export const listOfficers = (text="",pageIndex=0) => apiJson(`${BASE}/officers?text=${encodeURIComponent(text)}&pageIndex=${pageIndex}&pageSize=20`);
export const saveOfficer = (dto) => apiJson(`${BASE}/officers${dto.Id?`/${dto.Id}`:""}`, {method:dto.Id?"PUT":"POST",body:JSON.stringify(dto)});
export const listGroups = (text="",pageIndex=0) => apiJson(`${BASE}/groups?text=${encodeURIComponent(text)}&pageIndex=${pageIndex}&pageSize=20`);
export const saveGroup = (dto) => apiJson(`${BASE}/groups${dto.Id?`/${dto.Id}`:""}`, {method:dto.Id?"PUT":"POST",body:JSON.stringify(dto)});
export const listMembers = (id) => apiJson(`${BASE}/groups/${id}/members`);
export const addMember = (id,dto) => apiJson(`${BASE}/groups/${id}/members`,{method:"POST",body:JSON.stringify(dto)});
