"use client";

// Profile photos are only ever shown as round avatars (28-96 px, so 512 px
// keeps them crisp on retina screens) and web guidance puts small images
// under 100 KB. Resize, then encode to WebP with a JPEG fallback for
// browsers that cannot encode WebP.

const TARGET_BYTES = 100 * 1024;
const MAX_EDGE = 512;
const QUALITY_STEPS = [0.85, 0.75, 0.65, 0.55];

export const ACCEPTED_PROFILE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function extensionOf(mime: string): string {
  return mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg";
}

function toBlob(canvas: HTMLCanvasElement, mime: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), mime, quality);
  });
}

export async function compressProfileImage(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (bitmap === null) {
    throw new Error("تصویر قابل خواندن نیست؛ تصویر دیگری انتخاب کنید.");
  }

  const needsResize = bitmap.width > MAX_EDGE || bitmap.height > MAX_EDGE;
  if (!needsResize && ACCEPTED_PROFILE_TYPES.has(file.type) && file.size <= TARGET_BYTES) {
    bitmap.close();
    return file;
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

  let blob: Blob | null = null;
  for (const quality of QUALITY_STEPS) {
    blob = await toBlob(canvas, "image/webp", quality);
    if (blob !== null && blob.type === "image/webp" && blob.size <= TARGET_BYTES) {
      return new File([blob], `photo.webp`, { type: "image/webp" });
    }
  }

  for (const quality of QUALITY_STEPS) {
    blob = await toBlob(canvas, "image/jpeg", quality);
    if (blob !== null && blob.size <= TARGET_BYTES) {
      return new File([blob], `photo.jpg`, { type: "image/jpeg" });
    }
  }

  if (blob === null) {
    throw new Error("فشرده سازی تصویر ممکن نشد.");
  }

  return new File([blob], `photo.${extensionOf(blob.type)}`, { type: blob.type });
}
