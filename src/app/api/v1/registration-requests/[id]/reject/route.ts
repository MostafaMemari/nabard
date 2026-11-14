import { auditRepository } from "@/features/audit";
import { rejectProfileSchema } from "@/features/students/schemas";
import * as repository from "@/features/students/server/repository";
import { rejectRegistrationRequest } from "@/features/students/server/service";
import { route } from "@/lib/api";

export const POST = route({ roles: ["ADMIN"], body: rejectProfileSchema }, async ({ user, body, params }) => {
  const { id } = await params;
  return rejectRegistrationRequest(repository, auditRepository, user, id, body.note);
});
