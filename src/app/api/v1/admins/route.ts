import { adminListQuerySchema, createAdminSchema } from "@/features/admins/schemas";
import * as repository from "@/features/admins/server/repository";
import { createAdmin, listAdmins } from "@/features/admins/server/service";
import { auditRepository } from "@/features/audit";
import { route } from "@/lib/api";

export const GET = route({ roles: ["SUPER_ADMIN"] }, async ({ request, user }) => {
  const query = adminListQuerySchema.parse(Object.fromEntries(new URL(request.url).searchParams));
  return listAdmins(repository, user, query);
});

export const POST = route({ roles: ["SUPER_ADMIN"], body: createAdminSchema }, async ({ user, body }) =>
  createAdmin(repository, auditRepository, user, body),
);
