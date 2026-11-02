import { auditRepository } from "@/features/audit";
import * as repository from "@/features/counties/server/repository";
import { addDefaultCounties } from "@/features/counties/server/service";
import { route } from "@/lib/api";

export const POST = route({ roles: ["ADMIN"] }, async ({ user }) => addDefaultCounties(repository, auditRepository, user));
