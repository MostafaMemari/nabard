import * as repository from "@/features/students/server/repository";
import { deleteStudentDocument, readStudentDocument, uploadStudentDocument } from "@/features/students/server/service";
import { AppError, readFormData, route } from "@/lib/api";
import { postgresStorage, RECEIPT_MAX_BYTES } from "@/lib/storage";

const FORM_MAX_BYTES = RECEIPT_MAX_BYTES + 128 * 1024;

export const GET = route({ roles: ["ADMIN", "COACH"] }, async ({ user, params }) => {
  const { id, type } = await params;
  const document = await readStudentDocument(repository, postgresStorage, user, id, type);

  return new Response(new Blob([document.data as BlobPart], { type: document.mime }), {
    headers: {
      "content-type": document.mime,
      "content-disposition": "inline",
      "cache-control": "private, no-cache",
      "content-length": String(document.data.byteLength),
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

  return uploadStudentDocument(repository, postgresStorage, user, id, type, file);
});

export const DELETE = route({ roles: ["COACH"] }, async ({ user, params }) => {
  const { id, type } = await params;
  return deleteStudentDocument(repository, user, id, type);
});
