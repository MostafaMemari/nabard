import { api } from "@/lib/http";
import type { ListQuery, ListResult } from "@/lib/pagination";
import type { Refund, RefundStatus } from "./types";

export type RefundListParams = ListQuery & {
  status?: RefundStatus;
};

export async function listRefunds(params: RefundListParams = {}): Promise<ListResult<Refund>> {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  if (params.page !== undefined) query.set("page", String(params.page));
  if (params.pageSize !== undefined) query.set("pageSize", String(params.pageSize));

  const queryString = query.toString();
  return api<ListResult<Refund>>(`/api/v1/refunds${queryString === "" ? "" : `?${queryString}`}`);
}

export function completeRefund(id: string, note?: string): Promise<Refund> {
  return api<Refund>(`/api/v1/refunds/${id}/complete`, { method: "POST", body: { note } });
}
