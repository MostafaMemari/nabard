import "dotenv/config";
import { readFileSync } from "node:fs";
import { hashSync } from "bcryptjs";
import { getPrisma } from "../src/lib/prisma";
import { belts } from "./data/base-data";
import { demoCompetitions, demoCountyChangeRequests, demoPayments, demoRegistrations, demoStudents, demoUsers } from "./data/demo";

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

  const counties = await prisma.county.findMany({ where: { province: "TEHRAN" } });
  const countyIdByName = new Map(counties.map((county) => [county.name, county.id]));

  function countyId(name: string): string {
    const id = countyIdByName.get(name);
    if (!id) throw new Error(`شهرستان «${name}» در داده های پایه یافت نشد. ابتدا pnpm db:seed را اجرا کنید.`);

    return id;
  }

  for (const user of demoUsers) {
    const coachCountyId = user.countyName === null ? null : countyId(user.countyName);

    await prisma.user.upsert({
      where: { id: user.id },
      update: {
        mobile: user.mobile,
        fullName: user.fullName,
        nationalCode: user.nationalCode,
        role: user.role,
        province: user.province,
        isActive: user.isActive,
        countyId: coachCountyId,
      },
      create: {
        id: user.id,
        mobile: user.mobile,
        fullName: user.fullName,
        nationalCode: user.nationalCode,
        role: user.role,
        province: user.province,
        isActive: user.isActive,
        countyId: coachCountyId,
        passwordHash: devPasswordHash,
        createdAt: new Date(user.createdAt),
      },
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
        profileStatus: "APPROVED",
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
        profileStatus: "APPROVED",
        createdAt: new Date(student.createdAt),
      },
    });
  }

  for (const competition of demoCompetitions) {
    const range = beltRange(competition.beltIds);
    const level = competition.level;

    await prisma.competition.upsert({
      where: { id: competition.id },
      update: {
        title: competition.title,
        province: competition.province,
        level,
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
        level,
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

    await prisma.competitionCounty.deleteMany({ where: { competitionId: competition.id } });
    if (competition.countyNames.length > 0) {
      await prisma.competitionCounty.createMany({
        data: competition.countyNames.map((name) => ({ competitionId: competition.id, countyId: countyId(name) })),
      });
    }
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

  for (const request of demoCountyChangeRequests) {
    const admin = demoUsers.find((user) => user.role === "ADMIN" && user.isActive);

    await prisma.coachCountyChangeRequest.upsert({
      where: { id: request.id },
      update: {
        coachId: request.coachId,
        fromCountyId: countyId(request.fromCountyName),
        toCountyId: countyId(request.toCountyName),
        status: request.status,
        note: request.note,
        decidedById: request.decided ? (admin?.id ?? null) : null,
        decidedAt: request.decided ? new Date(request.createdAt) : null,
      },
      create: {
        id: request.id,
        coachId: request.coachId,
        fromCountyId: countyId(request.fromCountyName),
        toCountyId: countyId(request.toCountyName),
        status: request.status,
        note: request.note,
        decidedById: request.decided ? (admin?.id ?? null) : null,
        decidedAt: request.decided ? new Date(request.createdAt) : null,
        createdAt: new Date(request.createdAt),
      },
    });
  }

  console.log(
    `داده های نمونه ساخته شدند: ${demoUsers.length} کاربر، ${demoStudents.length} هنرجو، ${demoCompetitions.length} مسابقه، ${demoPayments.length} پرداخت، ${demoRegistrations.length} ثبت نام و ${demoCountyChangeRequests.length} درخواست تغییر شهرستان.`,
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
