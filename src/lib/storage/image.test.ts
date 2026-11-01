import { describe, expect, it } from "vitest";
import { AppError } from "@/lib/api";
import { RECEIPT_MAX_BYTES, readReceiptImage, sniffImageMime } from "./image";

const PNG_BYTES = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52]);
const JPEG_BYTES = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
const WEBP_BYTES = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50]);
const TEXT_BYTES = new Uint8Array([0x7b, 0x22, 0x6e, 0x61, 0x6d, 0x65, 0x22, 0x3a, 0x31, 0x7d, 0x0a, 0x0d]);
const RIFF_NON_WEBP = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x41, 0x56, 0x45]);

function fileOf(bytes: Uint8Array<ArrayBuffer>, name: string, type: string): File {
  return new File([bytes], name, { type });
}

describe("sniffImageMime", () => {
  it("detects png, jpeg and webp signatures", () => {
    expect(sniffImageMime(PNG_BYTES)).toBe("image/png");
    expect(sniffImageMime(JPEG_BYTES)).toBe("image/jpeg");
    expect(sniffImageMime(WEBP_BYTES)).toBe("image/webp");
  });

  it("returns null for text and riff files that are not webp", () => {
    expect(sniffImageMime(TEXT_BYTES)).toBeNull();
    expect(sniffImageMime(RIFF_NON_WEBP)).toBeNull();
    expect(sniffImageMime(new Uint8Array([0x00, 0x01]))).toBeNull();
  });
});

describe("readReceiptImage", () => {
  it("accepts a png file declared with a wrong type and reports the real mime", async () => {
    const result = await readReceiptImage(fileOf(PNG_BYTES, "receipt.jpg", "image/jpeg"));

    expect(result.mime).toBe("image/png");
    expect(result.data).toEqual(PNG_BYTES);
  });

  it("accepts jpeg and webp files", async () => {
    expect((await readReceiptImage(fileOf(JPEG_BYTES, "a.jpg", "image/jpeg"))).mime).toBe("image/jpeg");
    expect((await readReceiptImage(fileOf(WEBP_BYTES, "a.webp", "image/webp"))).mime).toBe("image/webp");
  });

  it("rejects a file whose signature is not an accepted image", async () => {
    const failure = await readReceiptImage(fileOf(TEXT_BYTES, "receipt.png", "image/png")).catch((error: unknown) => error);

    expect(failure).toBeInstanceOf(AppError);
    expect(failure).toMatchObject({ status: 400, code: "INVALID_FILE_TYPE" });
  });

  it("rejects files over 2MB", async () => {
    const oversized = new Uint8Array(RECEIPT_MAX_BYTES + 1);
    oversized.set(PNG_BYTES);
    const failure = await readReceiptImage(fileOf(oversized, "receipt.png", "image/png")).catch((error: unknown) => error);

    expect(failure).toMatchObject({ status: 400, code: "FILE_TOO_LARGE" });
  });

  it("rejects an empty file", async () => {
    const failure = await readReceiptImage(fileOf(new Uint8Array(), "receipt.png", "image/png")).catch((error: unknown) => error);

    expect(failure).toMatchObject({ status: 400, code: "INVALID_FILE" });
  });
});
