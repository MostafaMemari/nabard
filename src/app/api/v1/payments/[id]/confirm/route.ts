import * as repository from "@/features/payments/server/repository";
import { confirmPayment } from "@/features/payments/server/service";
import { route } from "@/lib/api";
import { storage } from "@/lib/storage";

export const POST = route({ roles: ["ADMIN"] }, async ({ user, params }) => {
  const { id } = await params;
  return confirmPayment(repository, storage, user, id);
});
