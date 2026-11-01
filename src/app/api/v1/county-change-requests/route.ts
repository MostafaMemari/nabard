import { countyChangeListQuerySchema } from "@/features/county-changes/schemas";
import * as repository from "@/features/county-changes/server/repository";
import { listCountyChanges } from "@/features/county-changes/server/service";
import { route } from "@/lib/api";

export const GET = route({ roles: ["ADMIN"] }, async ({ request, user }) => {
  const query = countyChangeListQuerySchema.parse(Object.fromEntries(new URL(request.url).searchParams));
  return listCountyChanges(repository, user, query);
});
