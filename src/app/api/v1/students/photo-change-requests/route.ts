import { photoChangeListQuerySchema } from "@/features/photo-changes/schemas";
import * as repository from "@/features/photo-changes/server/repository";
import { listPhotoChangeRequests } from "@/features/photo-changes/server/service";
import { route } from "@/lib/api";

export const GET = route({ roles: ["ADMIN", "COACH"] }, async ({ request, user }) => {
  const query = photoChangeListQuerySchema.parse(Object.fromEntries(new URL(request.url).searchParams));
  return listPhotoChangeRequests(repository, user, query);
});
