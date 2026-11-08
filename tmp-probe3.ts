import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "./src/generated/client";

const DATABASE_URL = process.env.DATABASE_URL as string;
const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString: DATABASE_URL }) });

async function main() {
  const belts = await prisma.belt.count();
  const ageCategories = await prisma.ageCategory.count();
  const weightClasses = await prisma.weightClass.count();
  const ageSample = await prisma.ageCategory.findMany({ select: { id: true, code: true, label: true, startDate: true, endDate: true }, take: 3 });
  const beltSample = await prisma.belt.findMany({ select: { id: true, code: true, label: true, level: true }, orderBy: { level: "asc" }, take: 6 });
  const wcSample = await prisma.weightClass.findMany({ select: { id: true, label: true, minWeightKg: true, maxWeightKg: true, gender: true, ageCategoryId: true }, take: 4 });
  const auditCount = await prisma.auditLog.count();
  const storedFiles = await prisma.storedFile.count();
  const payments = await prisma.payment.count();
  const refunds = await prisma.refund.count();
  const transfers = await prisma.studentTransfer.count();
  const countyChanges = await prisma.coachCountyChangeRequest.count();
  const deadlineExts = await prisma.deadlineExtension.count();
  const loginFailures = await prisma.loginFailure.count();
  console.log(JSON.stringify({ belts, ageCategories, weightClasses, ageSample, beltSample, wcSample, auditCount, storedFiles, payments, refunds, transfers, countyChanges, deadlineExts, loginFailures }, null, 1));
  await prisma.$disconnect();
}

main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
