import { api } from "@/lib/http";
import type { County } from "./types";

export function listCounties(): Promise<County[]> {
  return api<County[]>("/api/v1/counties");
}
