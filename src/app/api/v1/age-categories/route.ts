import { auditRepository } from "@/features/audit";
import { ageCategoryCreateSchema } from "@/features/base-data/schemas";
import * as repository from "@/features/base-data/server/admin-repository";
import { createAgeCategory, listAgeCategories } from "@/features/base-data/server/admin-service";
import { route } from "@/lib/api";

export const GET = route({}, async ({ user, request }) => {
  const includeArchived = new URL(request.url).searchParams.get("archived") === "true";
  return listAgeCategories(repository, user, includeArchived);
});

export const POST = route({ roles: ["SUPER_ADMIN"], body: ageCategoryCreateSchema }, async ({ user, body }) => {
  return createAgeCategory(repository, auditRepository, user, body);
});
