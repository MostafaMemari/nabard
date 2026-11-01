import * as repository from "@/features/competitions/server/repository";
import { listDeadlineExtensions } from "@/features/competitions/server/service";
import { route } from "@/lib/api";

export const GET = route({ roles: ["ADMIN"] }, async ({ user, params }) => {
  const { id } = await params;
  return listDeadlineExtensions(repository, user, id);
});
