import { ok, route } from "@/lib/api";
import { clearedSessionCookie } from "@/lib/session";

export const POST = route({ auth: false }, async () => {
  const response = ok(null);
  response.headers.append("Set-Cookie", clearedSessionCookie());
  return response;
});
