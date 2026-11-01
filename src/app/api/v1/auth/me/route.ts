import * as repository from "@/features/auth/server/repository";
import { getProfile } from "@/features/auth/server/service";
import { route } from "@/lib/api";

export const GET = route({}, async ({ user }) => {
  return getProfile(repository, user);
});
