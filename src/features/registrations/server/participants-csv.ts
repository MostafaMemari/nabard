import { downloadFilename, downloadResponse } from "@/lib/export";
import { formatJalaliDate } from "@/lib/format";
import type { CurrentUser } from "@/lib/session";
import type { RegistrationRepository } from "./repository";
import type { ParticipantRecord } from "./service";
import { listParticipants } from "./service";

const BOM = "\uFEFF";
const LINE_SEPARATOR = "\r\n";

const HEADER = ["نام و نام خانوادگی", "کد ملی", "تاریخ تولد", "کمربند", "رده وزنی", "نام مربی"];

const FORMULA_PREFIX = /^[=+@-]/;
const UNICODE_MINUS = "\u2212";

export function csvBaseCell(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

export function csvCell(value: string): string {
  return csvBaseCell(FORMULA_PREFIX.test(value) ? `'${value}` : value);
}

export function weightClassCell(label: string | null): string {
  if (label === null) return "";
  return label.startsWith("-") ? `${UNICODE_MINUS}${label.slice(1)}` : label;
}

function participantCells(participant: ParticipantRecord): string[] {
  return [
    csvCell(participant.fullName),
    csvCell(participant.nationalCode),
    csvCell(formatJalaliDate(participant.birthDate)),
    csvBaseCell(participant.beltLabel),
    csvBaseCell(weightClassCell(participant.weightClassLabel)),
    csvCell(participant.coachName),
  ];
}

export function toParticipantsCsv(participants: ParticipantRecord[]): string {
  const lines = [HEADER.map(csvCell), ...participants.map(participantCells)];
  return BOM + lines.map((cells) => cells.join(",")).join(LINE_SEPARATOR) + LINE_SEPARATOR;
}

export function participantsCsvFilename(title: string, competitionId: string): { ascii: string; utf8: string } {
  return downloadFilename("participants", title, competitionId, "csv");
}

export async function participantsCsvResponse(repo: RegistrationRepository, user: CurrentUser, competitionId: string): Promise<Response> {
  const participants = await listParticipants(repo, user, competitionId);
  const title = await repo.findCompetitionTitleById(competitionId);
  const filename = participantsCsvFilename(title ?? "", competitionId);

  return downloadResponse(toParticipantsCsv(participants), "text/csv; charset=utf-8", filename);
}
