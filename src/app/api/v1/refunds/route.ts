import { refundListQuerySchema } from "@/features/refunds/schemas";
import * as repository from "@/features/refunds/server/repository";
import { listRefunds } from "@/features/refunds/server/service";
import { route } from "@/lib/api";

export const GET = route({ roles: ["ADMIN", "COACH"] }, async ({ request, user }) => {
  const query = refundListQuerySchema.parse(Object.fromEntries(new URL(request.url).searchParams));
  return listRefunds(repository, user, query);
});
