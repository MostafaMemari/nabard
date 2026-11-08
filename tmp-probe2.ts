import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "./src/generated/client";

const DATABASE_URL = process.env.DATABASE_URL as string;
const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString: DATABASE_URL }) });

async function main() {
  const users = await prisma.user.groupBy({ by: ["role", "isActive"], _count: true });
  const counties = await prisma.county.count();
  const competitions = await prisma.competition.groupBy({ by: ["status"], _count: true });
  const registrations = await prisma.registration.groupBy({ by: ["status"], _count: true });
  const students = await prisma.student.count();
  const superAdmins = await prisma.user.findMany({ where: { role: "SUPER_ADMIN" }, select: { id: true, fullName: true, mobile: true, isActive: true } });
  console.log(JSON.stringify({ users, counties, competitions, registrations, students, superAdmins }, null, 1));
  await prisma.$disconnect();
}

main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
