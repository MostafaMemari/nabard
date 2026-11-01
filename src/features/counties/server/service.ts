import { AppError } from "@/lib/api";
import type { CurrentUser } from "@/lib/session";
import type { County } from "../types";
import type { CountiesRepository } from "./repository";

export async function listCounties(repo: CountiesRepository, user: CurrentUser): Promise<County[]> {
  const record = await repo.findUserById(user.id);
  if (!record) throw new AppError(401, "UNAUTHORIZED", "برای ادامه وارد حساب کاربری شوید.");
  if (!record.isActive || record.role !== user.role) {
    throw new AppError(403, "FORBIDDEN", "شما به این بخش دسترسی ندارید.");
  }

  return repo.findCountiesByProvince(record.province);
}
