import { auditRepository } from "@/features/audit";
import * as repository from "@/features/students/server/repository";
import { approveRegistrationRequest } from "@/features/students/server/service";
import { route } from "@/lib/api";

export const POST = route({ roles: ["ADMIN"] }, async ({ user, params }) => {
  const { id } = await params;
  return approveRegistrationRequest(repository, auditRepository, user, id);
});
