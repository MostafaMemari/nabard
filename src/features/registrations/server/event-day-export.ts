import { type ExcelSheetInput, renderWorkbookXlsx } from "@/lib/excel";
import { downloadFilename, downloadResponse } from "@/lib/export";
import { formatJalaliDate, toPersianDigits } from "@/lib/format";
import { renderReportPdf } from "@/lib/pdf/report";
import type { CurrentUser } from "@/lib/session";
import type { EventDay } from "../types";
import { getEventDay } from "./event-day";
import type { RegistrationRepository } from "./repository";

const VERDICT_LABELS = {
  MATCH: "همخوان",
  MOVED: "جابجا شده",
  OUT_OF_WEIGHT: "خارج از وزن",
} as const;

const COLUMNS = [
  { header: "ردیف", width: 8, align: "center" as const },
  { header: "نام هنرجو", width: 26 },
  { header: "کد ملی", width: 15, align: "center" as const },
  { header: "مربی", width: 22 },
  { header: "کمربند", width: 14 },
  { header: "رده وزنی", width: 14, align: "center" as const },
  { header: "حضور", width: 10, align: "center" as const },
] as const;

const KYORUGI_COLUMNS = [
  { header: "وزن (کیلوگرم)", width: 14, align: "center" as const },
  { header: "نتیجهٔ توزین", width: 16, align: "center" as const },
] as const;

function summaryMeta(eventDay: EventDay): Array<[string, string]> {
  const { competition, summary } = eventDay;
  const meta: Array<[string, string]> = [
    ["تاریخ برگزاری", formatJalaliDate(new Date(competition.eventDate))],
    ["تعداد شرکت‌کننده", toPersianDigits(summary.approved)],
    ["حاضر", toPersianDigits(summary.checkedIn)],
  ];
  if (competition.discipline === "KYORUGI") {
    meta.push(
      ["توزین‌شده", toPersianDigits(summary.weighed)],
      ["همخوان", toPersianDigits(summary.match)],
      ["جابجا شده", toPersianDigits(summary.moved)],
      ["خارج از وزن", toPersianDigits(summary.outOfWeight)],
    );
  }

  return meta;
}

export function eventDayColumns(kyorugi: boolean) {
  return kyorugi ? [...COLUMNS, ...KYORUGI_COLUMNS] : [...COLUMNS];
}

export function eventDayRows(eventDay: EventDay): Array<Array<string | number | null>> {
  const kyorugi = eventDay.competition.discipline === "KYORUGI";

  return eventDay.rows.map((row, index) => {
    const base: Array<string | number | null> = [
      index + 1,
      row.student.fullName,
      row.student.nationalCode,
      row.coachName,
      row.beltLabel,
      row.weightClassLabel,
      row.checkInAt === null ? "غایب" : "حاضر",
    ];
    if (!kyorugi) return base;

    return [...base, row.weighInKg, row.weighInVerdict === null ? "توزین نشده" : VERDICT_LABELS[row.weighInVerdict]];
  });
}

export async function eventDayXlsxResponse(repo: RegistrationRepository, user: CurrentUser, competitionId: string): Promise<Response> {
  const eventDay = await getEventDay(repo, user, competitionId);
  const sheet: ExcelSheetInput = {
    name: "روز مسابقه",
    title: eventDay.competition.title,
    meta: summaryMeta(eventDay),
    columns: eventDayColumns(eventDay.competition.discipline === "KYORUGI"),
    rows: eventDayRows(eventDay),
  };
  const buffer = await renderWorkbookXlsx([sheet]);

  return downloadResponse(
    new Uint8Array(buffer),
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    downloadFilename("event-day", eventDay.competition.title, competitionId, "xlsx"),
  );
}

export async function eventDayPdfResponse(repo: RegistrationRepository, user: CurrentUser, competitionId: string): Promise<Response> {
  const eventDay = await getEventDay(repo, user, competitionId);
  const kyorugi = eventDay.competition.discipline === "KYORUGI";
  const buffer = await renderReportPdf({
    title: "گزارش روز مسابقه",
    subtitle: eventDay.competition.title,
    footerNote: "سامانهٔ مسابقات تکواندو",
    sections: [
      {
        meta: summaryMeta(eventDay),
        table: { columns: eventDayColumns(kyorugi), rows: eventDayRows(eventDay) },
      },
    ],
  });

  return downloadResponse(
    new Uint8Array(buffer),
    "application/pdf",
    downloadFilename("event-day", eventDay.competition.title, competitionId, "pdf"),
  );
}
