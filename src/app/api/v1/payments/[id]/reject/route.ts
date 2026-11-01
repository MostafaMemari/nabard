import { rejectPaymentSchema } from "@/features/payments/schemas";
import * as repository from "@/features/payments/server/repository";
import { rejectPayment } from "@/features/payments/server/service";
import { route } from "@/lib/api";

export const POST = route({ roles: ["ADMIN"], body: rejectPaymentSchema }, async ({ user, body, params }) => {
  const { id } = await params;
  return rejectPayment(repository, user, id, body.note);
});
