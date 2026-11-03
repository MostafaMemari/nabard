export type StorageFolder = "receipts" | "student-photos" | "student-documents" | "coach-photos";

export type StoredImage = {
  data: Uint8Array<ArrayBuffer>;
  mime: string;
};

export type StoredFileInput = StoredImage & {
  folder: StorageFolder;
};

export type StoredFileInfo = {
  id: string;
  mime: string;
  size: number;
};

export type StoredFileContent = {
  mime: string;
  size: number;
  stream: ReadableStream<Uint8Array>;
};

export type Storage = {
  put(input: StoredFileInput): Promise<StoredFileInfo>;
  get(id: string): Promise<StoredFileContent | null>;
  delete(id: string): Promise<void>;
  // Direct URLs that the browser can fetch without going through this
  // backend. R2 files resolve to presigned object URLs; files still stored
  // in Postgres have none and stay absent from the returned map.
  getUrls(ids: string[]): Promise<Map<string, string>>;
};
