import { auditRepository } from "@/features/audit";
import { createCoachChangeSchema } from "@/features/transfers/schemas";
import * as repository from "@/features/transfers/server/repository";
import { createCoachChangeRequest } from "@/features/transfers/server/service";
import { route } from "@/lib/api";

// The student's current coach asks to move the student to a coach of the
// same province; the province admin decides.
export const POST = route({ roles: ["COACH"], body: createCoachChangeSchema }, async ({ user, body, params }) => {
  const { id } = await params;
  return createCoachChangeRequest(repository, auditRepository, user, id, body);
});
