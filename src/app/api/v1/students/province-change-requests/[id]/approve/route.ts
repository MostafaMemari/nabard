import { auditRepository } from "@/features/audit";
import * as repository from "@/features/province-changes/server/repository";
import { approveProvinceChangeRequest } from "@/features/province-changes/server/service";
import { route } from "@/lib/api";

export const POST = route({ roles: ["ADMIN"] }, async ({ user, params }) => {
  const { id } = await params;
  return approveProvinceChangeRequest(repository, auditRepository, user, id);
});
