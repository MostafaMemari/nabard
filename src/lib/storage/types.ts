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
  // Direct urls that the browser can fetch without going through this
  // backend, for files meant to be public (profile photos). Receipts are
  // session-gated and stay out of this map's public form: their keys resolve
  // to signed urls on the private receipts bucket only.
  getUrls(ids: string[]): Promise<Map<string, string>>;
};
