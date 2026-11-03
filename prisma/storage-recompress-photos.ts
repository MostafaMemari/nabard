import "dotenv/config";
import { randomUUID } from "node:crypto";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";
import { getR2Env } from "../src/lib/env";
import { getPrisma } from "../src/lib/prisma";
import { createR2Client } from "../src/lib/storage/r2";

// One-shot pass over photos that were uploaded to R2 before client-side
// compression existed: student profile photos (PHOTO documents) and coach
// profile photos. Each object is re-encoded to WebP, capped at 512 px on the
// long edge with a quality ladder targeting 100 KB, stored under a new key
// and the metadata row is pointed at it before the old object is deleted.
// Idempotent: objects that are already small WebP images are skipped, so the
// script can be re-run safely. Prints counts only, never file data.

const MAX_EDGE = 512;
const TARGET_BYTES = 100 * 1024;
const MIN_SAVINGS_RATIO = 0.05;
const QUALITY_STEPS = [0.85, 0.75, 0.65, 0.55];

const prisma = getPrisma();
const env = getR2Env();

if (!env) {
  console.error("متغیرهای R2 تنظیم نشده اند.");
  process.exit(1);
}

if (!process.argv.includes("--yes")) {
  console.error("برای اجرا از پرچم --yes استفاده کنید.");
  process.exit(1);
}

const client = createR2Client(env);
const bucket = env.R2_BUCKET_NAME;

type PhotoRow = { id: string; objectKey: string; mime: string; size: number };

async function findPhotoRows(afterId: string | null, take: number): Promise<PhotoRow[]> {
  const rows = await prisma.storedFile.findMany({
    where: {
      provider: "R2",
      objectKey: { not: null },
      ...(afterId === null ? {} : { id: { gt: afterId } }),
      OR: [{ studentDocuments: { some: { type: "PHOTO" } } }, { coachPhoto: { isNot: null } }],
    },
    select: { id: true, objectKey: true, mime: true, size: true },
    orderBy: { id: "asc" },
    take,
  });

  return rows.map((row) => ({ ...row, objectKey: row.objectKey as string }));
}

async function encodeImage(bytes: Buffer): Promise<{ webp: Buffer; size: number } | null> {
  const image = sharp(bytes, { failOn: "none" }).rotate();

  const metadata = await image.metadata().catch(() => null);
  if (!metadata || metadata.format === undefined) return null;

  const needsResize = (metadata.width ?? 0) > MAX_EDGE || (metadata.height ?? 0) > MAX_EDGE;
  const pipeline = needsResize ? image.resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside", withoutEnlargement: true }) : image;

  for (const quality of QUALITY_STEPS) {
    const webp = await pipeline
      .clone()
      .webp({ quality })
      .toBuffer()
      .catch(() => null);
    if (webp !== null && webp.byteLength <= TARGET_BYTES) return { webp, size: webp.byteLength };
  }

  return null;
}

let scanned = 0;
let skipped = 0;
let recompressed = 0;
let failed = 0;
let savedBytes = 0;

async function main(): Promise<void> {
  let cursor: string | null = null;

  for (;;) {
    const rows = await findPhotoRows(cursor, 50);
    if (rows.length === 0) break;
    cursor = rows[rows.length - 1]?.id ?? null;

    for (const row of rows) {
      scanned += 1;

      if (row.mime === "image/webp" && row.size <= TARGET_BYTES) {
        skipped += 1;
        continue;
      }

      try {
        const object = await client.send(new GetObjectCommand({ Bucket: bucket, Key: row.objectKey }));
        const body = await object.Body?.transformToByteArray();
        if (!body) throw new Error("empty body");

        const encoded = await encodeImage(Buffer.from(body));
        if (encoded === null || encoded.size > row.size * (1 - MIN_SAVINGS_RATIO)) {
          skipped += 1;
          continue;
        }

        const folder = row.objectKey.split("/")[0] ?? "student-photos";
        const newKey = `${folder}/${randomUUID()}`;
        await client.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: newKey,
            Body: encoded.webp,
            ContentType: "image/webp",
            CacheControl: "public, max-age=31536000, immutable",
          }),
        );

        try {
          await prisma.storedFile.update({
            where: { id: row.id },
            data: { objectKey: newKey, mime: "image/webp", size: encoded.size },
          });
        } catch (error) {
          // The row still points at the old object, so only the unused copy
          // is removed before failing.
          await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: newKey })).catch(() => {});
          throw error;
        }

        await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: row.objectKey }));

        recompressed += 1;
        savedBytes += row.size - encoded.size;
      } catch (error) {
        failed += 1;
        console.error(`خطا در پردازش فایل ${row.id}:`, error instanceof Error ? error.message : error);
      }
    }
  }
}

main()
  .then(() => {
    console.log(`بررسی شد: ${scanned}`);
    console.log(`از قبل بهینه: ${skipped}`);
    console.log(`فشرده سازی مجدد شد: ${recompressed}`);
    console.log(`ناموفق: ${failed}`);
    console.log(`صرفه جویی حجم: ${Math.round(savedBytes / 1024)} کیلوبایت`);
    return prisma.$disconnect();
  })
  .then(() => process.exit(0))
  .catch(async (error) => {
    console.error("اجرای فشرده سازی عکس ها انجام نشد.");
    console.error(error instanceof Error ? error.message : error);
    await prisma.$disconnect().catch(() => {});
    process.exit(1);
  });
