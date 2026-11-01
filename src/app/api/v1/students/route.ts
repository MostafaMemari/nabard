import { createStudentSchema, studentListQuerySchema } from "@/features/students/schemas";
import * as repository from "@/features/students/server/repository";
import { createStudent, listStudents } from "@/features/students/server/service";
import { route } from "@/lib/api";

export const GET = route({ roles: ["ADMIN", "COACH"] }, async ({ request, user }) => {
  const query = studentListQuerySchema.parse(Object.fromEntries(new URL(request.url).searchParams));
  return listStudents(repository, user, query);
});

export const POST = route({ roles: ["COACH"], body: createStudentSchema }, async ({ user, body }) => createStudent(repository, user, body));
