import { beltLabel } from "@/features/base-data/labels";
import { formatJalaliDate } from "@/lib/format";
import type { CurrentUser } from "@/lib/session";
import type { RegistrationRepository } from "./repository";
import type { ParticipantRecord } from "./service";
import { listParticipants } from "./service";

const BOM = "\uFEFF";
const LINE_SEPARATOR = "\r\n";

const HEADER = ["نام و نام خانوادگی", "کد ملی", "تاریخ تولد", "کمربند", "رده وزنی", "نام مربی"];

const FORMULA_PREFIX = /^[=+@-]/;
const UNSAFE_FILENAME_CHARS = [/[/\\:*?"<>|]/g, /[\p{Cc}]/gu, /^[.\s-]+|[.\s-]+$/g];

export function csvCell(value: string): string {
  const neutralized = FORMULA_PREFIX.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(neutralized) ? `"${neutralized.replaceAll('"', '""')}"` : neutralized;
}

function participantCells(participant: ParticipantRecord): string[] {
  return [
    participant.fullName,
    participant.nationalCode,
    formatJalaliDate(participant.birthDate),
    beltLabel(participant.beltName),
    participant.weightClassLabel ?? "",
    participant.coachName,
  ];
}

export function toParticipantsCsv(participants: ParticipantRecord[]): string {
  const lines = [HEADER, ...participants.map(participantCells)];
  return BOM + lines.map((cells) => cells.map(csvCell).join(",")).join(LINE_SEPARATOR) + LINE_SEPARATOR;
}

export function participantsCsvFilename(title: string, competitionId: string): { ascii: string; utf8: string } {
  let clean = title;
  for (const pattern of UNSAFE_FILENAME_CHARS) {
    clean = clean.replace(pattern, " ");
  }

  clean = clean
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60)
    .replace(/[-.\s]+$/, "");
  return { ascii: `participants-${competitionId}.csv`, utf8: `participants-${clean || competitionId}.csv` };
}

export async function participantsCsvResponse(repo: RegistrationRepository, user: CurrentUser, competitionId: string): Promise<Response> {
  const participants = await listParticipants(repo, user, competitionId);
  const title = await repo.findCompetitionTitleById(competitionId);
  const filename = participantsCsvFilename(title ?? "", competitionId);

  return new Response(toParticipantsCsv(participants), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${filename.ascii}"; filename*=UTF-8''${encodeURIComponent(filename.utf8)}`,
      "cache-control": "private, no-store",
    },
  });
}
