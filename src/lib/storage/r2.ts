import { randomUUID } from "node:crypto";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { R2Env } from "@/lib/env";
import { getPrisma } from "@/lib/prisma";
import type { Storage, StoredFileContent, StoredFileInfo, StoredFileInput } from "./types";

const fileInfoSelection = { id: true, mime: true, size: true } as const;

// When R2_PUBLIC_URL is configured (the bucket's public r2.dev subdomain or a
// custom domain), file urls point straight at that endpoint: no signature and
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
  const presignedUrls = new Map<string, { url: string; signedAt: number }>();

  async function presignGetUrl(objectKey: string): Promise<string> {
    const cached = presignedUrls.get(objectKey);
    if (cached && Date.now() - cached.signedAt < PRESIGN_REUSE_MS) return cached.url;

    const command = new GetObjectCommand({ Bucket: bucket, Key: objectKey });
    const url = await getSignedUrl(client, command, { expiresIn: PRESIGN_VALID_SECONDS });
    presignedUrls.set(objectKey, { url, signedAt: Date.now() });

    return url;
  }

  return {
    async put(input: StoredFileInput): Promise<StoredFileInfo> {
      const objectKey = `${input.folder}/${randomUUID()}${extensionForMime(input.mime)}`;

      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: objectKey,
          Body: input.data,
          ContentType: input.mime,
          // Keys are UUIDs and never change content, so browsers can cache
          // the object for as long as they keep the URL.
          CacheControl: "public, max-age=31536000, immutable",
        }),
      );

      try {
        return await getPrisma().storedFile.create({
          data: { mime: input.mime, size: input.data.byteLength, provider: "R2", objectKey, data: null },
          select: fileInfoSelection,
        });
      } catch (error) {
        await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: objectKey })).catch(() => {});
        throw error;
      }
    },

    async get(id: string): Promise<StoredFileContent | null> {
      const row = await getPrisma().storedFile.findUnique({
        where: { id },
        select: { ...fileInfoSelection, objectKey: true },
      });

      if (!row?.objectKey) return null;

      const object = await client.send(new GetObjectCommand({ Bucket: bucket, Key: row.objectKey }));
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
        await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: row.objectKey }));
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
      // runs can toggle the variable freely.
      const publicBase = process.env.R2_PUBLIC_URL?.replace(/\/+$/, "");
      if (publicBase) {
        return new Map(rows.map((row) => [row.id, `${publicBase}/${row.objectKey as string}`]));
      }

      const entries = await Promise.all(rows.map(async (row) => [row.id, await presignGetUrl(row.objectKey as string)] as const));

      return new Map(entries);
    },
  };
}
