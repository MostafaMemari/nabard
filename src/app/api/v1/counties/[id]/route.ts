import { auditRepository } from "@/features/audit";
import { updateCountySchema } from "@/features/counties/schemas";
import * as repository from "@/features/counties/server/repository";
import { deleteCounty, updateCounty } from "@/features/counties/server/service";
import { route } from "@/lib/api";

export const PATCH = route({ roles: ["ADMIN"], body: updateCountySchema }, async ({ user, body, params }) => {
  const { id } = await params;
  return updateCounty(repository, auditRepository, user, id, body);
});

export const DELETE = route({ roles: ["ADMIN"] }, async ({ user, params }) => {
  const { id } = await params;
  return deleteCounty(repository, auditRepository, user, id);
});
