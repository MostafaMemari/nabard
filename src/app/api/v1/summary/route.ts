import * as repository from "@/features/summary/server/repository";
import { getAdminSummary } from "@/features/summary/server/service";
import { route } from "@/lib/api";

export const GET = route({ roles: ["ADMIN"] }, async ({ user }) => {
  return getAdminSummary(repository, user);
});
