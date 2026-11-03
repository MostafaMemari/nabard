import * as repository from "@/features/users/server/repository";
import { readCoachPhoto } from "@/features/users/server/service";
import { route } from "@/lib/api";
import { storage } from "@/lib/storage";

export const runtime = "nodejs";

export const GET = route({ roles: ["ADMIN", "COACH", "SUPER_ADMIN"] }, async ({ user, params }) => {
  const { id } = await params;
  const photo = await readCoachPhoto(repository, storage, user, id);

  return new Response(photo.stream, {
    headers: {
      "content-type": photo.mime,
      "content-disposition": "inline",
      "cache-control": "private, no-cache",
      "content-length": String(photo.size),
      "x-content-type-options": "nosniff",
    },
  });
});
