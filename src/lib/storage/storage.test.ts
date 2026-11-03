import { beforeEach, describe, expect, it, vi } from "vitest";

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
    reset() {
      rows.clear();
      counter = 0;
      r2.put.mockClear();
      r2.get.mockClear();
      r2.delete.mockClear();
    },
    nextId: () => {
      counter += 1;
      return `row-${counter}`;
    },
    addRow(row: FakeRow) {
      rows.set(row.id, row);
    },
  };
});

const r2 = vi.hoisted(() => ({
  put: vi.fn(),
  get: vi.fn(),
  delete: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  getPrisma: () => ({
    storedFile: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
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

vi.mock("./r2", () => ({
  createR2Storage: () => r2,
  createR2Client: vi.fn(),
}));

import { createStorage } from "./index";

const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xdb]);

function setR2Env(enabled: boolean) {
  const keys = ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET_NAME"];
  for (const key of keys) {
    if (enabled) process.env[key] = "test-value";
    else delete process.env[key];
  }
}

function dbRow(overrides: Partial<FakeRow> = {}): FakeRow {
  return { id: "db-1", mime: "image/png", size: bytes.byteLength, provider: "DB", objectKey: null, data: bytes, ...overrides };
}

describe("storage facade", () => {
  beforeEach(() => state.reset());

  it("puts into postgres when the R2 variables are missing", async () => {
    setR2Env(false);
    const storage = createStorage();
    const info = await storage.put({ data: bytes, mime: "image/png", folder: "receipts" });

    expect(r2.put).not.toHaveBeenCalled();
    const row = state.rows.get(info.id);
    expect(row).toMatchObject({ provider: "DB", data: bytes, size: bytes.byteLength });
  });

  it("puts into R2 when all four variables are set", async () => {
    setR2Env(true);
    r2.put.mockResolvedValue({ id: "r2-row", mime: "image/png", size: bytes.byteLength });
    const storage = createStorage();
    const info = await storage.put({ data: bytes, mime: "image/png", folder: "coach-photos" });

    expect(r2.put).toHaveBeenCalledWith({ data: bytes, mime: "image/png", folder: "coach-photos" });
    expect(info).toEqual({ id: "r2-row", mime: "image/png", size: bytes.byteLength });
    expect(state.rows.size).toBe(0);
  });

  it("dispatches reads on the row provider, so old database rows stay readable", async () => {
    setR2Env(true);
    state.addRow(dbRow());
    r2.get.mockResolvedValue({ mime: "image/png", size: 1, stream: new Blob([bytes]).stream() });

    const storage = createStorage();

    const fromDb = await storage.get("db-1");
    expect(fromDb).toMatchObject({ mime: "image/png", size: bytes.byteLength });
    expect(r2.get).not.toHaveBeenCalled();

    state.addRow({ id: "r2-1", mime: "image/png", size: bytes.byteLength, provider: "R2", objectKey: "receipts/x", data: null });
    await storage.get("r2-1");
    expect(r2.get).toHaveBeenCalledWith("r2-1");
  });

  it("answers null without touching a backend when the row is missing", async () => {
    setR2Env(true);
    const storage = createStorage();

    expect(await storage.get("missing")).toBeNull();
    expect(r2.get).not.toHaveBeenCalled();
  });

  it("dispatches deletes on the provider", async () => {
    setR2Env(true);
    state.addRow(dbRow());
    state.addRow({ id: "r2-1", mime: "image/png", size: 1, provider: "R2", objectKey: "receipts/x", data: null });
    r2.delete.mockResolvedValue(undefined);

    const storage = createStorage();
    await storage.delete("db-1");
    await storage.delete("r2-1");
    await storage.delete("missing");

    expect(state.rows.has("db-1")).toBe(false);
    expect(r2.delete).toHaveBeenCalledTimes(1);
    expect(r2.delete).toHaveBeenCalledWith("r2-1");
  });

  it("refuses to serve an R2 row when the R2 variables are gone", async () => {
    setR2Env(false);
    state.addRow({ id: "r2-1", mime: "image/png", size: 1, provider: "R2", objectKey: "receipts/x", data: null });

    const storage = createStorage();
    await expect(storage.get("r2-1")).rejects.toMatchObject({ status: 500, code: "STORAGE_UNAVAILABLE" });
  });
});
