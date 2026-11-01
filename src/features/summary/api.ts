import { api } from "@/lib/http";
import type { AdminSummary } from "./types";

export function getSummary(): Promise<AdminSummary> {
  return api<AdminSummary>("/api/v1/summary");
}
