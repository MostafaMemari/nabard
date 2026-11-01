import { api } from "@/lib/http";
import type { ListQuery, ListResult } from "@/lib/pagination";
import type { CountyChangeListQuery } from "./schemas";
import type { CountyChangeRequest, CountyChangeStatus } from "./types";

export type CountyChangeListParams = ListQuery & {
  status?: CountyChangeStatus;
};

export function getMyCountyChange(): Promise<CountyChangeRequest | null> {
  return api<CountyChangeRequest | null>("/api/v1/coaches/me/county-change");
}

export function createCountyChange(toCountyId: string): Promise<CountyChangeRequest> {
  return api<CountyChangeRequest>("/api/v1/coaches/me/county-change", { method: "POST", body: { toCountyId } });
}

export async function listCountyChanges(params: CountyChangeListParams = {}): Promise<ListResult<CountyChangeRequest>> {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  if (params.page !== undefined) query.set("page", String(params.page));
  if (params.pageSize !== undefined) query.set("pageSize", String(params.pageSize));

  const queryString = query.toString();
  return api<ListResult<CountyChangeRequest>>(`/api/v1/county-change-requests${queryString === "" ? "" : `?${queryString}`}`);
}

export function approveCountyChange(id: string): Promise<CountyChangeRequest> {
  return api<CountyChangeRequest>(`/api/v1/county-change-requests/${id}/approve`, { method: "POST", body: {} });
}

export function rejectCountyChange(id: string, note: string): Promise<CountyChangeRequest> {
  return api<CountyChangeRequest>(`/api/v1/county-change-requests/${id}/reject`, { method: "POST", body: { note } });
}

export type { CountyChangeListQuery };
