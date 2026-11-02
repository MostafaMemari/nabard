import { api } from "@/lib/http";
import type { AgeCategoryCreateInput, AgeCategoryUpdateInput, BeltCreateInput, BeltUpdateInput } from "./schemas";
import type { Gender, WeightClassSetRow } from "./types";

export type BeltAdmin = {
  id: string;
  code: string;
  label: string;
  level: number;
  rankType: "COLOR" | "POOM" | "DAN";
  color: string | null;
  colorHex: string | null;
  isActive: boolean;
};

export type AgeCategoryAdmin = {
  id: string;
  code: string;
  label: string;
  startDate: string;
  endDate: string;
  birthYearStart: number | null;
  birthYearEnd: number | null;
  isActive: boolean;
};

export type WeightClassSetRowAdmin = WeightClassSetRow & { id: string; isActive: boolean; order: number };

export function listBeltsAdmin(includeArchived: boolean): Promise<BeltAdmin[]> {
  return api<BeltAdmin[]>(`/api/v1/belts${includeArchived ? "?archived=true" : ""}`);
}

export function createBelt(input: BeltCreateInput): Promise<BeltAdmin> {
  return api<BeltAdmin>("/api/v1/belts", { method: "POST", body: input });
}

export function updateBelt(id: string, input: BeltUpdateInput): Promise<BeltAdmin> {
  return api<BeltAdmin>(`/api/v1/belts/${id}`, { method: "PATCH", body: input });
}

export function deleteBelt(id: string): Promise<void> {
  return api<void>(`/api/v1/belts/${id}`, { method: "DELETE" });
}

export function listAgeCategoriesAdmin(includeArchived: boolean): Promise<AgeCategoryAdmin[]> {
  return api<AgeCategoryAdmin[]>(`/api/v1/age-categories${includeArchived ? "?archived=true" : ""}`);
}

export function createAgeCategory(input: AgeCategoryCreateInput): Promise<AgeCategoryAdmin> {
  return api<AgeCategoryAdmin>("/api/v1/age-categories", { method: "POST", body: input });
}

export function updateAgeCategory(id: string, input: AgeCategoryUpdateInput): Promise<AgeCategoryAdmin> {
  return api<AgeCategoryAdmin>(`/api/v1/age-categories/${id}`, { method: "PATCH", body: input });
}

export function deleteAgeCategory(id: string): Promise<void> {
  return api<void>(`/api/v1/age-categories/${id}`, { method: "DELETE" });
}

export function getWeightClassSet(params: { ageCategoryId: string; gender: Gender }): Promise<WeightClassSetRowAdmin[]> {
  const query = new URLSearchParams({ ageCategoryId: params.ageCategoryId, gender: params.gender });
  return api<WeightClassSetRowAdmin[]>(`/api/v1/weight-class-sets?${query.toString()}`);
}

export function saveWeightClassSet(input: {
  ageCategoryId: string;
  gender: Gender;
  rows: WeightClassSetRow[];
}): Promise<{ created: number; updated: number; archived: number; deleted: number }> {
  return api<{ created: number; updated: number; archived: number; deleted: number }>("/api/v1/weight-class-sets", {
    method: "PUT",
    body: input,
  });
}

export type { BeltCreateInput, BeltUpdateInput, AgeCategoryCreateInput, AgeCategoryUpdateInput };
