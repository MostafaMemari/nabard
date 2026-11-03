import "dotenv/config";
import { randomUUID } from "node:crypto";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getR2Env } from "../src/lib/env";
import { getPrisma } from "../src/lib/prisma";
import { createR2Client } from "../src/lib/storage/r2";
import type { StorageFolder } from "../src/lib/storage/types";
import { type MigrationRow, migrateStoredFilesToR2 } from "./storage-migration";

// One-shot migration: copies every provider=db StoredFile row (payment receipts
// and student profile photos) into the private Cloudflare R2 bucket, verifies
// size and sha-256 of each copy, then rewrites the row to provider=r2 with a
// null data and a stable objectKey. Rows that no receipt and no document
// reference are skipped and counted. Prints counts only, never file data.

const prisma = getPrisma();
const env = getR2Env();

async function findNextBatch(afterId: string | null, take: number): Promise<MigrationRow[]> {
  const rows = await prisma.storedFile.findMany({
    where: { provider: "DB", ...(afterId === null ? {} : { id: { gt: afterId } }) },
    select: {
      id: true,
      mime: true,
      size: true,
      data: true,
      studentDocuments: { select: { type: true }, take: 1 },
    },
    orderBy: { id: "asc" },
    take,
  });

  if (rows.length === 0) return [];

  const receiptKeys = new Set<string>();
  const payments = await prisma.payment.findMany({
    where: { receiptKey: { in: rows.map((row) => row.id) } },
    select: { receiptKey: true },
  });
  for (const payment of payments) {
    if (payment.receiptKey !== null) receiptKeys.add(payment.receiptKey);
  }

  return rows.map((row) => {
    let folder: StorageFolder | null = null;
    if (receiptKeys.has(row.id)) {
      folder = "receipts";
    } else if (row.studentDocuments[0]?.type === "PHOTO") {
      folder = "student-photos";
    } else if (row.studentDocuments.length > 0) {
      folder = "student-documents";
    }

    return { id: row.id, mime: row.mime, size: row.size, data: row.data, folder };
  });
}

async function main(): Promise<void> {
  if (!process.argv.includes("--yes")) {
    console.error("این اسکریپت فایل های دیتابیس را به R2 منتقل می کند.");
    console.error("برای اجرا دستور را با پرچم تایید بنویسید: pnpm storage:migrate-to-r2 -- --yes");
    process.exit(1);
  }

  if (!env) {
    console.error("متغیرهای R2_ACCOUNT_ID، R2_ACCESS_KEY_ID، R2_SECRET_ACCESS_KEY و R2_BUCKET_NAME تنظیم نشده اند.");
    process.exit(1);
  }

  const client = createR2Client(env);
  const bucket = env.R2_BUCKET_NAME;

  const counts = await migrateStoredFilesToR2({
    findNextBatch,
    putObject: async ({ mime, folder, data }) => {
      const objectKey = `${folder}/${randomUUID()}`;
      await client.send(new PutObjectCommand({ Bucket: bucket, Key: objectKey, Body: data, ContentType: mime }));
      return { objectKey };
    },
    fetchObject: async (objectKey) => {
      const object = await client.send(new GetObjectCommand({ Bucket: bucket, Key: objectKey }));
      if (!object.Body) throw new Error("empty object body");
      const data = new Uint8Array(await object.Body.transformToByteArray());
      return { size: data.byteLength, data };
    },
    markMigrated: async (id, objectKey) => {
      const applied = await prisma.storedFile.updateMany({
        where: { id, provider: "DB" },
        data: { provider: "R2", objectKey, data: null },
      });
      return applied.count === 1;
    },
    deleteObject: async (objectKey) => {
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: objectKey }));
    },
  });

  console.log(
    [
      `بررسی شده: ${counts.scanned}`,
      `منتقل شده: ${counts.migrated}`,
      `رد شده بدون مرجع: ${counts.skippedOrphan}`,
      `ناموفق: ${counts.failed}`,
    ].join(" "),
  );

  if (counts.failed > 0) process.exit(1);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error("انتقال فایل ها به R2 انجام نشد.");
    console.error(error instanceof Error ? error.message : error);
    await prisma.$disconnect();
    process.exit(1);
  });
