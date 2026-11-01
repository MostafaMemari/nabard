export type StoredFileInput = {
  data: Uint8Array<ArrayBuffer>;
  mime: string;
};

export type StoredFileInfo = {
  id: string;
  mime: string;
  size: number;
};

export type StoredFileContent = StoredFileInfo & {
  data: Uint8Array;
};

export type Storage = {
  put(input: StoredFileInput): Promise<StoredFileInfo>;
  get(id: string): Promise<StoredFileContent | null>;
};
