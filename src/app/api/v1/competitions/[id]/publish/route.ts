import * as repository from "@/features/competitions/server/repository";
import { publishCompetition } from "@/features/competitions/server/service";
import { route } from "@/lib/api";

export const POST = route({ roles: ["ADMIN"] }, async ({ user, params }) => {
  const { id } = await params;
  return publishCompetition(repository, user, id);
});
