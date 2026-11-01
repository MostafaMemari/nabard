import * as repository from "@/features/registrations/server/repository";
import { approveRegistration } from "@/features/registrations/server/service";
import { route } from "@/lib/api";

export const POST = route({ roles: ["ADMIN"] }, async ({ user, params }) => {
  const { id } = await params;
  return approveRegistration(repository, user, id);
});
