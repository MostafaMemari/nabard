import { api } from "@/lib/http";
import type { ListQuery, ListResult } from "@/lib/pagination";
import type { TransferListQuery } from "./schemas";
import type { CoachTransferRequest, TransferLookupResult, TransferRequest, TransferStatus } from "./types";

export type TransferListParams = ListQuery & {
  status?: TransferStatus;
};

export function lookupTransferStudent(nationalCode: string): Promise<TransferLookupResult> {
  return api<TransferLookupResult>("/api/v1/students/transfer-requests/lookup", { method: "POST", body: { nationalCode } });
}

export function createTransferRequest(nationalCode: string): Promise<TransferRequest> {
  return api<TransferRequest>("/api/v1/students/transfer-requests", { method: "POST", body: { nationalCode } });
}

export async function listTransferRequests(params: TransferListParams = {}): Promise<ListResult<TransferRequest | CoachTransferRequest>> {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  if (params.page !== undefined) query.set("page", String(params.page));
  if (params.pageSize !== undefined) query.set("pageSize", String(params.pageSize));

  const queryString = query.toString();
  return api<ListResult<TransferRequest | CoachTransferRequest>>(`/api/v1/transfer-requests${queryString === "" ? "" : `?${queryString}`}`);
}

export function approveTransferRequest(id: string): Promise<TransferRequest> {
  return api<TransferRequest>(`/api/v1/transfer-requests/${id}/approve`, { method: "POST", body: {} });
}

export function rejectTransferRequest(id: string, note: string): Promise<TransferRequest> {
  return api<TransferRequest>(`/api/v1/transfer-requests/${id}/reject`, { method: "POST", body: { note } });
}

export function reassignCoachStudents(coachId: string, toCoachId: string): Promise<{ moved: number }> {
  return api<{ moved: number }>(`/api/v1/coaches/${coachId}/reassign-students`, { method: "POST", body: { toCoachId } });
}

export type { TransferListQuery };
