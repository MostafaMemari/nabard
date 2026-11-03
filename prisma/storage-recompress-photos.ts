import "dotenv/config";
import { randomUUID } from "node:crypto";
import { CopyObjectCommand, DeleteObjectCommand, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";
import { getR2Env } from "../src/lib/env";
import { getPrisma } from "../src/lib/prisma";
import { createR2Client, extensionForMime } from "../src/lib/storage/r2";

// One-shot maintenance pass over every object stored in R2:
// 1. Student profile photos (PHOTO documents) and coach photos that predate
//    client-side compression are re-encoded to WebP, capped at 512 px on the
//    long edge with a quality ladder targeting 100 KB.
// 2. Every object whose key lacks the file extension of its mime (rows
//    migrated from Postgres) is copied to `folder/<uuid>.<ext>` with
//    ContentType and CacheControl metadata, so the public R2 endpoint serves
//    a self-describing url with the right media type.
// Idempotent: already-normalized objects are skipped, so the script can be
// re-run safely. Prints counts only, never file data.

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

type FileRow = { id: string; objectKey: string; mime: string; size: number; isPhoto: boolean };

async function findRows(afterId: string | null, take: number): Promise<FileRow[]> {
  const rows = await prisma.storedFile.findMany({
    where: {
      provider: "R2",
      objectKey: { not: null },
      ...(afterId === null ? {} : { id: { gt: afterId } }),
    },
    select: {
      id: true,
      objectKey: true,
      mime: true,
      size: true,
      coachPhoto: { select: { id: true } },
      studentDocuments: { select: { type: true } },
    },
    orderBy: { id: "asc" },
    take,
  });

  return rows.map((row) => ({
    id: row.id,
    objectKey: row.objectKey as string,
    mime: row.mime,
    size: row.size,
    isPhoto: row.coachPhoto !== null || row.studentDocuments.some((doc) => doc.type === "PHOTO"),
  }));
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
let reformatted = 0;
let failed = 0;
let savedBytes = 0;

async function copyWithMetadata(row: FileRow, newKey: string, mime: string): Promise<void> {
  // The content is already fine; the copy only gives the object a
  // self-describing key and the metadata the public endpoint needs.
  await client.send(
    new CopyObjectCommand({
      Bucket: bucket,
      CopySource: `/${bucket}/${row.objectKey.split("/").map(encodeURIComponent).join("/")}`,
      Key: newKey,
      ContentType: mime,
      CacheControl: "public, max-age=31536000, immutable",
      MetadataDirective: "REPLACE",
    }),
  );
}

async function main(): Promise<void> {
  let cursor: string | null = null;

  for (;;) {
    const rows = await findRows(cursor, 50);
    if (rows.length === 0) break;
    cursor = rows[rows.length - 1]?.id ?? null;

    for (const row of rows) {
      scanned += 1;

      const extension = extensionForMime(row.mime);
      const needsExtension = extension !== "" && !row.objectKey.endsWith(extension);
      const photoNeedsReencode = row.isPhoto && !(row.mime === "image/webp" && row.size <= TARGET_BYTES);

      if (!photoNeedsReencode && !needsExtension) {
        skipped += 1;
        continue;
      }

      try {
        let bytes: Buffer | null = null;
        let outMime = row.mime;
        let outSize = row.size;

        if (photoNeedsReencode) {
          const object = await client.send(new GetObjectCommand({ Bucket: bucket, Key: row.objectKey }));
          const body = await object.Body?.transformToByteArray();
          if (!body) throw new Error("empty body");

          const encoded = await encodeImage(Buffer.from(body));
          if (encoded !== null && encoded.size <= row.size * (1 - MIN_SAVINGS_RATIO)) {
            bytes = encoded.webp;
            outMime = "image/webp";
            outSize = encoded.size;
          }
        }

        const newKey = `${row.objectKey.split("/")[0] ?? "files"}/${randomUUID()}${extensionForMime(outMime)}`;

        if (bytes === null) {
          await copyWithMetadata(row, newKey, outMime);
        } else {
          await client.send(
            new PutObjectCommand({
              Bucket: bucket,
              Key: newKey,
              Body: bytes,
              ContentType: outMime,
              CacheControl: "public, max-age=31536000, immutable",
            }),
          );
        }

        try {
          await prisma.storedFile.update({
            where: { id: row.id },
            data: { objectKey: newKey, mime: outMime, size: outSize },
          });
        } catch (error) {
          // The row still points at the old object, so only the unused copy
          // is removed before failing.
          await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: newKey })).catch(() => {});
          throw error;
        }

        await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: row.objectKey }));

        if (bytes === null) {
          reformatted += 1;
        } else {
          recompressed += 1;
          savedBytes += row.size - outSize;
        }
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
    console.log(`فرمت و متادیتا اصلاح شد: ${reformatted}`);
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
