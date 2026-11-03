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
  objects = new Map<string, Uint8Array>();
  contentTypes = new Map<string, string>();

  async send(command: unknown): Promise<unknown> {
    if (command instanceof PutObjectCommand) {
      const key = command.input.Key as string;
      this.objects.set(key, new Uint8Array(command.input.Body as Uint8Array));
      if (command.input.ContentType) this.contentTypes.set(key, command.input.ContentType);
      return {};
    }

    if (command instanceof GetObjectCommand) {
      const key = command.input.Key as string;
      const data = this.objects.get(key);
      if (!data) throw new Error("NoSuchKey");

      return {
        Body: {
          transformToWebStream: () => new Blob([data as BlobPart]).stream(),
          transformToByteArray: async () => data,
        },
      };
    }

    if (command instanceof DeleteObjectCommand) {
      this.objects.delete(command.input.Key as string);
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
    expect(objectKey).toMatch(/^student-photos\//);

    const s3 = client as unknown as FakeS3;
    expect(s3.objects.get(objectKey)).toEqual(bytes);
    expect(s3.contentTypes.get(objectKey)).toBe("image/png");

    const row = state.rows.get(info.id);
    expect(row).toMatchObject({ provider: "R2", data: null, mime: "image/png", size: bytes.byteLength });
  });

  it("removes the uploaded object when the metadata row cannot be created", async () => {
    const client = fakeClient();
    const storage = createR2Storage(env, client);
    state.failNextCreate("boom");

    await expect(storage.put({ data: bytes, mime: "image/png", folder: "receipts" })).rejects.toThrow("boom");

    expect((client as unknown as FakeS3).objects.size).toBe(0);
  });

  it("gets the object stream and mime for an r2 row", async () => {
    const client = fakeClient();
    const storage = createR2Storage(env, client);
    const info = await storage.put({ data: bytes, mime: "image/png", folder: "receipts" });

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

    expect((client as unknown as FakeS3).objects.has(objectKey)).toBe(false);
    expect(state.rows.has(info.id)).toBe(false);
  });

  it("treats deleting an unknown id as a no-op", async () => {
    const storage = createR2Storage(env, fakeClient());
    await expect(storage.delete("missing")).resolves.toBeUndefined();
  });
});
