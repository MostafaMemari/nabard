import { rejectProfileSchema } from "@/features/students/schemas";
import * as repository from "@/features/students/server/repository";
import { rejectStudentProfile } from "@/features/students/server/service";
import { route } from "@/lib/api";

export const POST = route({ roles: ["ADMIN"], body: rejectProfileSchema }, async ({ user, body, params }) => {
  const { id } = await params;
  return rejectStudentProfile(repository, user, id, body.note);
});
