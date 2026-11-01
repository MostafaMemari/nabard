import { cancelCompetitionSchema } from "@/features/competitions/schemas";
import * as repository from "@/features/competitions/server/repository";
import { cancelCompetition } from "@/features/competitions/server/service";
import { route } from "@/lib/api";

export const POST = route({ roles: ["ADMIN"], body: cancelCompetitionSchema }, async ({ user, body, params }) => {
  const { id } = await params;
  return cancelCompetition(repository, user, id, body.reason);
});
