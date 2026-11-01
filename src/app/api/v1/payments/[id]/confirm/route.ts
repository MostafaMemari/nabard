import * as repository from "@/features/payments/server/repository";
import { confirmPayment } from "@/features/payments/server/service";
import { route } from "@/lib/api";

export const POST = route({ roles: ["ADMIN"] }, async ({ user, params }) => {
  const { id } = await params;
  return confirmPayment(repository, user, id);
});
