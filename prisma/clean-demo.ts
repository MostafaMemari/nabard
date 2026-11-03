import "dotenv/config";
import { getPrisma } from "../src/lib/prisma";
import { planUserDeletions } from "./cleanup-plan";
import { demoUsers } from "./data/demo";

// Launch cleanup: one transaction that deletes, in foreign key order, every
// operational row (refunds, registrations, student documents, transfers,
// students, payments, deadline extensions, competition counties, competitions,
// county change requests, audit logs, login failures, stored files) and every
// COACH plus every user the dev seed created, keeping base data (belts, age
// categories, weight classes), counties, SUPER_ADMINs and ADMINs that the dev
// seed did not create. Prints table counts only, never personal data.

const prisma = getPrisma();

if (process.env.NODE_ENV === "production") {
  console.error("اجرای این اسکریپت در محیط production مجاز نیست.");
  process.exit(1);
}

if (!process.argv.includes("--yes")) {
  console.error("این اسکریپت همه داده های عملیاتی و مربیان را برای لانچ حذف می کند و برگشت پذیر نیست.");
  console.error("برای اجرا دستور را با پرچم تایید بنویسید: pnpm db:clean-demo -- --yes");
  process.exit(1);
}

const tableCounts = [
  ["refunds", () => prisma.refund.count()],
  ["registrations", () => prisma.registration.count()],
  ["student_documents", () => prisma.studentDocument.count()],
  ["student_transfers", () => prisma.studentTransfer.count()],
  ["students", () => prisma.student.count()],
  ["payments", () => prisma.payment.count()],
  ["deadline_extensions", () => prisma.deadlineExtension.count()],
  ["competition_counties", () => prisma.competitionCounty.count()],
  ["competitions", () => prisma.competition.count()],
  ["coach_county_change_requests", () => prisma.coachCountyChangeRequest.count()],
  ["audit_logs", () => prisma.auditLog.count()],
  ["login_failures", () => prisma.loginFailure.count()],
  ["stored_files", () => prisma.storedFile.count()],
  ["users", () => prisma.user.count()],
  ["belts", () => prisma.belt.count()],
  ["age_categories", () => prisma.ageCategory.count()],
  ["weight_classes", () => prisma.weightClass.count()],
  ["counties", () => prisma.county.count()],
] as const;

async function printCounts(title: string) {
  const rows = await Promise.all(tableCounts.map(async ([table, count]) => `${table}=${await count()}`));
  console.log(`[${title}] ${rows.join(" ")}`);
}

async function main() {
  const seedUserIds = new Set(demoUsers.map((user) => user.id));
  const seedMobiles = new Set(demoUsers.map((user) => user.mobile));

  await printCounts("قبل از پاک سازی");

  const result = await prisma.$transaction(async (tx) => {
    const refunds = await tx.refund.deleteMany({});
    const registrations = await tx.registration.deleteMany({});
    const studentDocuments = await tx.studentDocument.deleteMany({});
    const studentTransfers = await tx.studentTransfer.deleteMany({});
    const students = await tx.student.deleteMany({});
    const payments = await tx.payment.deleteMany({});
    const deadlineExtensions = await tx.deadlineExtension.deleteMany({});
    const competitionCounties = await tx.competitionCounty.deleteMany({});
    const competitions = await tx.competition.deleteMany({});
    const changeRequests = await tx.coachCountyChangeRequest.deleteMany({});
    const auditLogs = await tx.auditLog.deleteMany({});
    const loginFailures = await tx.loginFailure.deleteMany({});
    const storedFiles = await tx.storedFile.deleteMany({});

    const userRows = await tx.user.findMany({ select: { id: true, mobile: true, role: true } });
    const plan = planUserDeletions(userRows, seedUserIds, seedMobiles);
    const users = await tx.user.deleteMany({ where: { id: { in: plan.deleteIds } } });

    return {
      refunds,
      registrations,
      studentDocuments,
      studentTransfers,
      students,
      payments,
      deadlineExtensions,
      competitionCounties,
      competitions,
      changeRequests,
      auditLogs,
      loginFailures,
      storedFiles,
      users,
      keptUsers: plan.keepIds.length,
    };
  });

  console.log(
    [
      `بازپرداخت های حذف شده: ${result.refunds.count}`,
      `ثبت نام های حذف شده: ${result.registrations.count}`,
      `مدارک هنرجو حذف شده: ${result.studentDocuments.count}`,
      `انتقال های حذف شده: ${result.studentTransfers.count}`,
      `هنرجوهای حذف شده: ${result.students.count}`,
      `پرداخت های حذف شده: ${result.payments.count}`,
      `تمدیدهای مهلت حذف شده: ${result.deadlineExtensions.count}`,
      `اتصال مسابقه و شهرستان حذف شده: ${result.competitionCounties.count}`,
      `مسابقه های حذف شده: ${result.competitions.count}`,
      `درخواست های تغییر شهرستان حذف شده: ${result.changeRequests.count}`,
      `لاگ های حسابرسی حذف شده: ${result.auditLogs.count}`,
      `تلاش های ناموفق ورود حذف شده: ${result.loginFailures.count}`,
      `فایل های حذف شده: ${result.storedFiles.count}`,
      `حساب های حذف شده: ${result.users.count}`,
      "داده های پایه (کمربند، رده سنی، رده وزنی)، شهرستان ها و مدیران واقعی حفظ شدند.",
    ].join("\n"),
  );

  await printCounts("بعد از پاک سازی");

  const remaining = await prisma.user.groupBy({
    by: ["role", "province"],
    _count: { _all: true },
    orderBy: [{ role: "asc" }, { province: "asc" }],
  });
  for (const row of remaining) {
    console.log(`باقی مانده: role=${row.role} province=${row.province ?? "-"} count=${row._count._all}`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error("پاک سازی انجام نشد.");
    console.error(error instanceof Error ? error.message : error);
    await prisma.$disconnect();
    process.exit(1);
  });
