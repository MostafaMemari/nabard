import * as repository from "@/features/counties/server/repository";
import { listCounties } from "@/features/counties/server/service";
import { route } from "@/lib/api";

export const GET = route({}, async ({ user }) => listCounties(repository, user));
