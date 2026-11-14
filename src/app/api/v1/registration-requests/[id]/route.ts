import { createStudentSchema } from "@/features/students/schemas";
import * as repository from "@/features/students/server/repository";
import { getRegistrationRequest, updateRegistrationRequest } from "@/features/students/server/service";
import { route } from "@/lib/api";
import { storage } from "@/lib/storage";

export const GET = route({ roles: ["ADMIN", "COACH", "SUPER_ADMIN"] }, async ({ user, params }) => {
  const { id } = await params;
  return getRegistrationRequest(repository, storage, user, id);
});

export const PATCH = route({ roles: ["COACH"], body: createStudentSchema }, async ({ user, body, params }) => {
  const { id } = await params;
  return updateRegistrationRequest(repository, user, id, body);
});
