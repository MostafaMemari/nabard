import { studentListQuerySchema } from "@/features/students/schemas";
import * as repository from "@/features/students/server/repository";
import { listStudents } from "@/features/students/server/service";
import { route } from "@/lib/api";
import { storage } from "@/lib/storage";

export const GET = route({ roles: ["ADMIN", "COACH", "SUPER_ADMIN"] }, async ({ request, user }) => {
  const query = studentListQuerySchema.parse(Object.fromEntries(new URL(request.url).searchParams));
  return listStudents(repository, storage, user, query);
});
