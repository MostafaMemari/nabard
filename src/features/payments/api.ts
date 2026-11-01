import { api } from "@/lib/http";
import type { ListQuery, ListResult } from "@/lib/pagination";
import type { Payment, PaymentStatus } from "./types";

export type PaymentListParams = ListQuery & {
  status?: PaymentStatus;
  coachId?: string;
  competitionId?: string;
};

export async function listPayments(params: PaymentListParams = {}): Promise<ListResult<Payment>> {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  if (params.coachId) query.set("coachId", params.coachId);
  if (params.competitionId) query.set("competitionId", params.competitionId);
  if (params.page !== undefined) query.set("page", String(params.page));
  if (params.pageSize !== undefined) query.set("pageSize", String(params.pageSize));

  const queryString = query.toString();
  return api<ListResult<Payment>>(`/api/v1/payments${queryString === "" ? "" : `?${queryString}`}`);
}

export function getPayment(id: string): Promise<Payment> {
  return api<Payment>(`/api/v1/payments/${id}`);
}

export function confirmPayment(id: string): Promise<Payment> {
  return api<Payment>(`/api/v1/payments/${id}/confirm`, { method: "POST" });
}

export function rejectPayment(id: string, note: string): Promise<Payment> {
  return api<Payment>(`/api/v1/payments/${id}/reject`, { method: "POST", body: { note } });
}
