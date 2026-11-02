import "dotenv/config";
import { normalizeDigits } from "../src/lib/format";
import { getPrisma } from "../src/lib/prisma";

// Promotes the primary admin to SUPER_ADMIN during the Vercel build so no
// manual CLI step is needed. Never fails the build: logs and exits cleanly.
async function main() {
  const mobile = normalizeDigits(
    process.env.SUPER_ADMIN_MOBILE ?? process.env.ADMIN_MOBILE ?? "09123100000",
  );
  const prisma = getPrisma();

  const promoted = await prisma.user.updateMany({
    where: { mobile, role: { not: "SUPER_ADMIN" } },
    data: { role: "SUPER_ADMIN", province: null, isActive: true },
  });

  console.log(`ensure-super-admin: ${JSON.stringify({ mobile, promoted: promoted.count })}`);
}

main()
  .then(async () => getPrisma().$disconnect())
  .catch(async (error) => {
    console.error(`ensure-super-admin skipped: ${error instanceof Error ? error.message : error}`);
    await getPrisma().$disconnect();
  });
