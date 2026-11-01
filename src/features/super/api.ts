import { api } from "@/lib/http";
import type { ProvinceSummary } from "./types";

export function getSuperSummary(): Promise<ProvinceSummary[]> {
  return api<ProvinceSummary[]>("/api/v1/super/summary");
}
