import type { Province } from "@/generated/client";
import { getPrisma } from "@/lib/prisma";
import type { SessionRole } from "@/lib/session";
import type { LoginThrottleRepository } from "./throttle";

export type UserRecord = {
  id: string;
  mobile: string;
  passwordHash: string;
  fullName: string;
  role: SessionRole;
  province: Province | null;
  isActive: boolean;
  countyId: string | null;
  countyName: string | null;
};

const userSelection = {
  id: true,
  mobile: true,
  passwordHash: true,
  fullName: true,
  role: true,
  province: true,
  isActive: true,
  county: { select: { id: true, name: true } },
} as const;

function toRecord(user: {
  id: string;
  mobile: string;
  passwordHash: string;
  fullName: string;
  role: SessionRole;
  province: Province | null;
  isActive: boolean;
  county: { id: string; name: string } | null;
}): UserRecord {
  return {
    id: user.id,
    mobile: user.mobile,
    passwordHash: user.passwordHash,
    fullName: user.fullName,
    role: user.role,
    province: user.province,
    isActive: user.isActive,
    countyId: user.county?.id ?? null,
    countyName: user.county?.name ?? null,
  };
}

export async function findUserByMobile(mobile: string): Promise<UserRecord | null> {
  const user = await getPrisma().user.findUnique({ where: { mobile }, select: userSelection });
  return user ? toRecord(user) : null;
}

export async function findUserById(id: string): Promise<UserRecord | null> {
  const user = await getPrisma().user.findUnique({ where: { id }, select: userSelection });
  return user ? toRecord(user) : null;
}

export async function updatePassword(id: string, passwordHash: string): Promise<void> {
  await getPrisma().user.update({ where: { id }, data: { passwordHash }, select: { id: true } });
}

export const loginThrottleRepository: LoginThrottleRepository = {
  async countLoginFailuresBy(keys: string[], since: Date): Promise<Record<string, number>> {
    if (keys.length === 0) return {};

    const rows = await getPrisma().loginFailure.groupBy({
      by: ["key"],
      where: { key: { in: keys }, createdAt: { gte: since } },
      _count: { key: true },
    });

    return Object.fromEntries(rows.map((row) => [row.key, row._count.key]));
  },

  async recordLoginFailures(keys: string[], at: Date): Promise<void> {
    await getPrisma().loginFailure.createMany({ data: keys.map((key) => ({ key, createdAt: at })) });
  },

  async clearLoginFailures(keys: string[]): Promise<void> {
    await getPrisma().loginFailure.deleteMany({ where: { key: { in: keys } } });
  },

  async pruneLoginFailures(before: Date): Promise<void> {
    await getPrisma().loginFailure.deleteMany({ where: { createdAt: { lt: before } } });
  },
};
