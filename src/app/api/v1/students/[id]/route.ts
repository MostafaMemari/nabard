import * as repository from "@/features/students/server/repository";
import { deleteStudent, getStudent } from "@/features/students/server/service";
import { route } from "@/lib/api";
import { storage } from "@/lib/storage";

export const GET = route({ roles: ["ADMIN", "COACH", "SUPER_ADMIN"] }, async ({ user, params }) => {
  const { id } = await params;
  return getStudent(repository, storage, user, id);
});

export const DELETE = route({ roles: ["COACH"] }, async ({ user, params }) => {
  const { id } = await params;
  return deleteStudent(repository, storage, user, id);
});
