import type { Province } from "@/generated/client";
import { getPrisma } from "@/lib/prisma";
import { provinceValues } from "@/lib/provinces";
import type { ProvinceSummary } from "../types";

export type UserIdentityRecord = {
  id: string;
  role: "ADMIN" | "COACH" | "SUPER_ADMIN";
  province: Province | null;
  isActive: boolean;
};

export type SuperRepository = {
  findUserById(id: string): Promise<UserIdentityRecord | null>;
  findProvinceSummaries(): Promise<ProvinceSummary[]>;
};

type CountRow = { province: Province | null; _count: { _all: number } };
type CoachCountRow = { coachId: string; _count: { _all: number } };

export async function findUserById(id: string): Promise<UserIdentityRecord | null> {
  return getPrisma().user.findUnique({
    where: { id },
    select: { id: true, role: true, province: true, isActive: true },
  });
}

export async function findProvinceSummaries(): Promise<ProvinceSummary[]> {
  const prisma = getPrisma();

  const [admins, coaches, students, competitions, registrations, pendingPayments] = await Promise.all([
    prisma.user.groupBy({ by: ["province"], where: { role: "ADMIN" }, _count: { _all: true } }),
    prisma.user.groupBy({ by: ["province"], where: { role: "COACH" }, _count: { _all: true } }),
    prisma.student.groupBy({ by: ["coachId"], _count: { _all: true } }),
    prisma.competition.groupBy({ by: ["province"], _count: { _all: true } }),
    prisma.registration.groupBy({ by: ["coachId"], _count: { _all: true } }),
    prisma.payment.groupBy({ by: ["coachId"], where: { status: "PENDING" }, _count: { _all: true } }),
  ]);

  const coachIds = [...new Set([...students, ...registrations, ...pendingPayments].map((row) => row.coachId))];
  const coachRows =
    coachIds.length === 0 ? [] : await prisma.user.findMany({ where: { id: { in: coachIds } }, select: { id: true, province: true } });
  const provinceByCoachId = new Map(coachRows.map((row) => [row.id, row.province]));

  type Totals = { admins: number; coaches: number; students: number; competitions: number; registrations: number; pendingPayments: number };
  const totals = new Map<Province, Totals>();
  for (const province of provinceValues) {
    totals.set(province, { admins: 0, coaches: 0, students: 0, competitions: 0, registrations: 0, pendingPayments: 0 });
  }

  function add(province: Province | null, key: keyof Totals, count: number): void {
    if (province === null) return;
    const row = totals.get(province);
    if (row) row[key] += count;
  }

  function addByCoach(rows: CoachCountRow[], key: keyof Totals): void {
    for (const row of rows) {
      add(provinceByCoachId.get(row.coachId) ?? null, key, row._count._all);
    }
  }

  for (const row of admins as CountRow[]) add(row.province, "admins", row._count._all);
  for (const row of coaches as CountRow[]) add(row.province, "coaches", row._count._all);
  addByCoach(students, "students");
  for (const row of competitions as CountRow[]) add(row.province, "competitions", row._count._all);
  addByCoach(registrations, "registrations");
  addByCoach(pendingPayments, "pendingPayments");

  return provinceValues.map((province) => ({ province, ...(totals.get(province) as Totals) }));
}
