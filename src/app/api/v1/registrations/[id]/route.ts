import * as repository from "@/features/registrations/server/repository";
import { getRegistrationDetail } from "@/features/registrations/server/service";
import { route } from "@/lib/api";

export const GET = route({ roles: ["ADMIN", "COACH", "SUPER_ADMIN"] }, async ({ user, params }) => {
  const { id } = await params;
  return getRegistrationDetail(repository, user, id);
});
