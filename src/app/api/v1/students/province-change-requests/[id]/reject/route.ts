import { auditRepository } from "@/features/audit";
import { rejectProvinceChangeSchema } from "@/features/province-changes/schemas";
import * as repository from "@/features/province-changes/server/repository";
import { rejectProvinceChangeRequest } from "@/features/province-changes/server/service";
import { route } from "@/lib/api";

export const POST = route({ roles: ["ADMIN"], body: rejectProvinceChangeSchema }, async ({ user, body, params }) => {
  const { id } = await params;
  return rejectProvinceChangeRequest(repository, auditRepository, user, id, body);
});
