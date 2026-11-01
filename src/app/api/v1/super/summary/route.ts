import * as repository from "@/features/super/server/repository";
import { getSuperSummary } from "@/features/super/server/service";
import { route } from "@/lib/api";

export const GET = route({ roles: ["SUPER_ADMIN"] }, async ({ user }) => getSuperSummary(repository, user));
