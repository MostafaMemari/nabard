import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, type S3Client } from "@aws-sdk/client-s3";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { R2Env } from "@/lib/env";

type FakeRow = {
  id: string;
  mime: string;
  size: number;
  provider: string;
  objectKey: string | null;
  data: Uint8Array | null;
};

const state = vi.hoisted(() => {
  const rows = new Map<string, FakeRow>();
  let counter = 0;

  return {
    rows,
    createError: null as Error | null,
    reset() {
      rows.clear();
      counter = 0;
      state.createError = null;
    },
    nextId: () => {
      counter += 1;
      return `row-${counter}`;
    },
    failNextCreate(message: string) {
      state.createError = new Error(message);
    },
  };
});

// Signing is computed locally by the presigner; the fake client cannot
// provide a real endpoint provider, so the url is stubbed deterministically.
vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: async (_client: unknown, command: { input: { Bucket?: string; Key?: string } }, options?: { expiresIn?: number }) =>
    `https://presigned.test/${command.input.Bucket}/${command.input.Key}?expires=${options?.expiresIn ?? 0}`,
}));

vi.mock("@/lib/prisma", () => ({
  getPrisma: () => ({
    storedFile: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        if (state.createError) {
          const error = state.createError;
          state.createError = null;
          throw error;
        }

        const row: FakeRow = {
          id: state.nextId(),
          mime: String(data.mime),
          size: Number(data.size),
          provider: String(data.provider),
          objectKey: (data.objectKey as string | null) ?? null,
          data: (data.data as Uint8Array | null) ?? null,
        };
        state.rows.set(row.id, row);

        return { id: row.id, mime: row.mime, size: row.size };
      },
      findUnique: async ({ where: { id } }: { where: { id: string } }) => state.rows.get(id) ?? null,
      findMany: async ({ where: { id } }: { where: { id: { in: string[] } } }) =>
        [...state.rows.values()]
          .filter((row) => id.in.includes(row.id) && row.provider === "R2" && row.objectKey !== null)
          .map((row) => ({ id: row.id, objectKey: row.objectKey })),
      delete: async ({ where: { id } }: { where: { id: string } }) => {
        const row = state.rows.get(id);
        if (!row) throw new Error("record not found");
        state.rows.delete(id);
        return row;
      },
    },
  }),
}));

import { createR2Storage } from "./r2";

class FakeS3 {
  // Objects are keyed by "<bucket>/<key>" so tests can tell the public
  // bucket from the private receipts bucket.
  objects = new Map<string, Uint8Array>();
  contentTypes = new Map<string, string>();
  cacheControls = new Map<string, string>();

  static ref(bucket: string, key: string): string {
    return `${bucket}/${key}`;
  }

  async send(command: unknown): Promise<unknown> {
    if (command instanceof PutObjectCommand) {
      const ref = FakeS3.ref(command.input.Bucket as string, command.input.Key as string);
      this.objects.set(ref, new Uint8Array(command.input.Body as Uint8Array));
      if (command.input.ContentType) this.contentTypes.set(ref, command.input.ContentType);
      if (command.input.CacheControl) this.cacheControls.set(ref, command.input.CacheControl);
      return {};
    }

    if (command instanceof GetObjectCommand) {
      const ref = FakeS3.ref(command.input.Bucket as string, command.input.Key as string);
      const data = this.objects.get(ref);
      if (!data) throw new Error("NoSuchKey");

      return {
        Body: {
          transformToWebStream: () => new Blob([data as BlobPart]).stream(),
          transformToByteArray: async () => data,
        },
      };
    }

    if (command instanceof DeleteObjectCommand) {
      this.objects.delete(FakeS3.ref(command.input.Bucket as string, command.input.Key as string));
      return {};
    }

    throw new Error("unexpected command");
  }
}

const env: R2Env = {
  R2_ACCOUNT_ID: "account",
  R2_ACCESS_KEY_ID: "key",
  R2_SECRET_ACCESS_KEY: "secret",
  R2_BUCKET_NAME: "bucket",
};

const envWithReceipts: R2Env = { ...env, R2_RECEIPTS_BUCKET: "receipts-private" };

const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);

function fakeClient() {
  return new FakeS3() as unknown as S3Client;
}

async function readStream(stream: ReadableStream<Uint8Array>): Promise<Uint8Array> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  const total = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return merged;
}

describe("r2 storage", () => {
  beforeEach(() => state.reset());

  it("puts the object under the folder and records the metadata row", async () => {
    const client = fakeClient();
    const storage = createR2Storage(env, client);
    const info = await storage.put({ data: bytes, mime: "image/png", folder: "student-photos" });

    expect(info.id).toMatch(/^row-/);
    expect(info.mime).toBe("image/png");
    expect(info.size).toBe(bytes.byteLength);

    const objectKey = state.rows.get(info.id)?.objectKey ?? "";
    expect(objectKey).toMatch(/^student-photos\/.+\.png$/);

    const s3 = client as unknown as FakeS3;
    expect(s3.objects.get(FakeS3.ref("bucket", objectKey))).toEqual(bytes);
    expect(s3.contentTypes.get(FakeS3.ref("bucket", objectKey))).toBe("image/png");

    const row = state.rows.get(info.id);
    expect(row).toMatchObject({ provider: "R2", data: null, mime: "image/png", size: bytes.byteLength });
  });

  it("returns public urls without any signature when R2_PUBLIC_URL is set", async () => {
    process.env.R2_PUBLIC_URL = "https://pub-abc123.r2.dev/";
    try {
      const client = fakeClient();
      const storage = createR2Storage(env, client);
      const info = await storage.put({ data: bytes, mime: "image/webp", folder: "student-photos" });

      const urls = await storage.getUrls([info.id, "missing-row"]);

      const objectKey = state.rows.get(info.id)?.objectKey ?? "";
      expect(objectKey).toMatch(/^student-photos\/.+\.webp$/);
      expect(urls.get(info.id)).toBe(`https://pub-abc123.r2.dev/${objectKey}`);
      expect(urls.has("missing-row")).toBe(false);
    } finally {
      delete process.env.R2_PUBLIC_URL;
    }
  });

  it("stores receipts in the private receipts bucket with private caching", async () => {
    const client = fakeClient();
    const storage = createR2Storage(envWithReceipts, client);
    const info = await storage.put({ data: bytes, mime: "image/png", folder: "receipts" });

    const objectKey = state.rows.get(info.id)?.objectKey ?? "";
    expect(objectKey).toMatch(/^receipts\/.+\.png$/);

    const s3 = client as unknown as FakeS3;
    const ref = FakeS3.ref("receipts-private", objectKey);
    expect(s3.objects.has(ref)).toBe(true);
    expect(s3.cacheControls.get(ref)).toBe("private, max-age=31536000, immutable");
    // Nothing leaks into the public bucket.
    expect(s3.objects.has(FakeS3.ref("bucket", objectKey))).toBe(false);
  });

  it("reads and deletes receipts from the private receipts bucket", async () => {
    const client = fakeClient();
    const storage = createR2Storage(envWithReceipts, client);
    const info = await storage.put({ data: bytes, mime: "image/png", folder: "receipts" });

    const content = await storage.get(info.id);
    if (!content) throw new Error("content missing");
    expect(await readStream(content.stream)).toEqual(bytes);

    await storage.delete(info.id);
    expect((client as unknown as FakeS3).objects.size).toBe(0);
  });

  it("never hands out a public url for a receipt, even with R2_PUBLIC_URL set", async () => {
    process.env.R2_PUBLIC_URL = "https://pub-abc123.r2.dev/";
    try {
      const client = fakeClient();
      const storage = createR2Storage(envWithReceipts, client);
      const receipt = await storage.put({ data: bytes, mime: "image/png", folder: "receipts" });
      const photo = await storage.put({ data: bytes, mime: "image/png", folder: "student-photos" });

      const urls = await storage.getUrls([receipt.id, photo.id]);

      const receiptKey = state.rows.get(receipt.id)?.objectKey ?? "";
      const receiptUrl = urls.get(receipt.id) ?? "";
      expect(receiptUrl).not.toContain("pub-abc123.r2.dev");
      expect(receiptUrl).toContain("/receipts-private/");
      expect(receiptUrl).toContain(receiptKey);
      expect(urls.get(photo.id)).toBe(`https://pub-abc123.r2.dev/${state.rows.get(photo.id)?.objectKey}`);
    } finally {
      delete process.env.R2_PUBLIC_URL;
    }
  });

  it("falls back to the main bucket for receipts when no receipts bucket is set", async () => {
    const client = fakeClient();
    const storage = createR2Storage(env, client);
    const info = await storage.put({ data: bytes, mime: "image/png", folder: "receipts" });

    const objectKey = state.rows.get(info.id)?.objectKey ?? "";
    const s3 = client as unknown as FakeS3;
    expect(s3.objects.has(FakeS3.ref("bucket", objectKey))).toBe(true);

    const content = await storage.get(info.id);
    if (!content) throw new Error("content missing");
    expect(await readStream(content.stream)).toEqual(bytes);
  });

  it("removes the uploaded object when the metadata row cannot be created", async () => {
    const client = fakeClient();
    const storage = createR2Storage(envWithReceipts, client);
    state.failNextCreate("boom");

    await expect(storage.put({ data: bytes, mime: "image/png", folder: "receipts" })).rejects.toThrow("boom");

    expect((client as unknown as FakeS3).objects.size).toBe(0);
  });

  it("gets the object stream and mime for an r2 row", async () => {
    const client = fakeClient();
    const storage = createR2Storage(env, client);
    const info = await storage.put({ data: bytes, mime: "image/png", folder: "coach-photos" });

    const content = await storage.get(info.id);
    if (!content) throw new Error("content missing");
    expect(content.mime).toBe("image/png");
    expect(content.size).toBe(bytes.byteLength);
    expect(await readStream(content.stream)).toEqual(bytes);
  });

  it("answers null for an unknown id", async () => {
    const storage = createR2Storage(env, fakeClient());
    expect(await storage.get("missing")).toBeNull();
  });

  it("deletes the object and the metadata row", async () => {
    const client = fakeClient();
    const storage = createR2Storage(env, client);
    const info = await storage.put({ data: bytes, mime: "image/png", folder: "coach-photos" });
    const objectKey = state.rows.get(info.id)?.objectKey ?? "";

    await storage.delete(info.id);

    expect((client as unknown as FakeS3).objects.has(FakeS3.ref("bucket", objectKey))).toBe(false);
    expect(state.rows.has(info.id)).toBe(false);
  });

  it("treats deleting an unknown id as a no-op", async () => {
    const storage = createR2Storage(env, fakeClient());
    await expect(storage.delete("missing")).resolves.toBeUndefined();
  });
});
