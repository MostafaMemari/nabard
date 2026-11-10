import * as repository from "@/features/photo-changes/server/repository";
import { readPhotoChangeFile } from "@/features/photo-changes/server/service";
import { route } from "@/lib/api";
import { storage } from "@/lib/storage";

export const runtime = "nodejs";

// Pending photo of a change request, streamed through the authenticated
// backend. `?download=1` forces a file download instead of inline display.
export const GET = route({ roles: ["ADMIN", "COACH"] }, async ({ request, user, params }) => {
  const { id } = await params;
  const file = await readPhotoChangeFile(repository, storage, user, id);

  const download = new URL(request.url).searchParams.get("download") === "1";
  const extension = file.mime === "image/png" ? "png" : file.mime === "image/webp" ? "webp" : "jpg";
  const disposition = download ? `attachment; filename="photo-change-${id}.${extension}"` : "inline";

  return new Response(file.stream, {
    headers: {
      "content-type": file.mime,
      "content-disposition": disposition,
      "cache-control": "private, no-cache",
      "content-length": String(file.size),
      "x-content-type-options": "nosniff",
    },
  });
});
