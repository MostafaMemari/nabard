import { z } from "zod";
import { auditRepository } from "@/features/audit";
import { weightClassSetSchema } from "@/features/base-data/schemas";
import * as repository from "@/features/base-data/server/admin-repository";
import { getWeightClassSet, saveWeightClassSet } from "@/features/base-data/server/admin-service";
import { AppError, route } from "@/lib/api";

const weightClassSetQuerySchema = z.object({
  ageCategoryId: z.string().min(1, "رده سنی را انتخاب کنید"),
  gender: z.enum(["MALE", "FEMALE"], { message: "جنسیت را انتخاب کنید" }),
});

export const GET = route({ roles: ["SUPER_ADMIN"] }, async ({ user, request }) => {
  const url = new URL(request.url);
  const params = weightClassSetQuerySchema.parse({
    ageCategoryId: url.searchParams.get("ageCategoryId") ?? "",
    gender: url.searchParams.get("gender") ?? "",
  });

  return getWeightClassSet(repository, user, params);
});

export const PUT = route({ roles: ["SUPER_ADMIN"], body: weightClassSetSchema }, async ({ user, body }) => {
  if (body.rows.length > 100) {
    throw new AppError(400, "VALIDATION_ERROR", "تعداد رده های وزنی بیش از حد مجاز است");
  }

  return saveWeightClassSet(repository, auditRepository, user, body);
});
