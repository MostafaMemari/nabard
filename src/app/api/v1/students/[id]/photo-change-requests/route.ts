import { auditRepository } from "@/features/audit";
import * as repository from "@/features/photo-changes/server/repository";
import { createPhotoChangeRequest } from "@/features/photo-changes/server/service";
import { AppError, readFormData, route } from "@/lib/api";
import { RECEIPT_MAX_BYTES, storage } from "@/lib/storage";

const FORM_MAX_BYTES = RECEIPT_MAX_BYTES + 128 * 1024;

export const runtime = "nodejs";

// The uploaded photo is attached to the request only; the profile photo of
// the student is replaced when a province admin approves the request.
export const POST = route({ roles: ["COACH"] }, async ({ request, user, params }) => {
  const { id } = await params;
  const form = await readFormData(request, { maxBytes: FORM_MAX_BYTES });
  const file = form.get("file");

  if (!(file instanceof File)) {
    throw new AppError(400, "VALIDATION_ERROR", "تصویر جدید را بارگذاری کنید.");
  }

  return createPhotoChangeRequest(repository, storage, auditRepository, user, id, file);
});
