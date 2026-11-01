import { updateCompetitionSchema } from "@/features/competitions/schemas";
import * as repository from "@/features/competitions/server/repository";
import { getCompetition, updateCompetition } from "@/features/competitions/server/service";
import { route } from "@/lib/api";

export const GET = route({ roles: ["ADMIN", "COACH"] }, async ({ user, params }) => {
  const { id } = await params;
  return getCompetition(repository, user, id);
});

export const PATCH = route({ roles: ["ADMIN"], body: updateCompetitionSchema }, async ({ user, body, params }) => {
  const { id } = await params;
  return updateCompetition(repository, user, id, body);
});
