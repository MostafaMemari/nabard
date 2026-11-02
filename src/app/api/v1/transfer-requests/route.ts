import { transferListQuerySchema } from "@/features/transfers/schemas";
import * as repository from "@/features/transfers/server/repository";
import { listTransferRequests } from "@/features/transfers/server/service";
import { route } from "@/lib/api";

export const GET = route({ roles: ["ADMIN", "COACH"] }, async ({ request, user }) => {
  const query = transferListQuerySchema.parse(Object.fromEntries(new URL(request.url).searchParams));
  return listTransferRequests(repository, user, query);
});
