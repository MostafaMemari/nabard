import { participantsPdfResponse } from "@/features/registrations/server/participants-export";
import * as repository from "@/features/registrations/server/repository";
import { route } from "@/lib/api";

export const GET = route({ roles: ["ADMIN"] }, async ({ user, params }) => {
  const { id } = await params;
  return participantsPdfResponse(repository, user, id);
});
