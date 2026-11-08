import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "./src/generated/client";
const p = new PrismaClient({ adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL }) });
async function main() {
  const c = await p.competition.findFirst({ select: { id: true } });
  console.log(c?.id ?? "none");
  await p.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
