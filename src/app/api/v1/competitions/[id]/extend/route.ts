import { extendCompetitionSchema } from "@/features/competitions/schemas";
import * as repository from "@/features/competitions/server/repository";
import { extendCompetition } from "@/features/competitions/server/service";
import { route } from "@/lib/api";

export const POST = route({ roles: ["ADMIN"], body: extendCompetitionSchema }, async ({ user, body, params }) => {
  const { id } = await params;
  return extendCompetition(repository, user, id, body);
});
