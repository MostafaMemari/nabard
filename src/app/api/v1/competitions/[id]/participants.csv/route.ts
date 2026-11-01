import { participantsCsvResponse } from "@/features/registrations/server/participants-csv";
import * as repository from "@/features/registrations/server/repository";
import { route } from "@/lib/api";

export const GET = route({ roles: ["ADMIN"] }, async ({ user, params }) => {
  const { id } = await params;
  return participantsCsvResponse(repository, user, id);
});
