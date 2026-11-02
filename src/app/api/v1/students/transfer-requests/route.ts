import { auditRepository } from "@/features/audit";
import { createTransferRequestSchema } from "@/features/transfers/schemas";
import * as repository from "@/features/transfers/server/repository";
import { createTransferRequest } from "@/features/transfers/server/service";
import { route } from "@/lib/api";

export const POST = route({ roles: ["COACH"], body: createTransferRequestSchema }, async ({ user, body }) =>
  createTransferRequest(repository, auditRepository, user, body),
);
