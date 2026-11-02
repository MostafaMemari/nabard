import "dotenv/config";
import { ensureSuperAdmin } from "../src/lib/ensure-super-admin";
import { getPrisma } from "../src/lib/prisma";

ensureSuperAdmin()
  .then(async () => getPrisma().$disconnect())
  .catch(async (error) => {
    console.error(`ensure-super-admin skipped: ${error instanceof Error ? error.message : error}`);
    await getPrisma().$disconnect();
  });
