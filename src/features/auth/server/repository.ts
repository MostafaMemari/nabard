import type { Province } from "@/generated/client";
import { getPrisma } from "@/lib/prisma";
import type { SessionRole } from "@/lib/session";

export type UserRecord = {
  id: string;
  mobile: string;
  passwordHash: string;
  fullName: string;
  role: SessionRole;
  province: Province;
  isActive: boolean;
};

const userSelection = {
  id: true,
  mobile: true,
  passwordHash: true,
  fullName: true,
  role: true,
  province: true,
  isActive: true,
} as const;

function toRecord(user: {
  id: string;
  mobile: string;
  passwordHash: string;
  fullName: string;
  role: SessionRole;
  province: Province;
  isActive: boolean;
}): UserRecord {
  return {
    id: user.id,
    mobile: user.mobile,
    passwordHash: user.passwordHash,
    fullName: user.fullName,
    role: user.role,
    province: user.province,
    isActive: user.isActive,
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
