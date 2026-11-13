import * as repository from "@/features/users/server/repository";
import { deleteCoachPhoto, readCoachPhoto, uploadCoachPhoto } from "@/features/users/server/service";
import { AppError, readFormData, route } from "@/lib/api";
import { RECEIPT_MAX_BYTES, storage } from "@/lib/storage";

const FORM_MAX_BYTES = RECEIPT_MAX_BYTES + 128 * 1024;

export const runtime = "nodejs";

export const GET = route({ roles: ["COACH"] }, async ({ user }) => {
  const photo = await readCoachPhoto(repository, storage, user, user.id);

  return new Response(photo.stream, {
    headers: {
      "content-type": photo.mime,
      "content-disposition": "inline",
      "cache-control": "private, no-cache",
      "content-length": String(photo.size),
      "x-content-type-options": "nosniff",
    },
  });
});

export const PUT = route({ roles: ["COACH"] }, async ({ request, user }) => {
  const form = await readFormData(request, { maxBytes: FORM_MAX_BYTES });
  const file = form.get("file");

  if (!(file instanceof File)) {
    throw new AppError(400, "VALIDATION_ERROR", "عکس پروفایل را بارگذاری کنید");
  }

  return uploadCoachPhoto(repository, storage, user, file);
});

export const DELETE = route({ roles: ["COACH"] }, async ({ user }) => {
  return deleteCoachPhoto(repository, storage, user);
});
