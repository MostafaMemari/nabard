import { AppError } from "@/lib/api/app-error";
import { getR2Env } from "@/lib/env";
import { getPrisma } from "@/lib/prisma";
import { postgresStorage } from "./postgres";
import { createR2Storage } from "./r2";
import type { Storage } from "./types";

export { RECEIPT_MAX_BYTES, readProfileImage, readReceiptImage, sniffImageMime } from "./image";
export { postgresStorage } from "./postgres";
export { createR2Client, createR2Storage } from "./r2";
export type { Storage, StorageFolder, StoredFileContent, StoredFileInfo, StoredFileInput, StoredImage } from "./types";

export function createStorage(): Storage {
  let r2: Storage | null | undefined;

  const resolveR2 = (): Storage | null => {
    r2 ??= (() => {
      const env = getR2Env();
      return env ? createR2Storage(env) : null;
    })();

    return r2;
  };

  const requireR2 = (): Storage => {
    const resolved = resolveR2();
    if (!resolved) throw new AppError(500, "STORAGE_UNAVAILABLE", "سرویس فایل در دسترس نیست.");

    return resolved;
  };

  async function providerOf(id: string): Promise<"DB" | "R2" | null> {
    const row = await getPrisma().storedFile.findUnique({ where: { id }, select: { provider: true } });
    return row?.provider ?? null;
  }

  return {
    put(input) {
      return (resolveR2() ?? postgresStorage).put(input);
    },

    async get(id) {
      const provider = await providerOf(id);
      if (provider === "R2") return requireR2().get(id);
      if (provider === "DB") return postgresStorage.get(id);

      return null;
    },

    async delete(id) {
      const provider = await providerOf(id);
      if (provider === "R2") return requireR2().delete(id);
      if (provider === "DB") return postgresStorage.delete(id);
    },
  };
}

export const storage: Storage = createStorage();

export async function deleteStorageFileQuietly(target: Storage, id: string): Promise<void> {
  try {
    await target.delete(id);
  } catch (error) {
    console.error("stored file cleanup failed:", error instanceof Error ? error.message : error);
  }
}
