import { api } from "@/lib/http";
import type { ListQuery, ListResult } from "@/lib/pagination";
import type { CreateAdminInput, ResetAdminPasswordInput, UpdateAdminInput } from "./schemas";
import type { AdminUser } from "./types";

export type AdminListParams = ListQuery & {
  search?: string;
  status?: "active" | "inactive";
};

export async function listAdmins(params: AdminListParams = {}): Promise<ListResult<AdminUser>> {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.status) query.set("status", params.status);
  if (params.page !== undefined) query.set("page", String(params.page));
  if (params.pageSize !== undefined) query.set("pageSize", String(params.pageSize));

  const queryString = query.toString();
  return api<ListResult<AdminUser>>(`/api/v1/admins${queryString === "" ? "" : `?${queryString}`}`);
}

export function getAdmin(id: string): Promise<AdminUser> {
  return api<AdminUser>(`/api/v1/admins/${id}`);
}

export function createAdmin(input: CreateAdminInput): Promise<AdminUser> {
  return api<AdminUser>("/api/v1/admins", { method: "POST", body: input });
}

export function updateAdmin(id: string, input: UpdateAdminInput): Promise<AdminUser> {
  return api<AdminUser>(`/api/v1/admins/${id}`, { method: "PATCH", body: input });
}

export function resetAdminPassword(id: string, input: ResetAdminPasswordInput): Promise<AdminUser> {
  return api<AdminUser>(`/api/v1/admins/${id}/reset-password`, { method: "POST", body: input });
}
