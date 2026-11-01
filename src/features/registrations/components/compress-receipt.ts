"use client";

const TARGET_BYTES = 1024 * 1024;
const MAX_EDGE = 1600;
const QUALITY_STEPS = [0.85, 0.7, 0.55, 0.4];

export const ACCEPTED_RECEIPT_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function toFile(blob: Blob): File {
  return new File([blob], "receipt.jpg", { type: "image/jpeg" });
}

function toJpegBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob === null ? reject(new Error("فشرده سازی تصویر ممکن نشد.")) : resolve(blob)), "image/jpeg", quality);
  });
}

export async function compressReceiptImage(file: File): Promise<File> {
  if (ACCEPTED_RECEIPT_TYPES.has(file.type) && file.size <= TARGET_BYTES) {
    return file;
  }

  const bitmap = await createImageBitmap(file).catch(() => null);
  if (bitmap === null) {
    throw new Error("تصویر قابل خواندن نیست؛ تصویر دیگری انتخاب کنید.");
  }

  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));

  const context = canvas.getContext("2d");
  if (context === null) {
    bitmap.close();
    throw new Error("فشرده سازی تصویر ممکن نشد.");
  }

  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  let blob = await toJpegBlob(canvas, QUALITY_STEPS[0]);
  for (const quality of QUALITY_STEPS.slice(1)) {
    if (blob.size <= TARGET_BYTES) break;
    blob = await toJpegBlob(canvas, quality);
  }

  return toFile(blob);
}
