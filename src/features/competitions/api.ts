import { api } from "@/lib/http";
import type { ListQuery, ListResult } from "@/lib/pagination";
import type { Competition, CompetitionInput, CompetitionStatus, DeadlineExtension, Discipline, ExtendCompetitionInput } from "./types";

export type CompetitionListParams = ListQuery & {
  status?: CompetitionStatus;
  discipline?: Discipline;
  search?: string;
};

export async function listCompetitions(params: CompetitionListParams = {}): Promise<ListResult<Competition>> {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  if (params.discipline) query.set("discipline", params.discipline);
  if (params.search) query.set("search", params.search);
  if (params.page !== undefined) query.set("page", String(params.page));
  if (params.pageSize !== undefined) query.set("pageSize", String(params.pageSize));

  const queryString = query.toString();
  return api<ListResult<Competition>>(`/api/v1/competitions${queryString === "" ? "" : `?${queryString}`}`);
}

export function getCompetition(id: string): Promise<Competition> {
  return api<Competition>(`/api/v1/competitions/${id}`);
}

export function createCompetition(input: CompetitionInput): Promise<Competition> {
  return api<Competition>("/api/v1/competitions", { method: "POST", body: input });
}

export function updateCompetition(id: string, input: Partial<CompetitionInput>): Promise<Competition> {
  return api<Competition>(`/api/v1/competitions/${id}`, { method: "PATCH", body: input });
}

export function updateCompetitionStatus(id: string, status: CompetitionStatus, options: { reason?: string } = {}): Promise<Competition> {
  if (status === "CANCELED") {
    return api<Competition>(`/api/v1/competitions/${id}/cancel`, { method: "POST", body: { reason: options.reason ?? "" } });
  }

  return api<Competition>(`/api/v1/competitions/${id}/publish`, { method: "POST" });
}

export function extendCompetition(id: string, input: ExtendCompetitionInput): Promise<Competition> {
  return api<Competition>(`/api/v1/competitions/${id}/extend`, { method: "POST", body: input });
}

export function listDeadlineExtensions(id: string): Promise<DeadlineExtension[]> {
  return api<DeadlineExtension[]>(`/api/v1/competitions/${id}/extensions`);
}
