import { describe, expect, it } from "vitest";
import type { StorageFolder } from "../src/lib/storage/types";
import { type MigrationRow, migrateStoredFilesToR2, type StorageMigrationDeps } from "./storage-migration";

type FakeDbRow = {
  id: string;
  mime: string;
  size: number;
  provider: "DB" | "R2";
  objectKey: string | null;
  data: Uint8Array | null;
};

const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xdb, 1, 2, 3]);

function makeDeps(rows: FakeDbRow[], options: { corrupt?: boolean; markApplied?: boolean } = {}) {
  const objects = new Map<string, Uint8Array>();
  let counter = 0;
  const deletedKeys: string[] = [];

  const deps: StorageMigrationDeps = {
    findNextBatch: async (afterId, take) =>
      rows
        .filter((row) => row.provider === "DB" && (afterId === null || row.id > afterId))
        .slice(0, take)
        .map(
          (row): MigrationRow => ({
            id: row.id,
            mime: row.mime,
            size: row.size,
            data: row.data,
            folder: row.data === null ? null : "receipts",
          }),
        ),
    putObject: async ({ data }) => {
      counter += 1;
      const objectKey = `receipts/upload-${counter}`;
      objects.set(objectKey, data);
      return { objectKey };
    },
    fetchObject: async (objectKey) => {
      const data = objects.get(objectKey);
      if (!data) throw new Error("NoSuchKey");
      return options.corrupt ? { size: data.byteLength + 1, data: new Uint8Array([...data, 0]) } : { size: data.byteLength, data };
    },
    markMigrated: async (id, objectKey) => {
      if (options.markApplied === false) return false;
      const row = rows.find((candidate) => candidate.id === id);
      if (!row || row.provider !== "DB") return false;
      row.provider = "R2";
      row.objectKey = objectKey;
      row.data = null;
      return true;
    },
    deleteObject: async (objectKey) => {
      deletedKeys.push(objectKey);
      objects.delete(objectKey);
    },
  };

  return { deps, objects, deletedKeys, rows };
}

describe("migrateStoredFilesToR2", () => {
  it("migrates every db row and nulls the data after verification", async () => {
    const rows: FakeDbRow[] = [
      { id: "a", mime: "image/jpeg", size: JPEG.byteLength, provider: "DB", objectKey: null, data: JPEG },
      { id: "b", mime: "image/jpeg", size: JPEG.byteLength, provider: "DB", objectKey: null, data: JPEG },
    ];
    const { deps, rows: tracked } = makeDeps(rows);
    const counts = await migrateStoredFilesToR2(deps, 1);

    expect(counts).toEqual({ scanned: 2, migrated: 2, skippedOrphan: 0, failed: 0 });
    for (const row of tracked) {
      expect(row).toMatchObject({ provider: "R2", data: null });
      expect(row.objectKey).toMatch(/^receipts\//);
    }
  });

  it("is idempotent and resumable: a second run finds nothing to do", async () => {
    const rows: FakeDbRow[] = [{ id: "a", mime: "image/jpeg", size: JPEG.byteLength, provider: "DB", objectKey: null, data: JPEG }];
    const { deps } = makeDeps(rows);

    const first = await migrateStoredFilesToR2(deps, 50);
    const second = await migrateStoredFilesToR2(deps, 50);

    expect(first.migrated).toBe(1);
    expect(second).toEqual({ scanned: 0, migrated: 0, skippedOrphan: 0, failed: 0 });
  });

  it("never rewrites the row when the copy does not verify", async () => {
    const rows: FakeDbRow[] = [{ id: "a", mime: "image/jpeg", size: JPEG.byteLength, provider: "DB", objectKey: null, data: JPEG }];
    const { deps, deletedKeys, rows: tracked } = makeDeps(rows, { corrupt: true });
    const counts = await migrateStoredFilesToR2(deps, 50);

    expect(counts).toEqual({ scanned: 1, migrated: 0, skippedOrphan: 0, failed: 1 });
    expect(tracked[0]).toMatchObject({ provider: "DB", data: JPEG, objectKey: null });
    expect(deletedKeys).toHaveLength(1);
  });

  it("cleans up the object when the row was migrated concurrently", async () => {
    const rows: FakeDbRow[] = [{ id: "a", mime: "image/jpeg", size: JPEG.byteLength, provider: "DB", objectKey: null, data: JPEG }];
    const { deps, deletedKeys, rows: tracked } = makeDeps(rows, { markApplied: false });
    const counts = await migrateStoredFilesToR2(deps, 50);

    expect(counts).toEqual({ scanned: 1, migrated: 0, skippedOrphan: 0, failed: 1 });
    expect(tracked[0]?.provider).toBe("DB");
    expect(deletedKeys).toHaveLength(1);
  });

  it("skips rows without references or bytes", async () => {
    const rows: FakeDbRow[] = [
      { id: "a", mime: "image/jpeg", size: 0, provider: "DB", objectKey: null, data: null },
      { id: "b", mime: "image/jpeg", size: JPEG.byteLength, provider: "DB", objectKey: null, data: JPEG },
    ];
    const { deps } = makeDeps(rows);
    const counts = await migrateStoredFilesToR2(deps, 50);

    expect(counts).toEqual({ scanned: 2, migrated: 1, skippedOrphan: 1, failed: 0 });
  });

  it("counts an upload failure as failed and keeps the row untouched", async () => {
    const rows: FakeDbRow[] = [{ id: "a", mime: "image/jpeg", size: JPEG.byteLength, provider: "DB", objectKey: null, data: JPEG }];
    const deps: StorageMigrationDeps = {
      findNextBatch: async (afterId) =>
        afterId === null ? [{ id: "a", mime: "image/jpeg", size: JPEG.byteLength, data: JPEG, folder: "receipts" as StorageFolder }] : [],
      putObject: async () => {
        throw new Error("upload failed");
      },
      fetchObject: async () => ({ size: 0, data: new Uint8Array() }),
      markMigrated: async () => true,
      deleteObject: async () => {},
    };
    const counts = await migrateStoredFilesToR2(deps, 50);

    expect(counts).toEqual({ scanned: 1, migrated: 0, skippedOrphan: 0, failed: 1 });
    expect(rows[0]).toMatchObject({ provider: "DB", data: JPEG });
  });
});
