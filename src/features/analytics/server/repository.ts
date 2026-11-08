import type { Province } from "@/generated/client";
import { getPrisma } from "@/lib/prisma";

export type AnalyticsUserIdentity = {
  id: string;
  role: "ADMIN" | "COACH" | "SUPER_ADMIN";
  isActive: boolean;
};

export type CountyCountRow = { countyId: string | null; count: number };
export type CountyRow = { id: string; name: string; province: Province };
export type ProfileStatusCounts = { approved: number; pending: number; rejected: number };

export type AnalyticsRepository = {
  findUserById(id: string): Promise<AnalyticsUserIdentity | null>;
  countCoaches(province: Province | null): Promise<number>;
  countStudents(province: Province | null): Promise<number>;
  countCompetitions(province: Province | null): Promise<number>;
  countRegistrations(province: Province | null): Promise<number>;
  countProfilesByStatus(province: Province | null): Promise<ProfileStatusCounts>;
  findRecentRegistrationDates(province: Province | null, since: Date): Promise<Date[]>;
  countRegistrationsByCounty(province: Province | null): Promise<CountyCountRow[]>;
  countStudentsByCounty(province: Province | null): Promise<CountyCountRow[]>;
  findCounties(province: Province | null): Promise<CountyRow[]>;
};

function coachScope(province: Province | null): { coach: { province: Province } } | Record<string, never> {
  return province === null ? {} : { coach: { province } };
}

function scopeWhere(province: Province | null): { where: ReturnType<typeof coachScope> } {
  return { where: coachScope(province) };
}

// Registration and student counts roll up to counties through the coach, the
// same way the province summary does.
function countsByCounty(
  rows: Array<{ coachId: string; _count: { _all: number } }>,
  coachCounties: Map<string, string | null>,
): CountyCountRow[] {
  if (rows.length === 0) return [];

  const counts = new Map<string, number>();
  for (const row of rows) {
    const countyId = coachCounties.get(row.coachId);
    if (!countyId) continue;
    counts.set(countyId, (counts.get(countyId) ?? 0) + row._count._all);
  }

  return [...counts.entries()].map(([countyId, count]) => ({ countyId, count }));
}

async function coachCountyMap(coachIds: string[]): Promise<Map<string, string | null>> {
  if (coachIds.length === 0) return new Map();

  const coaches = await getPrisma().user.findMany({ where: { id: { in: coachIds } }, select: { id: true, countyId: true } });
  return new Map(coaches.map((coach) => [coach.id, coach.countyId]));
}

export async function findUserById(id: string): Promise<AnalyticsUserIdentity | null> {
  return getPrisma().user.findUnique({ where: { id }, select: { id: true, role: true, isActive: true } });
}

export async function countCoaches(province: Province | null): Promise<number> {
  return getPrisma().user.count({ where: { role: "COACH", ...(province === null ? {} : { province }) } });
}

export async function countStudents(province: Province | null): Promise<number> {
  return getPrisma().student.count(scopeWhere(province));
}

export async function countCompetitions(province: Province | null): Promise<number> {
  return getPrisma().competition.count({ where: province === null ? {} : { province } });
}

export async function countRegistrations(province: Province | null): Promise<number> {
  return getPrisma().registration.count(scopeWhere(province));
}

export async function countProfilesByStatus(province: Province | null): Promise<ProfileStatusCounts> {
  const rows = await getPrisma().student.groupBy({
    by: ["profileStatus"],
    where: coachScope(province),
    _count: { _all: true },
  });

  const counts = { approved: 0, pending: 0, rejected: 0 };
  for (const row of rows) {
    if (row.profileStatus === "APPROVED") counts.approved += row._count._all;
    if (row.profileStatus === "PENDING") counts.pending += row._count._all;
    if (row.profileStatus === "REJECTED") counts.rejected += row._count._all;
  }

  return counts;
}

export async function findRecentRegistrationDates(province: Province | null, since: Date): Promise<Date[]> {
  const rows = await getPrisma().registration.findMany({
    where: { createdAt: { gte: since }, ...coachScope(province) },
    select: { createdAt: true },
  });

  return rows.map((row) => row.createdAt);
}

export async function countRegistrationsByCounty(province: Province | null): Promise<CountyCountRow[]> {
  const rows = await getPrisma().registration.groupBy({ by: ["coachId"], where: coachScope(province), _count: { _all: true } });
  return countsByCounty(rows, await coachCountyMap(rows.map((row) => row.coachId)));
}

export async function countStudentsByCounty(province: Province | null): Promise<CountyCountRow[]> {
  const rows = await getPrisma().student.groupBy({ by: ["coachId"], where: coachScope(province), _count: { _all: true } });
  return countsByCounty(rows, await coachCountyMap(rows.map((row) => row.coachId)));
}

export async function findCounties(province: Province | null): Promise<CountyRow[]> {
  return getPrisma().county.findMany({
    where: province === null ? {} : { province },
    select: { id: true, name: true, province: true },
    orderBy: [{ province: "asc" }, { name: "asc" }],
  });
}
