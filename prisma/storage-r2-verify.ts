import "dotenv/config";
import { getPrisma } from "../src/lib/prisma";

// Storage gate: fails while provider=db rows that the app still serves are left
// in PostgreSQL (payment receipts, student documents, coach photos). Rows with
// no reference are ignored on purpose: nothing reads them, and the migration
// script skips them the same way. Prints counts only, never file data.

const prisma = getPrisma();

async function main(): Promise<void> {
  const receiptKeys = (
    await prisma.payment.findMany({
      where: { receiptKey: { not: null } },
      select: { receiptKey: true },
    })
  ).map((payment) => payment.receiptKey as string);

  const [documentsAndPhotos, receipts, onR2] = await Promise.all([
    prisma.storedFile.count({
      where: {
        provider: "DB",
        data: { not: null },
        OR: [{ coachPhoto: { isNot: null } }, { studentDocuments: { some: {} } }],
      },
    }),
    receiptKeys.length === 0
      ? Promise.resolve(0)
      : prisma.storedFile.count({
          where: { id: { in: receiptKeys }, provider: "DB", data: { not: null } },
        }),
    prisma.storedFile.count({ where: { provider: "R2" } }),
  ]);

  const remaining = documentsAndPhotos + receipts;

  console.log([`مانده در دیتابیس: ${remaining}`, `منتقل شده به R2: ${onR2}`].join(" "));

  if (remaining > 0) process.exit(1);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error("بررسی وضعیت ذخیره سازی انجام نشد.");
    console.error(error instanceof Error ? error.message : error);
    await prisma.$disconnect();
    process.exit(1);
  });
