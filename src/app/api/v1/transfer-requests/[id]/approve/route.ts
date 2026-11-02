import { auditRepository } from "@/features/audit";
import { approveTransferSchema } from "@/features/transfers/schemas";
import * as repository from "@/features/transfers/server/repository";
import { decideTransferRequest } from "@/features/transfers/server/service";
import { route } from "@/lib/api";

export const POST = route({ roles: ["ADMIN"], body: approveTransferSchema }, async ({ user, params }) => {
  const { id } = await params;
  return decideTransferRequest(repository, auditRepository, user, id, "APPROVED", null);
});
