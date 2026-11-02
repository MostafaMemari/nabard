import { createRegistrationsSchema } from "@/features/registrations/schemas";
import * as repository from "@/features/registrations/server/repository";
import { createRegistrations } from "@/features/registrations/server/service";
import { AppError, readFormData, route } from "@/lib/api";
import { postgresStorage, RECEIPT_MAX_BYTES } from "@/lib/storage";

const FORM_MAX_BYTES = RECEIPT_MAX_BYTES + 128 * 1024;

function parseWeights(value: FormDataEntryValue | null): Record<string, number> | undefined {
  if (typeof value !== "string" || value === "") {
    return undefined;
  }

  try {
    const parsed: unknown = JSON.parse(value);
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("not an object");
    }

    return parsed as Record<string, number>;
  } catch {
    throw new AppError(400, "VALIDATION_ERROR", "وزن های ارسال شده معتبر نیست.");
  }
}

export const POST = route({ roles: ["COACH"] }, async ({ request, user, params }) => {
  const { id } = await params;
  const form = await readFormData(request, { maxBytes: FORM_MAX_BYTES });
  const receipt = form.get("receipt");

  if (!(receipt instanceof File)) {
    throw new AppError(400, "VALIDATION_ERROR", "تصویر رسید را بارگذاری کنید.");
  }

  const { studentIds, weights } = createRegistrationsSchema.parse({
    studentIds: form.getAll("studentIds"),
    weights: parseWeights(form.get("weights")),
  });

  return createRegistrations(repository, postgresStorage, user, id, { studentIds, weights, receipt });
});
