import { startOfWeek } from "date-fns-jalali";
import { AppError } from "@/lib/api";
import type { CurrentUser } from "@/lib/session";
import type { AdminSummary } from "../types";
import type { SummaryRepository, UserIdentityRecord } from "./repository";

function forbidden(): AppError {
  return new AppError(403, "FORBIDDEN", "شما به این بخش دسترسی ندارید.");
}

async function requireActiveAdmin(repo: SummaryRepository, user: CurrentUser): Promise<UserIdentityRecord> {
  const record = await repo.findUserById(user.id);
  if (!record) throw new AppError(401, "UNAUTHORIZED", "برای ادامه وارد حساب کاربری شوید.");
  if (!record.isActive || record.role !== user.role || record.role !== "ADMIN") throw forbidden();

  return record;
}

export async function getAdminSummary(repo: SummaryRepository, user: CurrentUser): Promise<AdminSummary> {
  const identity = await requireActiveAdmin(repo, user);
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 6 });

  const [
    pendingPaymentsCount,
    openCompetitionsCount,
    weeklyRegistrationsCount,
    pendingRefundsCount,
    pendingProfilesCount,
    pendingCountyChangesCount,
    latestPendingPayments,
    upcomingCompetitions,
  ] = await Promise.all([
    repo.countPayments(identity.province, "PENDING"),
    repo.countOpenCompetitions(identity.province),
    repo.countRegistrationsSince(identity.province, weekStart),
    repo.countRefunds(identity.province, "PENDING"),
    repo.countPendingProfiles(identity.province),
    repo.countPendingCountyChanges(identity.province),
    repo.findLatestPendingPayments(identity.province),
    repo.findUpcomingCompetitions(identity.province),
  ]);

  return {
    pendingPaymentsCount,
    openCompetitionsCount,
    weeklyRegistrationsCount,
    pendingRefundsCount,
    pendingProfilesCount,
    pendingCountyChangesCount,
    latestPendingPayments,
    upcomingCompetitions,
  };
}
