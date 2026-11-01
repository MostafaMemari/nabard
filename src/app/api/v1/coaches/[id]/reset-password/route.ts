import { resetCoachPasswordSchema } from "@/features/users/schemas";
import * as repository from "@/features/users/server/repository";
import { resetCoachPassword } from "@/features/users/server/service";
import { route } from "@/lib/api";

export const POST = route({ roles: ["ADMIN"], body: resetCoachPasswordSchema }, async ({ user, body, params }) => {
  const { id } = await params;
  return resetCoachPassword(repository, user, id, body.password);
});
