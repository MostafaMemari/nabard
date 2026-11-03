import * as repository from "@/features/students/server/repository";
import { deleteStudentDocument, readStudentDocument, uploadStudentDocument } from "@/features/students/server/service";
import { AppError, readFormData, route } from "@/lib/api";
import { RECEIPT_MAX_BYTES, storage } from "@/lib/storage";

const FORM_MAX_BYTES = RECEIPT_MAX_BYTES + 128 * 1024;

export const runtime = "nodejs";

export const GET = route({ roles: ["ADMIN", "COACH"] }, async ({ user, params }) => {
  const { id, type } = await params;
  const document = await readStudentDocument(repository, storage, user, id, type);

  return new Response(document.stream, {
    headers: {
      "content-type": document.mime,
      "content-disposition": "inline",
      "cache-control": "private, no-cache",
      "content-length": String(document.size),
      "x-content-type-options": "nosniff",
    },
  });
});

export const PUT = route({ roles: ["COACH"] }, async ({ request, user, params }) => {
  const { id, type } = await params;
  const form = await readFormData(request, { maxBytes: FORM_MAX_BYTES });
  const file = form.get("file");

  if (!(file instanceof File)) {
    throw new AppError(400, "VALIDATION_ERROR", "تصویر مدرک را بارگذاری کنید.");
  }

  return uploadStudentDocument(repository, storage, user, id, type, file);
});

export const DELETE = route({ roles: ["COACH"] }, async ({ user, params }) => {
  const { id, type } = await params;
  return deleteStudentDocument(repository, storage, user, id, type);
});
