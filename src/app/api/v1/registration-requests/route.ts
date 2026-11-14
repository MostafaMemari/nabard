import { auditRepository } from "@/features/audit";
import { createStudentSchema, registrationRequestListQuerySchema } from "@/features/students/schemas";
import * as repository from "@/features/students/server/repository";
import { createRegistrationRequest, listRegistrationRequests } from "@/features/students/server/service";
import { route } from "@/lib/api";
import { storage } from "@/lib/storage";

export const GET = route({ roles: ["ADMIN", "COACH", "SUPER_ADMIN"] }, async ({ request, user }) => {
  const query = registrationRequestListQuerySchema.parse(Object.fromEntries(new URL(request.url).searchParams));
  return listRegistrationRequests(repository, storage, user, query);
});

export const POST = route({ roles: ["COACH"], body: createStudentSchema }, async ({ user, body }) =>
  createRegistrationRequest(repository, auditRepository, user, body),
);
