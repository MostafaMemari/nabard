import { analyticsPdfResponse } from "@/features/analytics/server/analytics-export";
import * as repository from "@/features/analytics/server/repository";
import { route } from "@/lib/api";

export const GET = route({ roles: ["SUPER_ADMIN"] }, async ({ request, user }) => {
  const province = new URL(request.url).searchParams.get("province");

  return analyticsPdfResponse(repository, user, province);
});
