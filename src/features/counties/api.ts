import { api } from "@/lib/http";
import type { CreateCountyInput, UpdateCountyInput } from "./schemas";
import type { County } from "./types";

export type CountyListParams = {
  province?: string;
};

export async function listCounties(params: CountyListParams = {}): Promise<County[]> {
  const query = new URLSearchParams();
  if (params.province) query.set("province", params.province);

  const queryString = query.toString();
  return api<County[]>(`/api/v1/counties${queryString === "" ? "" : `?${queryString}`}`);
}

export function createCounty(input: CreateCountyInput): Promise<County> {
  return api<County>("/api/v1/counties", { method: "POST", body: input });
}

export function updateCounty(id: string, input: UpdateCountyInput): Promise<County> {
  return api<County>(`/api/v1/counties/${id}`, { method: "PATCH", body: input });
}

export function deleteCounty(id: string): Promise<{ id: string }> {
  return api<{ id: string }>(`/api/v1/counties/${id}`, { method: "DELETE" });
}
