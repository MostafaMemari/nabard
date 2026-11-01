import { getPrisma } from "@/lib/prisma";
import type { Storage, StoredFileContent, StoredFileInfo, StoredFileInput } from "./types";

const fileInfoSelection = { id: true, mime: true, size: true } as const;

export const postgresStorage: Storage = {
  async put(input: StoredFileInput): Promise<StoredFileInfo> {
    return getPrisma().storedFile.create({
      data: { mime: input.mime, size: input.data.byteLength, data: input.data },
      select: fileInfoSelection,
    });
  },

  async get(id: string): Promise<StoredFileContent | null> {
    const row = await getPrisma().storedFile.findUnique({
      where: { id },
      select: { ...fileInfoSelection, data: true },
    });

    return row === null ? null : { id: row.id, mime: row.mime, size: row.size, data: row.data };
  },
};
