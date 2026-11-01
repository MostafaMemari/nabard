import { loginSchema } from "@/features/auth/schemas";
import * as repository from "@/features/auth/server/repository";
import { login } from "@/features/auth/server/service";
import { ipThrottleKey, loginThrottleKeys } from "@/features/auth/server/throttle";
import { ok, route } from "@/lib/api";
import { createSessionToken, sessionCookie } from "@/lib/session";

export const POST = route({ auth: false, body: loginSchema }, async ({ request, body }) => {
  const throttle = { repo: repository.loginThrottleRepository, keys: loginThrottleKeys(body.mobile, await ipThrottleKey(request)) };
  const user = await login(repository, body, throttle);
  const token = await createSessionToken(user);

  const response = ok(user);
  response.headers.append("Set-Cookie", sessionCookie(token));
  return response;
});
