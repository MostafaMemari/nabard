import * as repository from "@/features/students/server/repository";
import { readStudentDocument } from "@/features/students/server/service";
import { route } from "@/lib/api";
import { storage } from "@/lib/storage";

export const runtime = "nodejs";

export const GET = route({ roles: ["ADMIN", "COACH"] }, async ({ user, params }) => {
  const { id, type } = await params;
  const document = await readStudentDocument(repository, storage, user, id, type);

  return new Response(document.stream, {
    headers: {
      "content-type": document.mime,
      "content-disposition": "inline",
      "cache-control": "private, no-cache",
      "content-length": String(document.size),
      "x-content-type-options": "nosniff",
    },
  });
});
