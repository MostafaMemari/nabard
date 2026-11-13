import type { Province } from "@/generated/client";
import { type ExcelSheetInput, renderWorkbookXlsx } from "@/lib/excel";
import { downloadFilename, downloadResponse } from "@/lib/export";
import { formatJalaliDate, formatNumber, toPersianDigits } from "@/lib/format";
import { renderReportPdf } from "@/lib/pdf/report";
import { provinceLabels } from "@/lib/provinces";
import type { CurrentUser } from "@/lib/session";
import type { SuperAnalytics } from "../types";
import type { AnalyticsRepository } from "./repository";
import { getSuperAnalytics } from "./service";

const PROFILE_STATUS_LABELS = { approved: "تأیید شده", pending: "در انتظار بررسی", rejected: "رد شده" } as const;

export function provinceTitle(province: Province | null): string {
  return province === null ? "همهٔ استان ها" : provinceLabels[province];
}

export function approvalRatePercent(counts: { approved: number; pending: number; rejected: number }): number {
  const total = counts.approved + counts.pending + counts.rejected;
  if (total === 0) return 0;

  return Math.round((counts.approved / total) * 100);
}

function overviewRows(analytics: SuperAnalytics): Array<[string, string]> {
  const { kpis, profiles } = analytics;

  return [
    ["ثبت نام ها", toPersianDigits(formatNumber(kpis.registrations))],
    ["هنرجویان", toPersianDigits(formatNumber(kpis.students))],
    ["مربیان", toPersianDigits(formatNumber(kpis.coaches))],
    ["مسابقات", toPersianDigits(formatNumber(kpis.competitions))],
    ["پروفایل تأییدشده", toPersianDigits(formatNumber(profiles.approved))],
    ["پروفایل در انتظار بررسی", toPersianDigits(formatNumber(profiles.pending))],
    ["پروفایل ردشده", toPersianDigits(formatNumber(profiles.rejected))],
    ["نرخ تأیید پروفایل ها", `${toPersianDigits(approvalRatePercent(profiles))}٪`],
  ];
}

export function analyticsOverviewSheet(analytics: SuperAnalytics): ExcelSheetInput {
  return {
    name: "نمای کلی",
    title: "گزارش آماری سامانه",
    meta: [
      ["دامنه", provinceTitle(analytics.province)],
      ["تاریخ گزارش", formatJalaliDate(new Date())],
    ],
    columns: [
      { header: "شاخص", width: 28 },
      { header: "مقدار", width: 16, align: "center" },
    ],
    rows: overviewRows(analytics),
  };
}

export function analyticsTrendSheet(analytics: SuperAnalytics): ExcelSheetInput {
  return {
    name: "روند ثبت نام",
    title: "روند ثبت نام ها در ۱۲ ماه گذشته",
    columns: [
      { header: "ماه", width: 14 },
      { header: "سال", width: 10, align: "center" },
      { header: "تعداد ثبت نام", width: 16, align: "center" },
    ],
    rows: analytics.trend.map((point) => [point.label, point.year, point.count]),
  };
}

export function analyticsCountiesSheet(analytics: SuperAnalytics): ExcelSheetInput {
  return {
    name: "شهرستان ها",
    title: "مقایسه شهرستان ها بر اساس ثبت نام",
    columns: [
      { header: "شهرستان", width: 22 },
      { header: "استان", width: 18 },
      { header: "ثبت نام", width: 12, align: "center" },
      { header: "هنرجو", width: 12, align: "center" },
    ],
    rows: analytics.counties.map((county) => [county.name, provinceLabels[county.province], county.registrations, county.students]),
  };
}

export async function analyticsXlsxResponse(repo: AnalyticsRepository, user: CurrentUser, province: string | null): Promise<Response> {
  const analytics = await getSuperAnalytics(repo, user, province);
  const buffer = await renderWorkbookXlsx([
    analyticsOverviewSheet(analytics),
    analyticsTrendSheet(analytics),
    analyticsCountiesSheet(analytics),
  ]);

  return downloadResponse(
    new Uint8Array(buffer),
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    downloadFilename("analytics", "گزارش آماری سامانه", "super", "xlsx"),
  );
}

export async function analyticsPdfResponse(repo: AnalyticsRepository, user: CurrentUser, province: string | null): Promise<Response> {
  const analytics = await getSuperAnalytics(repo, user, province);
  const trendTotal = analytics.trend.reduce((sum, point) => sum + point.count, 0);
  const profiles = analytics.profiles;
  const profileTotal = profiles.approved + profiles.pending + profiles.rejected;
  const buffer = await renderReportPdf({
    title: "گزارش آماری سامانه",
    subtitle: provinceTitle(analytics.province),
    footerNote: "سامانهٔ مسابقات تکواندو",
    sections: [
      {
        heading: "نمای کلی",
        meta: [["تاریخ گزارش", formatJalaliDate(new Date())], ...overviewRows(analytics)],
      },
      {
        heading: "روند ثبت نام ها در ۱۲ ماه گذشته",
        meta: [["مجموع", toPersianDigits(formatNumber(trendTotal))]],
        table: {
          columns: [
            { header: "ماه", width: 1 },
            { header: "سال", width: 1, align: "center" },
            { header: "تعداد ثبت نام", width: 1, align: "center" },
          ],
          rows: analytics.trend.map((point) => [point.label, point.year, point.count]),
        },
      },
      {
        heading: "مقایسه شهرستان ها",
        paragraphs:
          analytics.hiddenCounties > 0
            ? [`و ${toPersianDigits(analytics.hiddenCounties)} شهرستان دیگر در نمودار نمایش داده نشده است`]
            : undefined,
        table: {
          columns: [
            { header: "شهرستان", width: 2 },
            { header: "استان", width: 2 },
            { header: "ثبت نام", width: 1, align: "center" },
            { header: "هنرجو", width: 1, align: "center" },
          ],
          rows: analytics.counties.map((county) => [county.name, provinceLabels[county.province], county.registrations, county.students]),
        },
      },
      {
        heading: "نرخ تأیید پروفایل ها",
        meta: [
          ["مجموع پروفایل ها", toPersianDigits(formatNumber(profileTotal))],
          ["نرخ تأیید", `${toPersianDigits(approvalRatePercent(profiles))}٪`],
        ],
        table: {
          columns: [
            { header: "وضعیت", width: 2 },
            { header: "تعداد", width: 1, align: "center" },
          ],
          rows: (["approved", "pending", "rejected"] as const).map((status) => [PROFILE_STATUS_LABELS[status], profiles[status]]),
        },
      },
    ],
  });

  return downloadResponse(new Uint8Array(buffer), "application/pdf", downloadFilename("analytics", "گزارش آماری سامانه", "super", "pdf"));
}
