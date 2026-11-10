import { auditRepository } from "@/features/audit";
import { rejectPhotoChangeSchema } from "@/features/photo-changes/schemas";
import * as repository from "@/features/photo-changes/server/repository";
import { rejectPhotoChangeRequest } from "@/features/photo-changes/server/service";
import { route } from "@/lib/api";
import { storage } from "@/lib/storage";

export const POST = route({ roles: ["ADMIN"], body: rejectPhotoChangeSchema }, async ({ user, body, params }) => {
  const { id } = await params;
  return rejectPhotoChangeRequest(repository, storage, auditRepository, user, id, body);
});
