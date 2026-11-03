import { getPrisma } from "@/lib/prisma";
import type { Storage, StoredFileContent, StoredFileInfo, StoredFileInput } from "./types";

const fileInfoSelection = { id: true, mime: true, size: true } as const;

function bytesToStream(data: Uint8Array): ReadableStream<Uint8Array> {
  return new Blob([data as BlobPart]).stream() as ReadableStream<Uint8Array>;
}

export const postgresStorage: Storage = {
  async put(input: StoredFileInput): Promise<StoredFileInfo> {
    return getPrisma().storedFile.create({
      data: { mime: input.mime, size: input.data.byteLength, data: input.data, provider: "DB" },
      select: fileInfoSelection,
    });
  },

  async get(id: string): Promise<StoredFileContent | null> {
    const row = await getPrisma().storedFile.findUnique({
      where: { id },
      select: { ...fileInfoSelection, data: true },
    });

    if (!row?.data) return null;

    return { mime: row.mime, size: row.size, stream: bytesToStream(row.data) };
  },

  async delete(id: string): Promise<void> {
    await getPrisma().storedFile.delete({ where: { id } });
  },

  async getUrls(_ids: string[]): Promise<Map<string, string>> {
    // Bytes live in this database, so there is no direct URL to hand out;
    // callers fall back to the authenticated streaming route.
    return new Map();
  },
};
