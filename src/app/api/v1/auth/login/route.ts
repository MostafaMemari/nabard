import { loginSchema } from "@/features/auth/schemas";
import * as repository from "@/features/auth/server/repository";
import { login } from "@/features/auth/server/service";
import { ok, route } from "@/lib/api";
import { createSessionToken, sessionCookie } from "@/lib/session";

export const POST = route({ auth: false, body: loginSchema }, async ({ body }) => {
  const user = await login(repository, body);
  const token = await createSessionToken(user);

  const response = ok(user);
  response.headers.append("Set-Cookie", sessionCookie(token));
  return response;
});
