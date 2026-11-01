import { auditRepository } from "@/features/audit";
import { ageCategoryDatesSchema } from "@/features/base-data/schemas";
import * as repository from "@/features/base-data/server/admin-repository";
import { getAgeCategory, updateAgeCategoryDates } from "@/features/base-data/server/admin-service";
import { route } from "@/lib/api";

export const GET = route({ roles: ["SUPER_ADMIN"] }, async ({ user, params }) => {
  const { id } = await params;
  return getAgeCategory(repository, user, id);
});

export const PATCH = route({ roles: ["SUPER_ADMIN"], body: ageCategoryDatesSchema }, async ({ user, body, params }) => {
  const { id } = await params;
  return updateAgeCategoryDates(repository, auditRepository, user, id, body);
});
