import { changePasswordSchema } from "@/features/auth/schemas";
import * as repository from "@/features/auth/server/repository";
import { changePassword } from "@/features/auth/server/service";
import { route } from "@/lib/api";

export const POST = route({ body: changePasswordSchema }, async ({ user, body }) => {
  return changePassword(repository, user, body);
});
