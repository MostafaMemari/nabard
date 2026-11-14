import { updateStudentBeltSchema } from "@/features/students/schemas";
import * as repository from "@/features/students/server/repository";
import { updateRegistrationRequestBelt } from "@/features/students/server/service";
import { route } from "@/lib/api";

export const PATCH = route({ roles: ["ADMIN"], body: updateStudentBeltSchema }, async ({ user, body, params }) => {
  const { id } = await params;
  return updateRegistrationRequestBelt(repository, user, id, body);
});
