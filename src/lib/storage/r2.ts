import { randomUUID } from "node:crypto";
import type { GetObjectCommandOutput } from "@aws-sdk/client-s3";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { R2Env } from "@/lib/env";
import { getPrisma } from "@/lib/prisma";
import type { Storage, StoredFileContent, StoredFileInfo, StoredFileInput } from "./types";

const fileInfoSelection = { id: true, mime: true, size: true } as const;

// When R2_PUBLIC_URL is configured (the bucket's public r2.dev subdomain or a
// custom domain), photo urls point straight at that endpoint: no signature and
// no backend hop. Without it (local development) presigned urls keep the app
// working; they stay valid for a day, but signing on every request would
// produce a fresh signature each time and defeat the browser cache, so one
// url is reused per object key for an hour.
const PRESIGN_VALID_SECONDS = 24 * 60 * 60;
const PRESIGN_REUSE_MS = 60 * 60 * 1000;

// Object keys end with the file's extension so urls are self-describing about
// the image format (e.g. student-photos/<uuid>.webp).
const EXTENSIONS: Record<string, string> = {
  "image/webp": ".webp",
  "image/jpeg": ".jpg",
  "image/png": ".png",
};

export function extensionForMime(mime: string): string {
  return EXTENSIONS[mime] ?? "";
}

export function createR2Client(env: R2Env): S3Client {
  return new S3Client({
    region: "auto",
    endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    },
  });
}

export function createR2Storage(env: R2Env, client: S3Client = createR2Client(env)): Storage {
  const bucket = env.R2_BUCKET_NAME;
  // Receipts prove bank payments, so they live in a separate bucket without
  // any public endpoint and reach the browser only through the authenticated
  // payments file route. With R2_RECEIPTS_BUCKET unset (local development,
  // single bucket) they fall back to the main bucket behind presigned urls.
  const receiptsBucket = env.R2_RECEIPTS_BUCKET || env.R2_BUCKET_NAME;

  function bucketForKey(objectKey: string): string {
    return objectKey.startsWith("receipts/") ? receiptsBucket : bucket;
  }

  const presignedUrls = new Map<string, { url: string; signedAt: number }>();

  async function presignGetUrl(targetBucket: string, objectKey: string): Promise<string> {
    const cacheKey = `${targetBucket}/${objectKey}`;
    const cached = presignedUrls.get(cacheKey);
    if (cached && Date.now() - cached.signedAt < PRESIGN_REUSE_MS) return cached.url;

    const command = new GetObjectCommand({ Bucket: targetBucket, Key: objectKey });
    const url = await getSignedUrl(client, command, { expiresIn: PRESIGN_VALID_SECONDS });
    presignedUrls.set(cacheKey, { url, signedAt: Date.now() });

    return url;
  }

  return {
    async put(input: StoredFileInput): Promise<StoredFileInfo> {
      const objectKey = `${input.folder}/${randomUUID()}${extensionForMime(input.mime)}`;
      const target = input.folder === "receipts" ? receiptsBucket : bucket;

      await client.send(
        new PutObjectCommand({
          Bucket: target,
          Key: objectKey,
          Body: input.data,
          ContentType: input.mime,
          // Keys are UUIDs and never change content, so browsers can cache
          // the object for as long as they keep the URL. Receipts are
          // session-gated, so shared caches must not store them.
          CacheControl: input.folder === "receipts" ? "private, max-age=31536000, immutable" : "public, max-age=31536000, immutable",
        }),
      );

      try {
        return await getPrisma().storedFile.create({
          data: { mime: input.mime, size: input.data.byteLength, provider: "R2", objectKey, data: null },
          select: fileInfoSelection,
        });
      } catch (error) {
        await client.send(new DeleteObjectCommand({ Bucket: target, Key: objectKey })).catch(() => {});
        throw error;
      }
    },

    async get(id: string): Promise<StoredFileContent | null> {
      const row = await getPrisma().storedFile.findUnique({
        where: { id },
        select: { ...fileInfoSelection, objectKey: true },
      });

      if (!row?.objectKey) return null;

      let object: GetObjectCommandOutput;
      try {
        object = await client.send(new GetObjectCommand({ Bucket: bucketForKey(row.objectKey), Key: row.objectKey }));
      } catch (error) {
        // The object can be gone while its metadata row still exists (for
        // example an old row left behind before the SetNull migration). The
        // callers turn null into a clean 404 instead of a 500.
        const name = (error as { name?: string }).name;
        if (name === "NoSuchKey" || name === "NotFound") return null;

        throw error;
      }
      const body = object.Body;
      if (!body) return null;

      return { mime: row.mime, size: row.size, stream: body.transformToWebStream() };
    },

    async delete(id: string): Promise<void> {
      const row = await getPrisma().storedFile.findUnique({
        where: { id },
        select: { objectKey: true },
      });

      if (!row) return;

      if (row.objectKey) {
        await client.send(new DeleteObjectCommand({ Bucket: bucketForKey(row.objectKey), Key: row.objectKey }));
      }

      await getPrisma().storedFile.delete({ where: { id } });
    },

    async getUrls(ids: string[]): Promise<Map<string, string>> {
      const wanted = [...new Set(ids)];
      if (wanted.length === 0) return new Map();

      const rows = await getPrisma().storedFile.findMany({
        where: { id: { in: wanted }, provider: "R2", objectKey: { not: null } },
        select: { id: true, objectKey: true },
      });

      // Read on every call instead of caching at startup so tests and local
      // runs can toggle the variable freely. Only non-receipt objects may use
      // the public endpoint; receipts stay behind a signature on their own
      // (private) bucket.
      const publicBase = process.env.R2_PUBLIC_URL?.replace(/\/+$/, "");
      const entries = await Promise.all(
        rows.map(async (row) => {
          const objectKey = row.objectKey as string;
          const target = bucketForKey(objectKey);
          if (publicBase && !objectKey.startsWith("receipts/")) return [row.id, `${publicBase}/${objectKey}`] as const;
          return [row.id, await presignGetUrl(target, objectKey)] as const;
        }),
      );

      return new Map(entries);
    },
  };
}
