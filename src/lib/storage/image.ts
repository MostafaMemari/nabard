import { AppError } from "@/lib/api/app-error";
import type { StoredFileInput } from "./types";

export const RECEIPT_MAX_BYTES = 2 * 1024 * 1024;

const SIGNATURES: Array<{ mime: string; checks: Array<{ offset: number; bytes: number[] }> }> = [
  { mime: "image/jpeg", checks: [{ offset: 0, bytes: [0xff, 0xd8, 0xff] }] },
  { mime: "image/png", checks: [{ offset: 0, bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] }] },
  {
    mime: "image/webp",
    checks: [
      { offset: 0, bytes: [0x52, 0x49, 0x46, 0x46] },
      { offset: 8, bytes: [0x57, 0x45, 0x42, 0x50] },
    ],
  },
];

export function sniffImageMime(bytes: Uint8Array): string | null {
  for (const signature of SIGNATURES) {
    const matched = signature.checks.every((check) => check.bytes.every((byte, index) => bytes[check.offset + index] === byte));

    if (matched) {
      return signature.mime;
    }
  }

  return null;
}

export async function readReceiptImage(file: File): Promise<StoredFileInput> {
  if (file.size === 0) {
    throw new AppError(400, "INVALID_FILE", "فایل رسید خالی است.");
  }

  if (file.size > RECEIPT_MAX_BYTES) {
    throw new AppError(400, "FILE_TOO_LARGE", "حجم تصویر رسید باید کمتر از ۲ مگابایت باشد.");
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const mime = sniffImageMime(bytes);

  if (mime === null) {
    throw new AppError(400, "INVALID_FILE_TYPE", "فقط تصاویر JPEG، PNG یا WebP پذیرفته می شوند.");
  }

  return { data: bytes, mime };
}
