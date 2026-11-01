import { paymentListQuerySchema } from "@/features/payments/schemas";
import * as repository from "@/features/payments/server/repository";
import { listPayments } from "@/features/payments/server/service";
import { route } from "@/lib/api";

export const GET = route({ roles: ["ADMIN", "COACH", "SUPER_ADMIN"] }, async ({ request, user }) => {
  const query = paymentListQuerySchema.parse(Object.fromEntries(new URL(request.url).searchParams));
  return listPayments(repository, user, query);
});
