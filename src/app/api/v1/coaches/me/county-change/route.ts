import { createCountyChangeSchema } from "@/features/county-changes/schemas";
import * as repository from "@/features/county-changes/server/repository";
import { createCountyChange, getMyCountyChange } from "@/features/county-changes/server/service";
import { route } from "@/lib/api";

export const GET = route({ roles: ["COACH"] }, async ({ user }) => getMyCountyChange(repository, user));

export const POST = route({ roles: ["COACH"], body: createCountyChangeSchema }, async ({ user, body }) =>
  createCountyChange(repository, user, body),
);
