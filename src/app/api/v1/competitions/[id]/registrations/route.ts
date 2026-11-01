import { createRegistrationsSchema } from "@/features/registrations/schemas";
import * as repository from "@/features/registrations/server/repository";
import { createRegistrations } from "@/features/registrations/server/service";
import { AppError, readFormData, route } from "@/lib/api";
import { postgresStorage } from "@/lib/storage";

export const POST = route({ roles: ["COACH"] }, async ({ request, user, params }) => {
  const { id } = await params;
  const form = await readFormData(request);
  const receipt = form.get("receipt");

  if (!(receipt instanceof File)) {
    throw new AppError(400, "VALIDATION_ERROR", "تصویر رسید را بارگذاری کنید.");
  }

  const { studentIds } = createRegistrationsSchema.parse({ studentIds: form.getAll("studentIds") });

  return createRegistrations(repository, postgresStorage, user, id, { studentIds, receipt });
});
