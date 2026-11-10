import { api } from "@/lib/http";
import type { ListQuery, ListResult } from "@/lib/pagination";
import type { ProvinceChangeListQuery } from "./schemas";
import type { ProvinceChangeRequest, ProvinceChangeStatus } from "./types";

export type ProvinceChangeListParams = ListQuery & {
  status?: ProvinceChangeStatus;
};

// The current coach selects the destination province and its receiving coach.
export function createProvinceChangeRequest(
  studentId: string,
  input: { toProvince: string; toCoachId: string },
): Promise<ProvinceChangeRequest> {
  return api<ProvinceChangeRequest>(`/api/v1/students/${studentId}/province-change-requests`, {
    method: "POST",
    body: input,
  });
}

export async function listProvinceChangeRequests(params: ProvinceChangeListParams = {}): Promise<ListResult<ProvinceChangeRequest>> {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  if (params.page !== undefined) query.set("page", String(params.page));
  if (params.pageSize !== undefined) query.set("pageSize", String(params.pageSize));

  const queryString = query.toString();
  return api<ListResult<ProvinceChangeRequest>>(`/api/v1/students/province-change-requests${queryString === "" ? "" : `?${queryString}`}`);
}

export function approveProvinceChangeRequest(id: string): Promise<ProvinceChangeRequest> {
  return api<ProvinceChangeRequest>(`/api/v1/students/province-change-requests/${id}/approve`, { method: "POST", body: {} });
}

export function rejectProvinceChangeRequest(id: string, note: string): Promise<ProvinceChangeRequest> {
  return api<ProvinceChangeRequest>(`/api/v1/students/province-change-requests/${id}/reject`, { method: "POST", body: { note } });
}

export type { ProvinceChangeListQuery };
