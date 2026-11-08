import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "./src/generated/client";

const DATABASE_URL = process.env.DATABASE_URL as string;
const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString: DATABASE_URL }) });

async function main() {
  await prisma.auditLog.deleteMany();
  await prisma.refund.deleteMany();
  await prisma.registration.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.studentDocument.deleteMany();
  await prisma.storedFile.deleteMany();
  await prisma.student.deleteMany();
  await prisma.deadlineExtension.deleteMany();
  await prisma.competitionCounty.deleteMany();
  await prisma.studentTransfer.deleteMany();
  await prisma.coachCountyChangeRequest.deleteMany();
  await prisma.competition.deleteMany();
  await prisma.user.deleteMany({ where: { role: { not: "SUPER_ADMIN" } } });
  await prisma.county.deleteMany();
  await prisma.weightClass.deleteMany();
  await prisma.ageCategory.deleteMany();
  await prisma.belt.deleteMany();
  await prisma.loginFailure.deleteMany();

  const [users, counties, competitions, registrations, students, belts, ageCategories, weightClasses, payments, auditLogs, storedFiles, loginFailures] = await Promise.all([
    prisma.user.findMany({ select: { role: true, fullName: true, mobile: true, isActive: true } }),
    prisma.county.count(),
    prisma.competition.count(),
    prisma.registration.count(),
    prisma.student.count(),
    prisma.belt.count(),
    prisma.ageCategory.count(),
    prisma.weightClass.count(),
    prisma.payment.count(),
    prisma.auditLog.count(),
    prisma.storedFile.count(),
    prisma.loginFailure.count(),
  ]);

  console.log(JSON.stringify({ users, counties, competitions, registrations, students, belts, ageCategories, weightClasses, payments, auditLogs, storedFiles, loginFailures }, null, 1));
  await prisma.$disconnect();
}

main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
