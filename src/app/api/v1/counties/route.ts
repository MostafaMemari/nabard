import { auditRepository } from "@/features/audit";
import { countyListQuerySchema, createCountySchema } from "@/features/counties/schemas";
import * as repository from "@/features/counties/server/repository";
import { createCounty, listCounties } from "@/features/counties/server/service";
import { route } from "@/lib/api";

export const GET = route({}, async ({ request, user }) => {
  const query = countyListQuerySchema.parse(Object.fromEntries(new URL(request.url).searchParams));
  return listCounties(repository, user, query);
});

export const POST = route({ roles: ["SUPER_ADMIN"], body: createCountySchema }, async ({ user, body }) =>
  createCounty(repository, auditRepository, user, body),
);
