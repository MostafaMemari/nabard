import { auditRepository } from "@/features/audit";
import { reassignStudentsSchema } from "@/features/transfers/schemas";
import * as repository from "@/features/transfers/server/repository";
import { reassignCoachStudents } from "@/features/transfers/server/service";
import { route } from "@/lib/api";

export const POST = route({ roles: ["ADMIN"], body: reassignStudentsSchema }, async ({ user, params, body }) => {
  const { id } = await params;
  return reassignCoachStudents(repository, auditRepository, user, id, body);
});
