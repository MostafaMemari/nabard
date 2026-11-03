import { api } from "@/lib/http";
import type { ListQuery, ListResult } from "@/lib/pagination";
import type { CoachInput, UpdateCoachInput } from "./schemas";
import type { User } from "./types";

export type CoachListParams = ListQuery & {
  search?: string;
  status?: "active" | "inactive";
  province?: string;
};

export async function listCoaches(params: CoachListParams = {}): Promise<ListResult<User>> {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.status) query.set("status", params.status);
  if (params.province) query.set("province", params.province);
  if (params.page !== undefined) query.set("page", String(params.page));
  if (params.pageSize !== undefined) query.set("pageSize", String(params.pageSize));

  const queryString = query.toString();
  return api<ListResult<User>>(`/api/v1/coaches${queryString === "" ? "" : `?${queryString}`}`);
}

export function getCoach(id: string): Promise<User> {
  return api<User>(`/api/v1/coaches/${id}`);
}

export function createCoach(input: CoachInput): Promise<User> {
  return api<User>("/api/v1/coaches", { method: "POST", body: input });
}

export function updateCoachStatus(id: string, isActive: boolean): Promise<User> {
  return api<User>(`/api/v1/coaches/${id}`, { method: "PATCH", body: { isActive } });
}

export function updateCoach(id: string, input: UpdateCoachInput): Promise<User> {
  return api<User>(`/api/v1/coaches/${id}`, { method: "PATCH", body: input });
}

export function resetCoachPassword(id: string, password: string): Promise<User> {
  return api<User>(`/api/v1/coaches/${id}/reset-password`, { method: "POST", body: { password } });
}

export function uploadCoachPhoto(file: File): Promise<null> {
  const form = new FormData();
  form.set("file", file);
  return api<null>("/api/v1/coaches/me/photo", { method: "PUT", body: form });
}

export function deleteCoachPhoto(): Promise<null> {
  return api<null>("/api/v1/coaches/me/photo", { method: "DELETE" });
}
