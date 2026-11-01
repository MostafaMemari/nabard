import { pendingReviewQuerySchema } from "@/features/students/schemas";
import * as repository from "@/features/students/server/repository";
import { listPendingReviewStudents } from "@/features/students/server/service";
import { route } from "@/lib/api";

export const GET = route({ roles: ["ADMIN"] }, async ({ request, user }) => {
  const query = pendingReviewQuerySchema.parse(Object.fromEntries(new URL(request.url).searchParams));
  return listPendingReviewStudents(repository, user, query);
});
