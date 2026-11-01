import { rejectRegistrationSchema } from "@/features/registrations/schemas";
import * as repository from "@/features/registrations/server/repository";
import { rejectRegistration } from "@/features/registrations/server/service";
import { route } from "@/lib/api";

export const POST = route({ roles: ["ADMIN"], body: rejectRegistrationSchema }, async ({ user, body, params }) => {
  const { id } = await params;
  return rejectRegistration(repository, user, id, body.note);
});
