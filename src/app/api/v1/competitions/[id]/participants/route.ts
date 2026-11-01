import * as repository from "@/features/registrations/server/repository";
import { listParticipants } from "@/features/registrations/server/service";
import { route } from "@/lib/api";

export const GET = route({ roles: ["ADMIN"] }, async ({ user, params }) => {
  const { id } = await params;
  return listParticipants(repository, user, id);
});
