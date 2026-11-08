import type { Province } from "@/generated/client";
import { AppError } from "@/lib/api";
import { type ProvinceValue, provinceValues } from "@/lib/provinces";
import type { CurrentUser } from "@/lib/session";
import type { CountyStat, SuperAnalytics, TrendPoint } from "../types";
import { bucketByJalaliMonth, JALALI_MONTH_NAMES, lastJalaliMonths, trendSinceBound } from "./jalali-months";
import type { AnalyticsRepository, CountyCountRow, CountyRow } from "./repository";

const TREND_MONTHS = 12;
const COUNTY_CHART_LIMIT = 8;

function forbidden(): AppError {
  return new AppError(403, "FORBIDDEN", "شما به این بخش دسترسی ندارید.");
}

function parseProvince(raw: string | null): Province | null {
  if (raw === null || raw === "") return null;
  if (!(provinceValues as readonly string[]).includes(raw)) {
    throw new AppError(400, "INVALID_PROVINCE", "استان انتخاب شده معتبر نیست.");
  }

  return raw as ProvinceValue;
}

function buildTrend(now: Date, dates: Date[]): TrendPoint[] {
  const months = lastJalaliMonths(TREND_MONTHS, now);
  const counts = bucketByJalaliMonth(months, dates);

  return months.map((month) => ({
    key: month.key,
    label: JALALI_MONTH_NAMES[month.month - 1],
    year: month.year,
    count: counts.get(month.key) ?? 0,
  }));
}

function toCountyMap(rows: CountyCountRow[]): Map<string, number> {
  return new Map(rows.filter((row) => row.countyId !== null).map((row) => [row.countyId as string, row.count]));
}

function buildCountyStats(
  registrationRows: CountyCountRow[],
  studentRows: CountyCountRow[],
  counties: CountyRow[],
): { counties: CountyStat[]; hidden: number } {
  const countyById = new Map(counties.map((county) => [county.id, county]));
  const registrationsByCounty = toCountyMap(registrationRows);
  const studentsByCounty = toCountyMap(studentRows);

  const stats: CountyStat[] = [];
  for (const [id, registrations] of registrationsByCounty) {
    const county = countyById.get(id);
    if (!county) continue; // coach of a removed county; nothing to label
    stats.push({ id, name: county.name, province: county.province, registrations, students: studentsByCounty.get(id) ?? 0 });
  }
  for (const [id, students] of studentsByCounty) {
    if (registrationsByCounty.has(id)) continue;
    const county = countyById.get(id);
    if (!county) continue;
    stats.push({ id, name: county.name, province: county.province, registrations: 0, students });
  }

  stats.sort((a, b) => b.registrations - a.registrations || b.students - a.students || a.name.localeCompare(b.name, "fa"));

  return { counties: stats.slice(0, COUNTY_CHART_LIMIT), hidden: Math.max(0, stats.length - COUNTY_CHART_LIMIT) };
}

export async function getSuperAnalytics(
  repo: AnalyticsRepository,
  user: CurrentUser,
  rawProvince: string | null,
  now: Date = new Date(),
): Promise<SuperAnalytics> {
  if (user.role !== "SUPER_ADMIN") throw forbidden();

  const record = await repo.findUserById(user.id);
  if (!record) throw new AppError(401, "UNAUTHORIZED", "برای ادامه وارد حساب کاربری شوید.");
  if (!record.isActive || record.role !== user.role) throw forbidden();

  const province = parseProvince(rawProvince);

  const [coaches, students, competitions, registrations, profiles, recentDates, registrationRows, studentRows, counties] =
    await Promise.all([
      repo.countCoaches(province),
      repo.countStudents(province),
      repo.countCompetitions(province),
      repo.countRegistrations(province),
      repo.countProfilesByStatus(province),
      repo.findRecentRegistrationDates(province, trendSinceBound(TREND_MONTHS, now)),
      repo.countRegistrationsByCounty(province),
      repo.countStudentsByCounty(province),
      repo.findCounties(province),
    ]);

  const countyStats = buildCountyStats(registrationRows, studentRows, counties);

  return {
    province,
    kpis: { students, registrations, coaches, competitions },
    profiles,
    trend: buildTrend(now, recentDates),
    counties: countyStats.counties,
    hiddenCounties: countyStats.hidden,
  };
}
