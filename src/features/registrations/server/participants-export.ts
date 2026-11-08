import { type ExcelSheetInput, renderWorkbookXlsx } from "@/lib/excel";
import { downloadFilename, downloadResponse } from "@/lib/export";
import { formatJalaliDate, toPersianDigits } from "@/lib/format";
import { renderReportPdf } from "@/lib/pdf/report";
import type { CurrentUser } from "@/lib/session";
import type { RegistrationRepository } from "./repository";
import { listParticipants, type ParticipantRecord } from "./service";

const SHEET_NAME = "شرکت‌کنندگان";
const COLUMNS = [
  { header: "ردیف", width: 8, align: "center" as const },
  { header: "نام و نام خانوادگی", width: 26 },
  { header: "کد ملی", width: 15, align: "center" as const },
  { header: "تاریخ تولد", width: 14, align: "center" as const },
  { header: "کمربند", width: 14 },
  { header: "رده وزنی", width: 14, align: "center" as const },
  { header: "مربی", width: 22 },
];

function participantRows(participants: ParticipantRecord[]): Array<Array<string | number | null>> {
  return participants.map((participant, index) => [
    index + 1,
    participant.fullName,
    participant.nationalCode,
    formatJalaliDate(participant.birthDate),
    participant.beltLabel,
    participant.weightClassLabel,
    participant.coachName,
  ]);
}

async function participantReport(repo: RegistrationRepository, user: CurrentUser, competitionId: string) {
  const participants = await listParticipants(repo, user, competitionId);
  const competition = await repo.findCompetitionById(competitionId);
  return { participants, competition, rows: participantRows(participants) };
}

export async function participantsXlsxResponse(repo: RegistrationRepository, user: CurrentUser, competitionId: string): Promise<Response> {
  const { competition, rows } = await participantReport(repo, user, competitionId);
  const sheet: ExcelSheetInput = {
    name: SHEET_NAME,
    title: competition?.title ?? SHEET_NAME,
    meta: competition ? [["تاریخ برگزاری", formatJalaliDate(competition.eventDate)]] : undefined,
    columns: COLUMNS,
    rows,
  };
  const buffer = await renderWorkbookXlsx([sheet]);
  const title = await repo.findCompetitionTitleById(competitionId);

  return downloadResponse(
    new Uint8Array(buffer),
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    downloadFilename("participants", title ?? "", competitionId, "xlsx"),
  );
}

export async function participantsPdfResponse(repo: RegistrationRepository, user: CurrentUser, competitionId: string): Promise<Response> {
  const { competition, rows } = await participantReport(repo, user, competitionId);
  const buffer = await renderReportPdf({
    title: "فهرست شرکت‌کنندگان تأییدشده",
    subtitle: competition?.title,
    footerNote: "سامانهٔ مسابقات تکواندو",
    sections: [
      {
        meta: competition
          ? [
              ["تاریخ برگزاری", formatJalaliDate(competition.eventDate)],
              ["تعداد شرکت‌کننده", toPersianDigits(rows.length)],
            ]
          : [["تعداد شرکت‌کننده", toPersianDigits(rows.length)]],
        table: { columns: COLUMNS, rows },
      },
    ],
  });
  const title = await repo.findCompetitionTitleById(competitionId);

  return downloadResponse(new Uint8Array(buffer), "application/pdf", downloadFilename("participants", title ?? "", competitionId, "pdf"));
}
