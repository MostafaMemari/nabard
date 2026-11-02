import { auditRepository } from "@/features/audit";
import { beltCreateSchema } from "@/features/base-data/schemas";
import * as repository from "@/features/base-data/server/admin-repository";
import { createBelt, listBelts } from "@/features/base-data/server/admin-service";
import { route } from "@/lib/api";

export const GET = route({}, async ({ user, request }) => {
  const includeArchived = new URL(request.url).searchParams.get("archived") === "true";
  return listBelts(repository, user, includeArchived);
});

export const POST = route({ roles: ["SUPER_ADMIN"], body: beltCreateSchema }, async ({ user, body }) => {
  return createBelt(repository, auditRepository, user, body);
});
