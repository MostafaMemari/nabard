import { completeRefundSchema } from "@/features/refunds/schemas";
import * as repository from "@/features/refunds/server/repository";
import { completeRefund } from "@/features/refunds/server/service";
import { route } from "@/lib/api";

export const POST = route({ roles: ["ADMIN"], body: completeRefundSchema }, async ({ user, body, params }) => {
  const { id } = await params;
  return completeRefund(repository, user, id, { note: body.note ?? null });
});
