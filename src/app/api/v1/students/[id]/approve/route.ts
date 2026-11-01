import * as repository from "@/features/students/server/repository";
import { approveStudentProfile } from "@/features/students/server/service";
import { route } from "@/lib/api";

export const POST = route({ roles: ["ADMIN"] }, async ({ user, params }) => {
  const { id } = await params;
  return approveStudentProfile(repository, user, id);
});
