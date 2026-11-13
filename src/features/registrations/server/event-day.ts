import { type AuditRepository, auditActions, auditEntityTypes } from "@/features/audit";
import type { WeightClass } from "@/features/base-data";
import type { CompetitionRulesSnapshot } from "@/features/competitions";
import { AppError } from "@/lib/api";
import type { CurrentUser } from "@/lib/session";
import { resolveWeightClass, type WeightClassResolution } from "./eligibility";
import type { EventDayRegistrationDetailRow, EventDayRegistrationRow, RegistrationRepository, UserIdentityRecord } from "./repository";

export type EventDayCompetition = {
  id: string;
  title: string;
  status: string;
  discipline: string;
  eventDate: string;
  registrationDeadline: string;
};

export type EventDayRow = {
  id: string;
  student: { id: string; fullName: string; nationalCode: string };
  coachName: string;
  beltLabel: string;
  weightClassId: string | null;
  weightClassLabel: string | null;
  checkInAt: string | null;
  checkInByName: string | null;
  weighInKg: number | null;
  weighInAt: string | null;
  weighInByName: string | null;
  weighInVerdict: "MATCH" | "MOVED" | "OUT_OF_WEIGHT" | null;
};

export type EventDayRowPatch = {
  id: string;
  weightClassId?: string | null;
  weightClassLabel?: string | null;
  checkInAt?: string | null;
  weighInKg?: number | null;
  weighInAt?: string | null;
  weighInVerdict?: "MATCH" | "MOVED" | "OUT_OF_WEIGHT" | null;
};

export type EventDaySummary = {
  approved: number;
  checkedIn: number;
  weighed: number;
  match: number;
  moved: number;
  outOfWeight: number;
};

export type EventDay = {
  competition: EventDayCompetition;
  summary: EventDaySummary;
  rows: EventDayRow[];
};

function forbidden(): AppError {
  return new AppError(403, "FORBIDDEN", "شما به این بخش دسترسی ندارید");
}

function registrationNotFound(): AppError {
  return new AppError(404, "NOT_FOUND", "ثبت نام یافت نشد");
}

async function requireActiveAdmin(repo: RegistrationRepository, user: CurrentUser): Promise<UserIdentityRecord> {
  const record = await repo.findUserById(user.id);
  if (!record) throw new AppError(401, "UNAUTHORIZED", "برای ادامه وارد حساب کاربری شوید");
  if (!record.isActive || record.role !== user.role) throw forbidden();

  return record;
}

function toEventDayRow(row: EventDayRegistrationRow): EventDayRow {
  return {
    id: row.id,
    student: row.student,
    coachName: row.coachName,
    beltLabel: row.beltLabel,
    weightClassId: row.weightClassId,
    weightClassLabel: row.weightClassLabel,
    checkInAt: row.checkInAt === null ? null : row.checkInAt.toISOString(),
    checkInByName: row.checkInByName,
    weighInKg: row.weighInKg,
    weighInAt: row.weighInAt === null ? null : row.weighInAt.toISOString(),
    weighInByName: row.weighInByName,
    weighInVerdict: row.weighInVerdict,
  };
}

function summarize(rows: EventDayRow[]): EventDaySummary {
  const summary: EventDaySummary = { approved: rows.length, checkedIn: 0, weighed: 0, match: 0, moved: 0, outOfWeight: 0 };

  for (const row of rows) {
    if (row.checkInAt !== null) summary.checkedIn += 1;
    if (row.weighInVerdict === null) continue;

    summary.weighed += 1;
    if (row.weighInVerdict === "MATCH") summary.match += 1;
    if (row.weighInVerdict === "MOVED") summary.moved += 1;
    if (row.weighInVerdict === "OUT_OF_WEIGHT") summary.outOfWeight += 1;
  }

  return summary;
}

export async function getEventDay(repo: RegistrationRepository, user: CurrentUser, competitionId: string): Promise<EventDay> {
  const identity = await requireActiveAdmin(repo, user);
  if (identity.role === "COACH") throw forbidden();

  const competition = await repo.findCompetitionById(competitionId);
  if (!competition || (identity.role === "ADMIN" && competition.province !== identity.province)) {
    throw new AppError(404, "NOT_FOUND", "مسابقه یافت نشد");
  }

  const rows = await repo.findEventDayRows(competitionId);

  return {
    competition: {
      id: competition.id,
      title: competition.title,
      status: competition.status,
      discipline: competition.discipline,
      eventDate: competition.eventDate.toISOString(),
      registrationDeadline: competition.registrationDeadline.toISOString(),
    },
    summary: summarize(rows.map(toEventDayRow)),
    rows: rows.map(toEventDayRow),
  };
}

function snapshotWeightClasses(rules: CompetitionRulesSnapshot): WeightClass[] {
  return rules.weightClasses.map((weightClass) => ({
    id: weightClass.id,
    ageCategoryId: rules.ageCategory.id,
    gender: "MALE",
    label: weightClass.label,
    minWeightKg: weightClass.min,
    maxWeightKg: weightClass.max,
    order: weightClass.order,
    excludeMin: weightClass.excludeMin,
    excludeMax: weightClass.excludeMax,
    isActive: true,
  }));
}

async function requirePublishedApprovedRegistration(
  repo: RegistrationRepository,
  identity: UserIdentityRecord,
  id: string,
  notApprovedMessage: string,
): Promise<EventDayRegistrationDetailRow> {
  const row = await repo.findEventDayRegistrationById(id);
  if (!row || row.coachProvince !== identity.province) throw registrationNotFound();

  if (row.competition.status !== "PUBLISHED") {
    throw new AppError(409, "CONFLICT", "این مسابقه فعال نیست");
  }

  if (row.status !== "APPROVED") {
    throw new AppError(409, "CONFLICT", notApprovedMessage);
  }

  return row;
}

function weighVerdict(
  resolution: WeightClassResolution,
  currentClassId: string | null,
): { verdict: "MATCH" | "MOVED" | "OUT_OF_WEIGHT"; movedTo: { id: string; label: string; min: number; max: number | null } | null } {
  if (resolution.kind === "none" || resolution.kind === "ambiguous") {
    return { verdict: "OUT_OF_WEIGHT", movedTo: null };
  }

  return resolution.weightClass.id === currentClassId
    ? { verdict: "MATCH", movedTo: null }
    : {
        verdict: "MOVED",
        movedTo: {
          id: resolution.weightClass.id,
          label: resolution.weightClass.label,
          min: resolution.weightClass.minWeightKg,
          max: resolution.weightClass.maxWeightKg,
        },
      };
}

export async function weighInRegistration(
  repo: RegistrationRepository,
  audit: AuditRepository,
  user: CurrentUser,
  id: string,
  weightKg: number,
): Promise<EventDayRowPatch> {
  const identity = await requireActiveAdmin(repo, user);
  if (identity.role !== "ADMIN") throw forbidden();

  const row = await requirePublishedApprovedRegistration(repo, identity, id, "فقط ثبت نام های تأیید شده قابل توزین هستند");
  if (row.competition.discipline !== "KYORUGI") {
    throw new AppError(409, "CONFLICT", "مسابقات پومسه وزن کشی ندارند");
  }

  const rules = row.competition.rules;
  if (!rules) {
    throw new AppError(409, "CONFLICT", "قواعد وزنی این مسابقه در دسترس نیست");
  }

  const resolution = resolveWeightClass(weightKg, snapshotWeightClasses(rules));
  if (resolution.kind === "ambiguous") {
    throw new AppError(409, "CONFLICT", "وزن ثبت شده با بیش از یک رده وزنی همخوانی دارد");
  }

  const { verdict, movedTo } = weighVerdict(resolution, row.weightClassId);
  const weighInAt = new Date();

  const applied = await repo.updateRegistrationWeighIn(id, {
    weightKg,
    weighInById: user.id,
    weighInAt,
    verdict,
    movedTo,
  });
  if (!applied) {
    throw new AppError(409, "CONFLICT", "این ثبت نام دیگر قابل توزین نیست");
  }

  await audit.createAuditLog({
    actorId: user.id,
    action: auditActions.registrationWeighed,
    entityType: auditEntityTypes.registration,
    entityId: id,
    details: { weightKg, verdict, from: row.weightClassLabel, to: movedTo?.label ?? null },
  });

  return {
    id,
    weightClassId: movedTo?.id ?? row.weightClassId,
    weightClassLabel: movedTo?.label ?? row.weightClassLabel,
    weighInKg: weightKg,
    weighInAt: weighInAt.toISOString(),
    weighInVerdict: verdict,
  };
}

export async function setRegistrationCheckIn(
  repo: RegistrationRepository,
  user: CurrentUser,
  id: string,
  checkedIn: boolean,
): Promise<EventDayRowPatch> {
  const identity = await requireActiveAdmin(repo, user);
  if (identity.role !== "ADMIN") throw forbidden();

  await requirePublishedApprovedRegistration(repo, identity, id, "فقط ثبت نام های تأیید شده قابل ثبت حضور هستند");

  const applied = await repo.updateRegistrationCheckIn(id, checkedIn, user.id);
  if (!applied) {
    throw new AppError(409, "CONFLICT", "این ثبت نام دیگر قابل ثبت حضور نیست");
  }

  return { id, checkInAt: checkedIn ? new Date().toISOString() : null };
}
