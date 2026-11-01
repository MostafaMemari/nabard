import { updateStudentSchema } from "@/features/students/schemas";
import * as repository from "@/features/students/server/repository";
import { deleteStudent, getStudent, updateStudent } from "@/features/students/server/service";
import { route } from "@/lib/api";

export const GET = route({ roles: ["ADMIN", "COACH", "SUPER_ADMIN"] }, async ({ user, params }) => {
  const { id } = await params;
  return getStudent(repository, user, id);
});

export const PATCH = route({ roles: ["COACH"], body: updateStudentSchema }, async ({ user, body, params }) => {
  const { id } = await params;
  return updateStudent(repository, user, id, body);
});

export const DELETE = route({ roles: ["COACH"] }, async ({ user, params }) => {
  const { id } = await params;
  return deleteStudent(repository, user, id);
});
