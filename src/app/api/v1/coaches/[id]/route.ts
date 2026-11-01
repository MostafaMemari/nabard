import { updateCoachSchema } from "@/features/users/schemas";
import * as repository from "@/features/users/server/repository";
import { getCoach, updateCoach } from "@/features/users/server/service";
import { route } from "@/lib/api";

export const GET = route({ roles: ["ADMIN", "SUPER_ADMIN"] }, async ({ user, params }) => {
  const { id } = await params;
  return getCoach(repository, user, id);
});

export const PATCH = route({ roles: ["ADMIN"], body: updateCoachSchema }, async ({ user, body, params }) => {
  const { id } = await params;
  return updateCoach(repository, user, id, body);
});
