import { normalizeDigits } from "./format";
import { getPrisma } from "./prisma";

const FALLBACK_MOBILE = "09123100000";

// Guarantees the system has at least one SUPER_ADMIN. Runs only when zero
// super admins exist, promoting the first configured mobile that matches a
// real user. Safe to run on every boot: it becomes a no-op afterwards.
export async function ensureSuperAdmin(): Promise<void> {
  const prisma = getPrisma();
  const existing = await prisma.user.count({ where: { role: "SUPER_ADMIN" } });
  if (existing > 0) return;

  const candidates = [process.env.SUPER_ADMIN_MOBILE, process.env.ADMIN_MOBILE, FALLBACK_MOBILE]
    .filter((mobile): mobile is string => typeof mobile === "string" && mobile.trim().length > 0)
    .map((mobile) => normalizeDigits(mobile));

  for (const mobile of candidates) {
    const promoted = await prisma.user.updateMany({
      where: { mobile, isActive: true },
      data: { role: "SUPER_ADMIN", province: null },
    });
    if (promoted.count > 0) {
      console.log(`ensure-super-admin: promoted ${mobile}`);
      return;
    }
  }

  console.log("ensure-super-admin: no matching user found, skipped");
}
