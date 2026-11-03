import "dotenv/config";
import { CopyObjectCommand, DeleteObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getR2Env } from "../src/lib/env";
import { getPrisma } from "../src/lib/prisma";
import { createR2Client } from "../src/lib/storage/r2";

// One-shot pass that moves every payment receipt out of the public bucket:
// receipts prove bank payments, so they must live in the private receipts
// bucket (R2_RECEIPTS_BUCKET) that has no public endpoint and reach the
// browser only through the authenticated payments file route. The copy keeps
// the object key, replaces the metadata with the mime from the database and
// private caching, verifies the copy against the stored size and only then
// removes the source object from the public bucket.
// Idempotent: receipts already on the private bucket are skipped, so the
// script can be re-run safely. Prints counts only, never file data.

const prisma = getPrisma();
const env = getR2Env();

if (!env) {
  console.error("متغیرهای R2 تنظیم نشده اند.");
  process.exit(1);
}

const targetBucket: string = env.R2_RECEIPTS_BUCKET ?? "";

if (!targetBucket) {
  console.error("متغیر R2_RECEIPTS_BUCKET تنظیم نشده است؛ اول باکت خصوصی رسیدها را بسازید و نامش را ست کنید.");
  process.exit(1);
}

if (targetBucket === env.R2_BUCKET_NAME) {
  console.error("R2_RECEIPTS_BUCKET نباید با R2_BUCKET_NAME یکی باشد؛ رسیدها باید از باکت عمومی جدا شوند.");
  process.exit(1);
}

if (!process.argv.includes("--yes")) {
  console.error("برای اجرا از پرچم --yes استفاده کنید.");
  process.exit(1);
}

const client = createR2Client(env);
const sourceBucket = env.R2_BUCKET_NAME;

type ReceiptRow = { id: string; objectKey: string; mime: string; size: number };

async function findRows(afterId: string | null, take: number): Promise<ReceiptRow[]> {
  const rows = await prisma.storedFile.findMany({
    where: {
      provider: "R2",
      objectKey: { startsWith: "receipts/" },
      ...(afterId === null ? {} : { id: { gt: afterId } }),
    },
    select: { id: true, objectKey: true, mime: true, size: true },
    orderBy: { id: "asc" },
    take,
  });

  return rows.map((row) => ({ ...row, objectKey: row.objectKey as string }));
}

async function objectSize(bucket: string, key: string): Promise<number | null> {
  try {
    const head = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return head.ContentLength ?? null;
  } catch (error) {
    if ((error as { name?: string }).name === "NotFound") return null;
    throw error;
  }
}

let scanned = 0;
let moved = 0;
let skipped = 0;
let missing = 0;
let failed = 0;

async function moveReceipt(row: ReceiptRow): Promise<void> {
  const copySource = `/${sourceBucket}/${row.objectKey.split("/").map(encodeURIComponent).join("/")}`;

  try {
    await client.send(
      new CopyObjectCommand({
        Bucket: targetBucket,
        CopySource: copySource,
        Key: row.objectKey,
        ContentType: row.mime,
        CacheControl: "private, max-age=31536000, immutable",
        MetadataDirective: "REPLACE",
      }),
    );
  } catch (error) {
    // The copy can only fail when the source object is gone, which means the
    // receipt was either moved before (target present) or is missing on both
    // sides (a dangling database row).
    const targetSize = await objectSize(targetBucket, row.objectKey);
    if (targetSize === row.size) {
      skipped += 1;
      return;
    }
    if (targetSize === null) {
      missing += 1;
      console.error(`رسید ${row.id} نه در باکت عمومی بود و نه در باکت خصوصی.`);
      return;
    }
    throw error;
  }

  const targetSize = await objectSize(targetBucket, row.objectKey);
  if (targetSize !== row.size) {
    throw new Error(`حجم نسخه کپی شده با دیتابیس یکی نیست (${row.objectKey}).`);
  }

  await client.send(new DeleteObjectCommand({ Bucket: sourceBucket, Key: row.objectKey }));
  moved += 1;
}

async function main(): Promise<void> {
  let cursor: string | null = null;

  for (;;) {
    const rows = await findRows(cursor, 50);
    if (rows.length === 0) break;
    cursor = rows[rows.length - 1]?.id ?? null;

    for (const row of rows) {
      scanned += 1;

      try {
        await moveReceipt(row);
      } catch (error) {
        failed += 1;
        console.error(`خطا در انتقال رسید ${row.id}:`, error instanceof Error ? error.message : error);
      }
    }
  }
}

main()
  .then(() => {
    console.log(`بررسی شد: ${scanned}`);
    console.log(`به باکت خصوصی منتقل شد: ${moved}`);
    console.log(`از قبل منتقل شده بود: ${skipped}`);
    console.log(`فایل گمشده: ${missing}`);
    console.log(`ناموفق: ${failed}`);
    console.log(`باکت مقصد: ${targetBucket}`);
    return prisma.$disconnect();
  })
  .then(() => process.exit(0))
  .catch(async (error) => {
    console.error("اجرای انتقال رسیدها انجام نشد.");
    console.error(error instanceof Error ? error.message : error);
    await prisma.$disconnect().catch(() => {});
    process.exit(1);
  });
