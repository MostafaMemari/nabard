import { auditRepository } from "@/features/audit";
import { createProvinceChangeSchema } from "@/features/province-changes/schemas";
import * as repository from "@/features/province-changes/server/repository";
import { createProvinceChangeRequest } from "@/features/province-changes/server/service";
import { route } from "@/lib/api";

// The current coach asks to move the student to a coach of another province;
// the admin of the destination province decides.
export const POST = route({ roles: ["COACH"], body: createProvinceChangeSchema }, async ({ user, body, params }) => {
  const { id } = await params;
  return createProvinceChangeRequest(repository, auditRepository, user, id, body);
});
