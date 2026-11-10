import { auditRepository } from "@/features/audit";
import * as repository from "@/features/photo-changes/server/repository";
import { approvePhotoChangeRequest } from "@/features/photo-changes/server/service";
import { route } from "@/lib/api";
import { storage } from "@/lib/storage";

export const POST = route({ roles: ["ADMIN"] }, async ({ user, params }) => {
  const { id } = await params;
  return approvePhotoChangeRequest(repository, storage, auditRepository, user, id);
});
