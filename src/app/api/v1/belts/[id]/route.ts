import { auditRepository } from "@/features/audit";
import { beltUpdateSchema } from "@/features/base-data/schemas";
import * as repository from "@/features/base-data/server/admin-repository";
import { deleteBelt, updateBelt } from "@/features/base-data/server/admin-service";
import { route } from "@/lib/api";

export const PATCH = route({ roles: ["SUPER_ADMIN"], body: beltUpdateSchema }, async ({ user, body, params }) => {
  const { id } = await params;
  return updateBelt(repository, auditRepository, user, id, body);
});

export const DELETE = route({ roles: ["SUPER_ADMIN"] }, async ({ user, params }) => {
  const { id } = await params;
  await deleteBelt(repository, auditRepository, user, id);
  return { data: null };
});
