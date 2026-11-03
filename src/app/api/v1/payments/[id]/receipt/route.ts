import * as repository from "@/features/payments/server/repository";
import { readReceipt, uploadReceipt } from "@/features/payments/server/service";
import { AppError, readFormData, route } from "@/lib/api";
import { RECEIPT_MAX_BYTES, storage } from "@/lib/storage";

const FORM_MAX_BYTES = RECEIPT_MAX_BYTES + 128 * 1024;

export const runtime = "nodejs";

export const GET = route({ roles: ["ADMIN", "COACH", "SUPER_ADMIN"] }, async ({ user, params }) => {
  const { id } = await params;
  const receipt = await readReceipt(repository, storage, user, id);

  return new Response(receipt.stream, {
    headers: {
      "content-type": receipt.mime,
      "content-disposition": "inline",
      "cache-control": "private, no-cache",
      "content-length": String(receipt.size),
      "x-content-type-options": "nosniff",
    },
  });
});

export const PUT = route({ roles: ["COACH"] }, async ({ request, user, params }) => {
  const { id } = await params;
  const form = await readFormData(request, { maxBytes: FORM_MAX_BYTES });
  const receiptFile = form.get("receipt");

  if (!(receiptFile instanceof File)) {
    throw new AppError(400, "VALIDATION_ERROR", "تصویر رسید را بارگذاری کنید.");
  }

  return uploadReceipt(repository, storage, user, id, receiptFile);
});
