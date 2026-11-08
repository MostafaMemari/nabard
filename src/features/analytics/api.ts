import { api } from "@/lib/http";
import type { SuperAnalytics } from "./types";

export function getSuperAnalytics(province: string | null): Promise<SuperAnalytics> {
  const query = province === null ? "" : `?province=${encodeURIComponent(province)}`;

  return api<SuperAnalytics>(`/api/v1/super/analytics${query}`);
}
