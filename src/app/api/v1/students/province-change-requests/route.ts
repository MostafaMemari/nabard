import { provinceChangeListQuerySchema } from "@/features/province-changes/schemas";
import * as repository from "@/features/province-changes/server/repository";
import { listProvinceChangeRequests } from "@/features/province-changes/server/service";
import { route } from "@/lib/api";

export const GET = route({ roles: ["ADMIN", "COACH"] }, async ({ request, user }) => {
  const query = provinceChangeListQuerySchema.parse(Object.fromEntries(new URL(request.url).searchParams));
  return listProvinceChangeRequests(repository, user, query);
});
