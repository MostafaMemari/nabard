import { createHash } from "node:crypto";
import type { StorageFolder } from "../src/lib/storage/types";

export type MigrationRow = {
  id: string;
  mime: string;
  size: number;
  data: Uint8Array | null;
  folder: StorageFolder | null;
};

export type MigrationCounts = {
  scanned: number;
  migrated: number;
  skippedOrphan: number;
  failed: number;
};

export type StorageMigrationDeps = {
  findNextBatch(afterId: string | null, take: number): Promise<MigrationRow[]>;
  putObject(input: { mime: string; folder: StorageFolder; data: Uint8Array }): Promise<{ objectKey: string }>;
  fetchObject(objectKey: string): Promise<{ size: number; data: Uint8Array }>;
  markMigrated(id: string, objectKey: string): Promise<boolean>;
  deleteObject(objectKey: string): Promise<void>;
};

function sha256(data: Uint8Array): string {
  return createHash("sha256").update(data).digest("hex");
}

// Copies provider=db rows into R2 one batch at a time: upload, verify size and
// checksum of the copy, then flip the row to provider=r2 with a null data. The
// row is only rewritten after the copy is verified, so a run can be stopped
// and resumed at any point without losing database data.
export async function migrateStoredFilesToR2(deps: StorageMigrationDeps, take = 50): Promise<MigrationCounts> {
  const counts: MigrationCounts = { scanned: 0, migrated: 0, skippedOrphan: 0, failed: 0 };
  let afterId: string | null = null;

  for (;;) {
    const rows = await deps.findNextBatch(afterId, take);
    if (rows.length === 0) break;

    for (const row of rows) {
      counts.scanned += 1;
      afterId = row.id;

      if (row.folder === null || row.data === null) {
        counts.skippedOrphan += 1;
        continue;
      }

      let objectKey: string | null = null;
      try {
        objectKey = (await deps.putObject({ mime: row.mime, folder: row.folder, data: row.data })).objectKey;

        const copy = await deps.fetchObject(objectKey);
        if (copy.size !== row.size || sha256(copy.data) !== sha256(row.data)) {
          throw new Error("copy verification failed");
        }

        const applied = await deps.markMigrated(row.id, objectKey);
        if (!applied) {
          counts.failed += 1;
          await deps.deleteObject(objectKey);
          continue;
        }

        counts.migrated += 1;
      } catch {
        counts.failed += 1;
        if (objectKey !== null) {
          await deps.deleteObject(objectKey).catch(() => {});
        }
      }
    }
  }

  return counts;
}
