import { decidePaymentSchema } from "@/features/payments/schemas";
import * as repository from "@/features/payments/server/repository";
import { decidePayment, getPayment } from "@/features/payments/server/service";
import { route } from "@/lib/api";

export const GET = route({ roles: ["ADMIN", "COACH"] }, async ({ user, params }) => {
  const { id } = await params;
  return getPayment(repository, user, id);
});

export const PATCH = route({ roles: ["ADMIN"], body: decidePaymentSchema }, async ({ user, body, params }) => {
  const { id } = await params;
  return decidePayment(repository, user, id, body);
});
