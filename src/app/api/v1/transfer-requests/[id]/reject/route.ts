import { auditRepository } from "@/features/audit";
import { rejectTransferSchema } from "@/features/transfers/schemas";
import * as repository from "@/features/transfers/server/repository";
import { decideTransferRequest } from "@/features/transfers/server/service";
import { route } from "@/lib/api";

export const POST = route({ roles: ["ADMIN"], body: rejectTransferSchema }, async ({ user, params, body }) => {
  const { id } = await params;
  return decideTransferRequest(repository, auditRepository, user, id, "REJECTED", body.note);
});
