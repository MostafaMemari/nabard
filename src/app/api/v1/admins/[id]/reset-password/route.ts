import { resetAdminPasswordSchema } from "@/features/admins/schemas";
import * as repository from "@/features/admins/server/repository";
import { resetAdminPassword } from "@/features/admins/server/service";
import { auditRepository } from "@/features/audit";
import { route } from "@/lib/api";

export const POST = route({ roles: ["SUPER_ADMIN"], body: resetAdminPasswordSchema }, async ({ user, body, params }) => {
  const { id } = await params;
  return resetAdminPassword(repository, auditRepository, user, id, body);
});
