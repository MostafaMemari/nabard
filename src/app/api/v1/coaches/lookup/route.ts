import { coachLookupQuerySchema } from "@/features/users/schemas";
import * as repository from "@/features/users/server/repository";
import { listCoachTargets } from "@/features/users/server/service";
import { route } from "@/lib/api";

export const GET = route({ roles: ["ADMIN", "COACH", "SUPER_ADMIN"] }, async ({ request, user }) => {
  const query = coachLookupQuerySchema.parse(Object.fromEntries(new URL(request.url).searchParams));
  return listCoachTargets(repository, user, query);
});
