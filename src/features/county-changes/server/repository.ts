import type { Province } from "@/generated/client";
import { getPrisma } from "@/lib/prisma";
import type { CountyChangeStatus } from "../types";

export type UserRole = "ADMIN" | "COACH";

export type UserIdentityRecord = {
  id: string;
  role: UserRole;
  province: Province;
  isActive: boolean;
  countyId: string | null;
};

export type CountyRecord = {
  id: string;
  province: Province;
  name: string;
};

export type CountyChangeRequestRecord = {
  id: string;
  coachId: string;
  coachName: string;
  fromCountyId: string;
  fromCountyName: string;
  toCountyId: string;
  toCountyName: string;
  status: CountyChangeStatus;
  note: string | null;
  decidedAt: Date | null;
  createdAt: Date;
};

export type CountyChangeRequestWithScope = CountyChangeRequestRecord & {
  coachProvince: Province;
};

export type CountyChangeFilters = {
  province?: Province;
  status?: CountyChangeStatus;
};

export type CreateCountyChangeData = {
  coachId: string;
  fromCountyId: string;
  toCountyId: string;
};

export type DecideCountyChangeInput = {
  status: Exclude<CountyChangeStatus, "PENDING">;
  note: string | null;
  decidedById: string;
};

export type CountyChangesRepository = {
  findUserById(id: string): Promise<UserIdentityRecord | null>;
  findCountyById(id: string): Promise<CountyRecord | null>;
  findLatestRequestByCoachId(coachId: string): Promise<CountyChangeRequestRecord | null>;
  findPendingRequestByCoachId(coachId: string): Promise<CountyChangeRequestRecord | null>;
  createCountyChange(data: CreateCountyChangeData): Promise<CountyChangeRequestRecord>;
  countCountyChanges(filters: CountyChangeFilters): Promise<number>;
  findCountyChanges(filters: CountyChangeFilters, skip: number, take: number): Promise<CountyChangeRequestWithScope[]>;
  findCountyChangeById(id: string): Promise<CountyChangeRequestWithScope | null>;
  decideCountyChangeFromPending(id: string, input: DecideCountyChangeInput): Promise<CountyChangeRequestWithScope | null>;
};

const requestSelection = {
  id: true,
  coachId: true,
  status: true,
  note: true,
  decidedAt: true,
  createdAt: true,
  coach: { select: { fullName: true, province: true } },
  fromCounty: { select: { id: true, name: true } },
  toCounty: { select: { id: true, name: true } },
} as const;

type RequestRowInput = {
  id: string;
  coachId: string;
  status: CountyChangeStatus;
  note: string | null;
  decidedAt: Date | null;
  createdAt: Date;
  coach: { fullName: string; province: Province };
  fromCounty: { id: string; name: string };
  toCounty: { id: string; name: string };
};

function toRequestRecord(row: RequestRowInput): CountyChangeRequestRecord {
  return {
    id: row.id,
    coachId: row.coachId,
    coachName: row.coach.fullName,
    fromCountyId: row.fromCounty.id,
    fromCountyName: row.fromCounty.name,
    toCountyId: row.toCounty.id,
    toCountyName: row.toCounty.name,
    status: row.status,
    note: row.note,
    decidedAt: row.decidedAt,
    createdAt: row.createdAt,
  };
}

export async function findUserById(id: string): Promise<UserIdentityRecord | null> {
  return getPrisma().user.findUnique({
    where: { id },
    select: { id: true, role: true, province: true, isActive: true, countyId: true },
  });
}

export async function findCountyById(id: string): Promise<CountyRecord | null> {
  return getPrisma().county.findUnique({ where: { id }, select: { id: true, province: true, name: true } });
}

export async function findLatestRequestByCoachId(coachId: string): Promise<CountyChangeRequestRecord | null> {
  const row = await getPrisma().coachCountyChangeRequest.findFirst({
    where: { coachId },
    select: requestSelection,
    orderBy: { createdAt: "desc" },
  });

  return row === null ? null : toRequestRecord(row);
}

export async function findPendingRequestByCoachId(coachId: string): Promise<CountyChangeRequestRecord | null> {
  const row = await getPrisma().coachCountyChangeRequest.findFirst({
    where: { coachId, status: "PENDING" },
    select: requestSelection,
    orderBy: { createdAt: "desc" },
  });

  return row === null ? null : toRequestRecord(row);
}

export async function createCountyChange(data: CreateCountyChangeData): Promise<CountyChangeRequestRecord> {
  const row = await getPrisma().coachCountyChangeRequest.create({
    data: { coachId: data.coachId, fromCountyId: data.fromCountyId, toCountyId: data.toCountyId },
    select: requestSelection,
  });

  return toRequestRecord(row);
}

function requestWhere(filters: CountyChangeFilters) {
  return {
    ...(filters.status === undefined ? {} : { status: filters.status }),
    ...(filters.province === undefined ? {} : { coach: { province: filters.province } }),
  };
}

export async function countCountyChanges(filters: CountyChangeFilters): Promise<number> {
  return getPrisma().coachCountyChangeRequest.count({ where: requestWhere(filters) });
}

export async function findCountyChanges(filters: CountyChangeFilters, skip: number, take: number): Promise<CountyChangeRequestWithScope[]> {
  const rows = await getPrisma().coachCountyChangeRequest.findMany({
    where: requestWhere(filters),
    select: requestSelection,
    orderBy: { createdAt: "desc" },
    skip,
    take,
  });

  return rows.map((row) => ({ ...toRequestRecord(row), coachProvince: row.coach.province }));
}

export async function findCountyChangeById(id: string): Promise<CountyChangeRequestWithScope | null> {
  const row = await getPrisma().coachCountyChangeRequest.findUnique({ where: { id }, select: requestSelection });

  return row === null ? null : { ...toRequestRecord(row), coachProvince: row.coach.province };
}

export async function decideCountyChangeFromPending(
  id: string,
  input: DecideCountyChangeInput,
): Promise<CountyChangeRequestWithScope | null> {
  return getPrisma().$transaction(async (tx) => {
    const applied = await tx.coachCountyChangeRequest.updateMany({
      where: { id, status: "PENDING" },
      data: {
        status: input.status,
        note: input.note,
        decidedById: input.decidedById,
        decidedAt: new Date(),
      },
    });
    if (applied.count === 0) return null;

    if (input.status === "APPROVED") {
      const row = await tx.coachCountyChangeRequest.findUnique({
        where: { id },
        select: { coachId: true, toCountyId: true },
      });
      if (row) {
        await tx.user.update({ where: { id: row.coachId }, data: { countyId: row.toCountyId } });
      }
    }

    const updated = await tx.coachCountyChangeRequest.findUnique({ where: { id }, select: requestSelection });
    if (updated === null) return null;

    return { ...toRequestRecord(updated), coachProvince: updated.coach.province };
  });
}
