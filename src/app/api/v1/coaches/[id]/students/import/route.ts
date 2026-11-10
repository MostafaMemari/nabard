import { importStudents, readStudentsImportFile } from "@/features/students/server/import-service";
import * as repository from "@/features/students/server/repository";
import { route } from "@/lib/api";

export const runtime = "nodejs";

export const POST = route({ roles: ["ADMIN"] }, async ({ request, user, params }) => {
  const { id } = await params;
  const file = await readStudentsImportFile(request);
  return importStudents(repository, user, id, file);
});
