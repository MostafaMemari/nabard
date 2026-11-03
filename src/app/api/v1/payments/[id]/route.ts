import * as repository from "@/features/payments/server/repository";
import { getPayment } from "@/features/payments/server/service";
import { route } from "@/lib/api";
import { storage } from "@/lib/storage";

export const GET = route({ roles: ["ADMIN", "COACH", "SUPER_ADMIN"] }, async ({ user, params }) => {
  const { id } = await params;
  return getPayment(repository, storage, user, id);
});
