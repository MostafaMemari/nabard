import * as repository from "@/features/payments/server/repository";
import { readReceipt, uploadReceipt } from "@/features/payments/server/service";
import { AppError, readFormData, route } from "@/lib/api";
import { postgresStorage } from "@/lib/storage";

export const GET = route({ roles: ["ADMIN", "COACH"] }, async ({ user, params }) => {
  const { id } = await params;
  const receipt = await readReceipt(repository, postgresStorage, user, id);

  return new Response(new Blob([receipt.data as BlobPart], { type: receipt.mime }), {
    headers: {
      "content-type": receipt.mime,
      "cache-control": "private, no-cache",
      "content-length": String(receipt.data.byteLength),
    },
  });
});

export const PUT = route({ roles: ["COACH"] }, async ({ request, user, params }) => {
  const { id } = await params;
  const form = await readFormData(request);
  const receiptFile = form.get("receipt");

  if (!(receiptFile instanceof File)) {
    throw new AppError(400, "VALIDATION_ERROR", "تصویر رسید را بارگذاری کنید.");
  }

  return uploadReceipt(repository, postgresStorage, user, id, receiptFile);
});
