import "dotenv/config";
import { readFileSync } from "node:fs";
import { hashSync } from "bcryptjs";
import { getPrisma } from "../src/lib/prisma";
import { belts } from "./data/base-data";
import { demoCompetitions, demoPayments, demoRegistrations, demoStudents, demoUsers } from "./data/demo";

const prisma = getPrisma();

if (process.env.NODE_ENV === "production") {
  console.error("اجرای داده های نمونه توسعه در محیط production مجاز نیست.");
  process.exit(1);
}

const devPasswordHash = hashSync("nabard-dev-1404", 10);

const sampleReceipt = readFileSync(new URL("../public/receipts/receipt-sample.png", import.meta.url));

const beltLevelById = new Map(belts.map((belt) => [belt.id, belt.level]));

function beltRange(beltIds: string[]): { minBeltId: string; maxBeltId: string } {
  const sorted = [...beltIds].sort((left, right) => (beltLevelById.get(left) ?? 0) - (beltLevelById.get(right) ?? 0));

  return { minBeltId: sorted[0], maxBeltId: sorted[sorted.length - 1] };
}

async function main() {
  const beltCount = await prisma.belt.count();

  if (beltCount === 0) {
    throw new Error("داده های پایه یافت نشد. ابتدا pnpm db:seed را اجرا کنید.");
  }

  for (const user of demoUsers) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: {
        mobile: user.mobile,
        fullName: user.fullName,
        nationalCode: user.nationalCode,
        role: user.role,
        province: user.province,
        isActive: user.isActive,
      },
      create: { ...user, passwordHash: devPasswordHash },
    });
  }

  for (const student of demoStudents) {
    await prisma.student.upsert({
      where: { id: student.id },
      update: {
        fullName: student.fullName,
        gender: student.gender,
        nationalCode: student.nationalCode,
        birthDate: new Date(student.birthDate),
        weightKg: student.weightKg,
        beltId: student.beltId,
        coachId: student.coachId,
      },
      create: {
        id: student.id,
        fullName: student.fullName,
        gender: student.gender,
        nationalCode: student.nationalCode,
        birthDate: new Date(student.birthDate),
        weightKg: student.weightKg,
        beltId: student.beltId,
        coachId: student.coachId,
        createdAt: new Date(student.createdAt),
      },
    });
  }

  for (const competition of demoCompetitions) {
    const range = beltRange(competition.beltIds);

    await prisma.competition.upsert({
      where: { id: competition.id },
      update: {
        title: competition.title,
        province: competition.province,
        discipline: competition.discipline,
        gender: competition.gender,
        ageCategoryId: competition.ageCategoryId,
        minBeltId: range.minBeltId,
        maxBeltId: range.maxBeltId,
        feePerStudent: BigInt(competition.feePerStudent),
        payeeCardNumber: competition.payeeCardNumber,
        payeeCardHolder: competition.payeeCardHolder,
        registrationDeadline: new Date(competition.registrationDeadline),
        eventDate: new Date(competition.eventDate),
        status: competition.status,
      },
      create: {
        id: competition.id,
        title: competition.title,
        province: competition.province,
        discipline: competition.discipline,
        gender: competition.gender,
        ageCategoryId: competition.ageCategoryId,
        minBeltId: range.minBeltId,
        maxBeltId: range.maxBeltId,
        feePerStudent: BigInt(competition.feePerStudent),
        payeeCardNumber: competition.payeeCardNumber,
        payeeCardHolder: competition.payeeCardHolder,
        registrationDeadline: new Date(competition.registrationDeadline),
        eventDate: new Date(competition.eventDate),
        status: competition.status,
        createdAt: new Date(competition.createdAt),
        updatedAt: new Date(competition.updatedAt),
      },
    });
  }

  for (const payment of demoPayments) {
    await prisma.payment.upsert({
      where: { id: payment.id },
      update: {
        competitionId: payment.competitionId,
        coachId: payment.coachId,
        amount: BigInt(payment.amount),
        receiptKey: payment.receiptKey,
        status: payment.status,
        note: payment.note,
      },
      create: {
        id: payment.id,
        competitionId: payment.competitionId,
        coachId: payment.coachId,
        amount: BigInt(payment.amount),
        receiptKey: payment.receiptKey,
        status: payment.status,
        note: payment.note,
        createdAt: new Date(payment.createdAt),
        updatedAt: new Date(payment.updatedAt),
      },
    });
  }

  for (const payment of demoPayments) {
    if (payment.receiptKey === null) {
      continue;
    }

    const fileId = `stored-${payment.id}`;
    await prisma.storedFile.upsert({
      where: { id: fileId },
      update: { mime: "image/png", size: sampleReceipt.byteLength, data: sampleReceipt },
      create: { id: fileId, mime: "image/png", size: sampleReceipt.byteLength, data: sampleReceipt },
    });
    await prisma.payment.update({ where: { id: payment.id }, data: { receiptKey: fileId } });
  }

  for (const registration of demoRegistrations) {
    await prisma.registration.upsert({
      where: { id: registration.id },
      update: {
        competitionId: registration.competitionId,
        studentId: registration.studentId,
        coachId: registration.coachId,
        paymentId: registration.paymentId,
        weightClassId: registration.weightClassId,
        status: registration.status,
        note: registration.note,
      },
      create: {
        id: registration.id,
        competitionId: registration.competitionId,
        studentId: registration.studentId,
        coachId: registration.coachId,
        paymentId: registration.paymentId,
        weightClassId: registration.weightClassId,
        status: registration.status,
        note: registration.note,
        createdAt: new Date(registration.createdAt),
      },
    });
  }

  console.log(
    `داده های نمونه ساخته شدند: ${demoUsers.length} کاربر، ${demoStudents.length} هنرجو، ${demoCompetitions.length} مسابقه، ${demoPayments.length} پرداخت و ${demoRegistrations.length} ثبت نام.`,
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
