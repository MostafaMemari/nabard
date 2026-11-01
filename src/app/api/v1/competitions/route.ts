import { competitionListQuerySchema, createCompetitionSchema } from "@/features/competitions/schemas";
import * as repository from "@/features/competitions/server/repository";
import { createCompetition, listCompetitions } from "@/features/competitions/server/service";
import { route } from "@/lib/api";

export const GET = route({ roles: ["ADMIN", "COACH"] }, async ({ request, user }) => {
  const query = competitionListQuerySchema.parse(Object.fromEntries(new URL(request.url).searchParams));
  return listCompetitions(repository, user, query);
});

export const POST = route({ roles: ["ADMIN"], body: createCompetitionSchema }, async ({ user, body }) =>
  createCompetition(repository, user, body),
);
