import ExcelJS from "exceljs";
import { describe, expect, it, vi } from "vitest";
import type { CurrentUser } from "@/lib/session";
import type { EventDay } from "../types";
import { eventDayColumns, eventDayRows } from "./event-day-export";
import { participantsXlsxResponse } from "./participants-export";
import type { ParticipantRow, RegistrationRepository } from "./repository";

const admin: CurrentUser = { id: "admin-1", role: "ADMIN" };

const participantRows: ParticipantRow[] = [
  {
    id: "reg-1",
    student: {
      id: "student-1",
      fullName: "علی رضایی",
      nationalCode: "0012345678",
      birthDate: new Date("2012-05-20T00:00:00.000Z"),
      beltLabel: "سبز",
    },
    coachName: "رضا کریمی",
    weightClass: { order: 1 },
    weightClassLabel: "-54",
  },
  {
    id: "reg-2",
    student: {
      id: "student-2",
      fullName: "حسین محمدی",
      nationalCode: "0098765432",
      birthDate: new Date("2011-01-15T00:00:00.000Z"),
      beltLabel: "آبی",
    },
    coachName: "رضا کریمی",
    weightClass: null,
    weightClassLabel: null,
  },
];

function repoWith(rows: ParticipantRow[]): RegistrationRepository {
  return {
    findUserById: vi.fn().mockResolvedValue({
      id: "admin-1",
      role: "ADMIN",
      province: "TEHRAN",
      isActive: true,
      countyId: null,
      gender: null,
    }),
    findCompetitionTitleById: vi.fn().mockResolvedValue("مسابقه قهرمانی استان"),
    findCompetitionById: vi.fn().mockResolvedValue({
      id: "comp-1",
      title: "مسابقه قهرمانی استان",
      province: "TEHRAN",
      level: "PROVINCIAL",
      countyIds: [],
      status: "PUBLISHED",
      discipline: "KYORUGI",
      gender: "MALE",
      ageCategoryId: "cadet",
      minBeltId: "b-yellow",
      maxBeltId: "b-blue",
      rules: null,
      feePerStudent: BigInt(2500000),
      registrationDeadline: new Date("2026-11-01T00:00:00.000Z"),
      eventDate: new Date("2026-11-10T00:00:00.000Z"),
      createdAt: new Date("2026-10-01T00:00:00.000Z"),
    }),
    findApprovedParticipants: vi.fn().mockResolvedValue(rows),
  } as unknown as RegistrationRepository;
}

function eventDayFixture(): EventDay {
  return {
    competition: {
      id: "comp-1",
      title: "مسابقه قهرمانی استان",
      status: "PUBLISHED",
      discipline: "KYORUGI",
      eventDate: "2026-11-10T00:00:00.000Z",
      registrationDeadline: "2026-11-01T00:00:00.000Z",
    },
    summary: { approved: 3, checkedIn: 2, weighed: 2, match: 1, moved: 1, outOfWeight: 0 },
    rows: [
      {
        id: "reg-1",
        student: { id: "s1", fullName: "علی رضایی", nationalCode: "0012345678" },
        coachName: "رضا کریمی",
        beltLabel: "سبز",
        weightClassId: "wc-1",
        weightClassLabel: "-54",
        checkInAt: "2026-11-10T06:00:00.000Z",
        checkInByName: "ادمین",
        weighInKg: 53.8,
        weighInAt: "2026-11-10T06:30:00.000Z",
        weighInByName: "ادمین",
        weighInVerdict: "MATCH",
      },
      {
        id: "reg-2",
        student: { id: "s2", fullName: "حسین محمدی", nationalCode: "0098765432" },
        coachName: "رضا کریمی",
        beltLabel: "آبی",
        weightClassId: "wc-2",
        weightClassLabel: "+68",
        checkInAt: null,
        checkInByName: null,
        weighInKg: null,
        weighInAt: null,
        weighInByName: null,
        weighInVerdict: null,
      },
    ],
  };
}

describe("eventDayColumns", () => {
  it("adds weigh-in columns only for kyorugi", () => {
    expect(eventDayColumns(true).map((column) => column.header)).toContain("نتیجهٔ توزین");
    expect(eventDayColumns(false).map((column) => column.header)).not.toContain("نتیجهٔ توزین");
  });
});

describe("eventDayRows", () => {
  it("maps presence and verdict labels", () => {
    const rows = eventDayRows(eventDayFixture());

    expect(rows).toHaveLength(2);
    expect(rows[0]).toContain("حاضر");
    expect(rows[0]).toContain("همخوان");
    expect(rows[0]).toContain(53.8);
    expect(rows[1]).toContain("غایب");
    expect(rows[1]).toContain("توزین نشده");
  });

  it("omits weigh-in columns for non-kyorugi", () => {
    const eventDay = { ...eventDayFixture(), competition: { ...eventDayFixture().competition, discipline: "POOMSAE" as const } };
    const rows = eventDayRows(eventDay);

    expect(rows[0]).not.toContain("همخوان");
    expect(rows[0]).toHaveLength(eventDayColumns(false).length);
  });
});

describe("participantsXlsxResponse", () => {
  it("returns a valid xlsx workbook with participants", async () => {
    const response = await participantsXlsxResponse(repoWith(participantRows), admin, "comp-1");

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    expect(response.headers.get("content-disposition")).toContain("participants-comp-1.xlsx");

    const buffer = Buffer.from(await response.arrayBuffer());
    expect(buffer.subarray(0, 2).toString()).toBe("PK");

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);
    const sheet = workbook.worksheets[0];
    expect(sheet.name).toBe("شرکت کنندگان");
    expect(sheet.getRow(1).getCell(1).value).toBe("مسابقه قهرمانی استان");

    const headerRowIndex = 5;
    expect(sheet.getRow(headerRowIndex).getCell(2).value).toBe("نام و نام خانوادگی");
    expect(sheet.getRow(headerRowIndex + 1).getCell(2).value).toBe("علی رضایی");
    expect(sheet.getRow(headerRowIndex + 1).getCell(6).value).toBe("-54");
    expect(sheet.getRow(headerRowIndex + 2).getCell(6).value).toBeNull();
  });

  it("keeps formula-like text cells inert", async () => {
    const hostile: ParticipantRow[] = [{ ...participantRows[0], student: { ...participantRows[0].student, fullName: "=SUM(A1:A2)" } }];
    const response = await participantsXlsxResponse(repoWith(hostile), admin, "comp-1");
    const buffer = Buffer.from(await response.arrayBuffer());

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);
    const sheet = workbook.worksheets[0];
    const cell = sheet.getRow(6).getCell(2).value as { richText: Array<{ text: string }> };
    expect(cell.richText.map((run) => run.text).join("")).toBe("=SUM(A1:A2)");
  });
});
