import { mockDelay } from "@/lib/mock";
import { type ListQuery, type ListResult, paginate } from "@/lib/pagination";
import { competitions } from "./mock/competitions";
import type { Competition, CompetitionInput, CompetitionStatus, Discipline } from "./types";

export type CompetitionListParams = ListQuery & {
  status?: CompetitionStatus;
  discipline?: Discipline;
  search?: string;
};

let nextId = competitions.length + 1;

export async function listCompetitions(params: CompetitionListParams = {}): Promise<ListResult<Competition>> {
  await mockDelay();
  const search = params.search?.trim() ?? "";
  const filtered = competitions.filter(
    (competition) =>
      (params.status === undefined || competition.status === params.status) &&
      (params.discipline === undefined || competition.discipline === params.discipline) &&
      (search === "" || competition.title.includes(search)),
  );

  return paginate(filtered, params);
}

export async function getCompetition(id: string): Promise<Competition> {
  await mockDelay();
  const competition = competitions.find((item) => item.id === id);

  if (!competition) {
    throw new Error("مسابقه یافت نشد.");
  }

  return competition;
}

export async function createCompetition(input: CompetitionInput): Promise<Competition> {
  await mockDelay();
  const now = new Date().toISOString();
  const competition: Competition = {
    ...input,
    id: `comp-${nextId}`,
    status: input.status ?? "DRAFT",
    createdAt: now,
    updatedAt: now,
  };
  nextId += 1;
  competitions.push(competition);

  return competition;
}

export async function updateCompetition(id: string, input: Partial<CompetitionInput>): Promise<Competition> {
  await mockDelay();
  const index = competitions.findIndex((item) => item.id === id);

  if (index === -1) {
    throw new Error("مسابقه یافت نشد.");
  }

  competitions[index] = { ...competitions[index], ...input, updatedAt: new Date().toISOString() };

  return competitions[index];
}

export async function updateCompetitionStatus(id: string, status: CompetitionStatus): Promise<Competition> {
  return updateCompetition(id, { status });
}
