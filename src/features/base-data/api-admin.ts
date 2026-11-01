import { api } from "@/lib/http";
import { type AgeCategoryDatesValues, ageCategoryDatesSchema } from "./schemas";
import type { AgeCategory } from "./types";

export function getAgeCategory(id: string): Promise<AgeCategory> {
  return api<AgeCategory>(`/api/v1/base-data/age-categories/${id}`);
}

export function updateAgeCategoryDates(id: string, input: AgeCategoryDatesValues): Promise<AgeCategory> {
  return api<AgeCategory>(`/api/v1/base-data/age-categories/${id}`, { method: "PATCH", body: input });
}

export { ageCategoryDatesSchema };
export type { AgeCategoryDatesValues };
