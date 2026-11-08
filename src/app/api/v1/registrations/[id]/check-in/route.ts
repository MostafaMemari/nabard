import { checkInSchema } from "@/features/registrations/schemas";
import { setRegistrationCheckIn } from "@/features/registrations/server/event-day";
import * as repository from "@/features/registrations/server/repository";
import { route } from "@/lib/api";

export const POST = route({ roles: ["ADMIN"], body: checkInSchema }, async ({ user, body, params }) => {
  const { id } = await params;
  return setRegistrationCheckIn(repository, user, id, body.checkedIn);
});
