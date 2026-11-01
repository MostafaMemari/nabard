import { AppError } from "@/lib/api";
import type { CurrentUser } from "@/lib/session";
import type { ProvinceSummary } from "../types";
import type { SuperRepository } from "./repository";

function forbidden(): AppError {
  return new AppError(403, "FORBIDDEN", "شما به این بخش دسترسی ندارید.");
}

export async function getSuperSummary(repo: SuperRepository, user: CurrentUser): Promise<ProvinceSummary[]> {
  if (user.role !== "SUPER_ADMIN") throw forbidden();

  const record = await repo.findUserById(user.id);
  if (!record) throw new AppError(401, "UNAUTHORIZED", "برای ادامه وارد حساب کاربری شوید.");
  if (!record.isActive || record.role !== user.role) throw forbidden();

  return repo.findProvinceSummaries();
}
