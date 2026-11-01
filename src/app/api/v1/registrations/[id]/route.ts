import { updateRegistrationSchema } from "@/features/registrations/schemas";
import * as repository from "@/features/registrations/server/repository";
import { getRegistration, updateRegistrationStatus } from "@/features/registrations/server/service";
import { route } from "@/lib/api";

export const GET = route({ roles: ["ADMIN", "COACH"] }, async ({ user, params }) => {
  const { id } = await params;
  return getRegistration(repository, user, id);
});

export const PATCH = route({ roles: ["ADMIN"], body: updateRegistrationSchema }, async ({ user, body, params }) => {
  const { id } = await params;
  return updateRegistrationStatus(repository, user, id, body.status, body.note ?? null);
});
