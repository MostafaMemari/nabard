import { randomUUID } from "node:crypto";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { R2Env } from "@/lib/env";
import { getPrisma } from "@/lib/prisma";
import type { Storage, StoredFileContent, StoredFileInfo, StoredFileInput } from "./types";

const fileInfoSelection = { id: true, mime: true, size: true } as const;

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

  return {
    async put(input: StoredFileInput): Promise<StoredFileInfo> {
      const objectKey = `${input.folder}/${randomUUID()}`;

      await client.send(new PutObjectCommand({ Bucket: bucket, Key: objectKey, Body: input.data, ContentType: input.mime }));

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
  };
}
