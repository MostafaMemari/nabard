import { eventDayXlsxResponse } from "@/features/registrations/server/event-day-export";
import * as repository from "@/features/registrations/server/repository";
import { route } from "@/lib/api";

export const GET = route({ roles: ["ADMIN", "SUPER_ADMIN"] }, async ({ user, params }) => {
  const { id } = await params;
  return eventDayXlsxResponse(repository, user, id);
});
