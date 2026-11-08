import * as repository from "@/features/analytics/server/repository";
import { getSuperAnalytics } from "@/features/analytics/server/service";
import { route } from "@/lib/api";

export const GET = route({ roles: ["SUPER_ADMIN"] }, async ({ request, user }) => {
  const province = new URL(request.url).searchParams.get("province");

  return getSuperAnalytics(repository, user, province);
});
