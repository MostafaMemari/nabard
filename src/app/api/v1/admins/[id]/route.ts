import { updateAdminSchema } from "@/features/admins/schemas";
import * as repository from "@/features/admins/server/repository";
import { getAdmin, updateAdmin } from "@/features/admins/server/service";
import { auditRepository } from "@/features/audit";
import { route } from "@/lib/api";

export const GET = route({ roles: ["SUPER_ADMIN"] }, async ({ user, params }) => {
  const { id } = await params;
  return getAdmin(repository, user, id);
});

export const PATCH = route({ roles: ["SUPER_ADMIN"], body: updateAdminSchema }, async ({ user, body, params }) => {
  const { id } = await params;
  return updateAdmin(repository, auditRepository, user, id, body);
});
