import "dotenv/config";
import { getServerEnv } from "../src/lib/env";
import { getPrisma } from "../src/lib/prisma";
import { demoCompetitions, demoPayments, demoRegistrations, demoStudents, demoUsers } from "./data/demo";

// Deletes everything seed.dev.ts created (demo users, students, competitions,
// payments, registrations, stored receipts) and keeps base data and the real
// ADMIN_* account. Prints counts only, never personal data.

const prisma = getPrisma();

if (process.env.NODE_ENV === "production") {
  console.error("اجرای این اسکریپت در محیط production مجاز نیست.");
  process.exit(1);
}

if (!process.argv.includes("--yes")) {
  console.error("این اسکریپت همه داده های نمونه ساخته شده با pnpm db:seed:dev را حذف می کند و برگشت پذیر نیست.");
  console.error("برای اجرا دستور را با پرچم تایید بنویسید: pnpm db:clean-demo -- --yes");
  process.exit(1);
}

let keepAdminMobile: string | null = null;
try {
  keepAdminMobile = getServerEnv().ADMIN_MOBILE ?? null;
} catch {
  keepAdminMobile = null;
}

const demoUserIds = demoUsers.map((user) => user.id);
const demoStudentIds = demoStudents.map((student) => student.id);
const demoCompetitionIds = demoCompetitions.map((competition) => competition.id);
const demoPaymentIds = demoPayments.map((payment) => payment.id);
const demoRegistrationIds = demoRegistrations.map((registration) => registration.id);
const demoStoredFileIds = demoPayments.filter((payment) => payment.receiptKey !== null).map((payment) => `stored-${payment.id}`);

const paymentWhere = {
  OR: [{ id: { in: demoPaymentIds } }, { competitionId: { in: demoCompetitionIds } }, { coachId: { in: demoUserIds } }],
};

async function main() {
  const adminFilter = keepAdminMobile === null ? {} : { mobile: { not: keepAdminMobile } };

  const [registrations, payments, storedFiles, students, competitions, users] = await prisma.$transaction(async (tx) => {
    const registrations = await tx.registration.deleteMany({
      where: {
        OR: [
          { id: { in: demoRegistrationIds } },
          { competitionId: { in: demoCompetitionIds } },
          { studentId: { in: demoStudentIds } },
          { coachId: { in: demoUserIds } },
          { paymentId: { in: demoPaymentIds } },
        ],
      },
    });

    const paymentRows = await tx.payment.findMany({ where: paymentWhere, select: { receiptKey: true } });
    const receiptFileIds = new Set<string>(demoStoredFileIds);
    for (const row of paymentRows) {
      if (row.receiptKey !== null) receiptFileIds.add(row.receiptKey);
    }

    const payments = await tx.payment.deleteMany({ where: paymentWhere });
    const storedFiles = await tx.storedFile.deleteMany({ where: { id: { in: [...receiptFileIds] } } });

    const students = await tx.student.deleteMany({ where: { OR: [{ id: { in: demoStudentIds } }, { coachId: { in: demoUserIds } }] } });

    const competitions = await tx.competition.deleteMany({ where: { id: { in: demoCompetitionIds } } });

    const users = await tx.user.deleteMany({ where: { AND: [{ id: { in: demoUserIds } }, adminFilter] } });

    return [registrations, payments, storedFiles, students, competitions, users] as const;
  });

  console.log(
    [
      `ثبت نام های حذف شده: ${registrations.count}`,
      `پرداخت های حذف شده: ${payments.count}`,
      `فایل های حذف شده: ${storedFiles.count}`,
      `هنرجوهای حذف شده: ${students.count}`,
      `مسابقه های حذف شده: ${competitions.count}`,
      `حساب های حذف شده: ${users.count}`,
      "داده های پایه (کمربند، رده سنی، رده وزنی) و حساب مدیر حفظ شدند.",
    ].join("\n"),
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error("حذف داده های نمونه انجام نشد.");
    console.error(error instanceof Error ? error.message : error);
    await prisma.$disconnect();
    process.exit(1);
  });
