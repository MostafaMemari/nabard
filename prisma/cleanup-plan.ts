import type { Role } from "../src/generated/enums";

export type CleanupUserRow = { id: string; mobile: string; role: Role };

// Child-to-parent delete order for the launch cleanup; every table that can
// reference a deleted user or competition comes before users and competitions.
// Base data (belts, age categories, weight classes, counties) is never listed
// here and is therefore never touched.
export const cleanupDeleteTables = [
  "refunds",
  "registrations",
  "student_documents",
  "student_transfers",
  "students",
  "payments",
  "deadline_extensions",
  "competition_counties",
  "competitions",
  "coach_county_change_requests",
  "audit_logs",
  "login_failures",
  "stored_files",
  "users",
] as const;

// A user was created by seed.dev when its id is one of the fixed seed ids, or
// its mobile is one of the fake seed numbers. SUPER_ADMIN is never a seed user:
// the fallback super admin shares the first seed mobile on purpose.
export function isSeedUser(user: CleanupUserRow, seedUserIds: ReadonlySet<string>, seedMobiles: ReadonlySet<string>): boolean {
  if (user.role === "SUPER_ADMIN") {
    return false;
  }

  return seedUserIds.has(user.id) || seedMobiles.has(user.mobile);
}

// Coaches are always deleted on launch. ADMINs are deleted only when the seed
// created them; every other ADMIN survives. SUPER_ADMIN always survives.
export function planUserDeletions(
  users: CleanupUserRow[],
  seedUserIds: ReadonlySet<string>,
  seedMobiles: ReadonlySet<string>,
): { deleteIds: string[]; keepIds: string[] } {
  const deleteIds: string[] = [];
  const keepIds: string[] = [];

  for (const user of users) {
    const deletable = user.role === "COACH" || (user.role === "ADMIN" && isSeedUser(user, seedUserIds, seedMobiles));
    (deletable ? deleteIds : keepIds).push(user.id);
  }

  return { deleteIds, keepIds };
}
