import { coachListQuerySchema, createCoachSchema } from "@/features/users/schemas";
import * as repository from "@/features/users/server/repository";
import { createCoach, listCoaches } from "@/features/users/server/service";
import { route } from "@/lib/api";

export const GET = route({ roles: ["ADMIN"] }, async ({ request, user }) => {
  const query = coachListQuerySchema.parse(Object.fromEntries(new URL(request.url).searchParams));
  return listCoaches(repository, user, query);
});

export const POST = route({ roles: ["ADMIN"], body: createCoachSchema }, async ({ user, body }) => createCoach(repository, user, body));
