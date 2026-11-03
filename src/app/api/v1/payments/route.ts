import { paymentListQuerySchema } from "@/features/payments/schemas";
import * as repository from "@/features/payments/server/repository";
import { listPayments } from "@/features/payments/server/service";
import { route } from "@/lib/api";
import { storage } from "@/lib/storage";

export const GET = route({ roles: ["ADMIN", "COACH", "SUPER_ADMIN"] }, async ({ request, user }) => {
  const query = paymentListQuerySchema.parse(Object.fromEntries(new URL(request.url).searchParams));
  return listPayments(repository, storage, user, query);
});
