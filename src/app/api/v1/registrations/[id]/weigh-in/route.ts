import { auditRepository } from "@/features/audit";
import { weighInSchema } from "@/features/registrations/schemas";
import { weighInRegistration } from "@/features/registrations/server/event-day";
import * as repository from "@/features/registrations/server/repository";
import { route } from "@/lib/api";

export const POST = route({ roles: ["ADMIN"], body: weighInSchema }, async ({ user, body, params }) => {
  const { id } = await params;
  return weighInRegistration(repository, auditRepository, user, id, body.weightKg);
});
