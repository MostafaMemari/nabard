import { rejectCountyChangeSchema } from "@/features/county-changes/schemas";
import * as repository from "@/features/county-changes/server/repository";
import { decideCountyChange } from "@/features/county-changes/server/service";
import { route } from "@/lib/api";

export const POST = route({ roles: ["ADMIN"], body: rejectCountyChangeSchema }, async ({ user, body, params }) => {
  const { id } = await params;
  return decideCountyChange(repository, user, id, "REJECTED", body.note);
});
