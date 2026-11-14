import * as repository from "@/features/students/server/repository";
import { setRegistrationRequestPhoto } from "@/features/students/server/service";
import { AppError, readFormData, route } from "@/lib/api";
import { RECEIPT_MAX_BYTES, storage } from "@/lib/storage";

const FORM_MAX_BYTES = RECEIPT_MAX_BYTES + 128 * 1024;

export const runtime = "nodejs";

// The personal photo is attached to the registration request only; it becomes
// the student's PHOTO document when a province admin approves the request.
export const POST = route({ roles: ["COACH"] }, async ({ request, user, params }) => {
  const { id } = await params;
  const form = await readFormData(request, { maxBytes: FORM_MAX_BYTES });
  const file = form.get("file");

  if (!(file instanceof File)) {
    throw new AppError(400, "VALIDATION_ERROR", "عکس پرسنلی را بارگذاری کنید");
  }

  return setRegistrationRequestPhoto(repository, storage, user, id, file);
});
