import { updateStudentBeltSchema } from "@/features/students/schemas";
import * as repository from "@/features/students/server/repository";
import { deleteStudent, getStudent, updateStudentBelt } from "@/features/students/server/service";
import { route } from "@/lib/api";
import { storage } from "@/lib/storage";

export const GET = route({ roles: ["ADMIN", "COACH", "SUPER_ADMIN"] }, async ({ user, params }) => {
  const { id } = await params;
  return getStudent(repository, user, id);
});

export const PATCH = route({ roles: ["ADMIN"], body: updateStudentBeltSchema }, async ({ user, body, params }) => {
  const { id } = await params;
  return updateStudentBelt(repository, user, id, body);
});

export const DELETE = route({ roles: ["COACH"] }, async ({ user, params }) => {
  const { id } = await params;
  return deleteStudent(repository, storage, user, id);
});
