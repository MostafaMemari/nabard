import { registrationListQuerySchema } from "@/features/registrations/schemas";
import * as repository from "@/features/registrations/server/repository";
import { listRegistrations } from "@/features/registrations/server/service";
import { route } from "@/lib/api";

export const GET = route({ roles: ["ADMIN", "COACH"] }, async ({ request, user }) => {
  const query = registrationListQuerySchema.parse(Object.fromEntries(new URL(request.url).searchParams));
  return listRegistrations(repository, user, query);
});
