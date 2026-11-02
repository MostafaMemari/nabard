import { auditRepository } from "@/features/audit";
import { ageCategoryUpdateSchema } from "@/features/base-data/schemas";
import * as repository from "@/features/base-data/server/admin-repository";
import { deleteAgeCategory, updateAgeCategory } from "@/features/base-data/server/admin-service";
import { route } from "@/lib/api";

export const PATCH = route({ roles: ["SUPER_ADMIN"], body: ageCategoryUpdateSchema }, async ({ user, body, params }) => {
  const { id } = await params;
  return updateAgeCategory(repository, auditRepository, user, id, body);
});

export const DELETE = route({ roles: ["SUPER_ADMIN"] }, async ({ user, params }) => {
  const { id } = await params;
  await deleteAgeCategory(repository, auditRepository, user, id);
  return { data: null };
});
