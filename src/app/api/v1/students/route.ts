import { createStudentSchema, studentListQuerySchema } from "@/features/students/schemas";
import * as repository from "@/features/students/server/repository";
import { createStudent, listStudents } from "@/features/students/server/service";
import { route } from "@/lib/api";
import { storage } from "@/lib/storage";

export const GET = route({ roles: ["ADMIN", "COACH", "SUPER_ADMIN"] }, async ({ request, user }) => {
  const query = studentListQuerySchema.parse(Object.fromEntries(new URL(request.url).searchParams));
  return listStudents(repository, storage, user, query);
});

export const POST = route({ roles: ["COACH"], body: createStudentSchema }, async ({ user, body }) => createStudent(repository, user, body));
