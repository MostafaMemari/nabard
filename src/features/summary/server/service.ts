import { startOfWeek } from "date-fns-jalali";
import type { Province } from "@/generated/client";
import { AppError } from "@/lib/api";
import type { CurrentUser } from "@/lib/session";
import type { AdminSummary } from "../types";
import type { SummaryRepository, UserIdentityRecord } from "./repository";

function forbidden(): AppError {
  return new AppError(403, "FORBIDDEN", "شما به این بخش دسترسی ندارید");
}

async function requireActiveAdmin(repo: SummaryRepository, user: CurrentUser): Promise<UserIdentityRecord> {
  const record = await repo.findUserById(user.id);
  if (!record) throw new AppError(401, "UNAUTHORIZED", "برای ادامه وارد حساب کاربری شوید");
  if (!record.isActive || record.role !== user.role || record.role !== "ADMIN") throw forbidden();

  return record;
}

function provinceOf(identity: UserIdentityRecord): Province {
  if (identity.province === null) throw forbidden();

  return identity.province;
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
    pendingTransfersCount,
    latestPendingPayments,
    upcomingCompetitions,
  ] = await Promise.all([
    repo.countPayments(provinceOf(identity), "PENDING"),
    repo.countOpenCompetitions(provinceOf(identity)),
    repo.countRegistrationsSince(provinceOf(identity), weekStart),
    repo.countRefunds(provinceOf(identity), "PENDING"),
    repo.countPendingProfiles(provinceOf(identity)),
    repo.countPendingCountyChanges(provinceOf(identity)),
    repo.countPendingTransfers(provinceOf(identity)),
    repo.findLatestPendingPayments(provinceOf(identity)),
    repo.findUpcomingCompetitions(provinceOf(identity)),
  ]);

  return {
    pendingPaymentsCount,
    openCompetitionsCount,
    weeklyRegistrationsCount,
    pendingRefundsCount,
    pendingProfilesCount,
    pendingCountyChangesCount,
    pendingTransfersCount,
    latestPendingPayments,
    upcomingCompetitions,
  };
}
