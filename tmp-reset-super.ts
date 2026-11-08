import { hash } from "bcryptjs";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "./src/generated/client";

const DATABASE_URL = process.env.DATABASE_URL as string;
const PASSWORD = process.env.SUPER_PASSWORD as string;
const SUPER_ID = "9350fa8f-aa05-4872-b04d-034b47d017ef";

async function main() {
  const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString: DATABASE_URL }) });
  const passwordHash = await hash(PASSWORD, 10);
  const updated = await prisma.user.updateMany({ where: { id: SUPER_ID, role: "SUPER_ADMIN" }, data: { passwordHash, isActive: true } });
  console.log(JSON.stringify({ updated: updated.count }));
  await prisma.$disconnect();
}

main().catch(async (e) => { console.error(e); process.exit(1); });
