import ExcelJS from "exceljs";
import { describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/api";
import type { CurrentUser } from "@/lib/session";
import { importStudents } from "./import-service";
import type { StudentRepository, UserIdentityRecord } from "./repository";

const coachUser: CurrentUser = { id: "coach-1", role: "COACH" };
const adminUser: CurrentUser = { id: "admin-1", role: "ADMIN" };

const coachRecord: UserIdentityRecord = { id: "coach-1", role: "COACH", gender: "MALE", province: "TEHRAN", isActive: true };
const adminRecord: UserIdentityRecord = { id: "admin-1", role: "ADMIN", gender: null, province: "TEHRAN", isActive: true };
const tehranCoach: UserIdentityRecord = { id: "coach-2", role: "COACH", gender: "MALE", province: "TEHRAN", isActive: true };
const farsCoach: UserIdentityRecord = { id: "coach-3", role: "COACH", gender: "MALE", province: "FARS", isActive: true };
const inactiveCoach: UserIdentityRecord = { ...tehranCoach, isActive: false };
const genderlessCoach: UserIdentityRecord = { ...tehranCoach, gender: null };

const HEADER = ["نام و نام خانوادگی", "کد ملی", "تلفن همراه", "تاریخ تولد", "کمربند"];

async function importFile(rows: string[][]): Promise<File> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("هنرجویان");
  for (const row of rows) sheet.addRow(row);
  const buffer = (await workbook.xlsx.writeBuffer()) as ArrayBuffer;
  return new File([buffer], "students.xlsx");
}

function repoWith(overrides: Partial<StudentRepository> = {}): StudentRepository {
  return {
    findUserById: vi.fn(async (id: string) =>
      id === "admin-1"
        ? adminRecord
        : id === "coach-1"
          ? coachRecord
          : id === "coach-2"
            ? tehranCoach
            : id === "coach-3"
              ? farsCoach
              : null,
    ),
    findActiveBelts: vi.fn(async () => [
      { id: "belt-white", label: "سفید" },
      { id: "belt-blue", label: "آبی" },
    ]),
    findExistingNationalCodes: vi.fn(async () => new Set<string>()),
    findRequestNationalCodes: vi.fn(async () => new Set<string>()),
    createRegistrationRequests: vi.fn(async () => 2),
    ...overrides,
  } as unknown as StudentRepository;
}

function failureOf(promise: Promise<unknown>): Promise<unknown> {
  return promise.catch((error: unknown) => error);
}

const ROW = ["علی رضایی", "0012345678", "09121234567", "1380/05/12", "آبی"];

describe("importStudents authorization", () => {
  it("lets a coach import into their own club and stores the coach gender", async () => {
    const repo = repoWith();
    const result = await importStudents(repo, coachUser, "coach-1", await importFile([HEADER, ROW]));

    expect(result).toEqual({ imported: 2, errors: [] });
    expect(repo.createRegistrationRequests).toHaveBeenCalledWith([
      expect.objectContaining({
        fullName: "علی رضایی",
        nationalCode: "0012345678",
        gender: "MALE",
        coachId: "coach-1",
        beltId: "belt-blue",
        mobile: "09121234567",
        birthDate: new Date("2001-08-03T00:00:00"),
      }),
    ]);
  });

  it("forbids a coach importing into another club", async () => {
    const error = await failureOf(importStudents(repoWith(), coachUser, "coach-2", await importFile([HEADER, ROW])));
    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).status).toBe(403);
  });

  it("lets an admin import for a coach of their own province", async () => {
    const repo = repoWith();
    const result = await importStudents(repo, adminUser, "coach-2", await importFile([HEADER, ROW]));

    expect(result.imported).toBe(2);
    expect(repo.createRegistrationRequests).toHaveBeenCalledWith([expect.objectContaining({ coachId: "coach-2", gender: "MALE" })]);
  });

  it("hides coaches of other provinces from admins", async () => {
    const error = await failureOf(importStudents(repoWith(), adminUser, "coach-3", await importFile([HEADER, ROW])));
    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).status).toBe(404);
  });

  it("rejects an inactive or genderless target coach", async () => {
    const inactive = repoWith({ findUserById: vi.fn(async (id: string) => (id === "admin-1" ? adminRecord : inactiveCoach)) });
    const inactiveError = await failureOf(importStudents(inactive, adminUser, "coach-2", await importFile([HEADER, ROW])));
    expect((inactiveError as AppError).status).toBe(400);

    const genderless = repoWith({ findUserById: vi.fn(async (id: string) => (id === "admin-1" ? adminRecord : genderlessCoach)) });
    const genderError = await failureOf(importStudents(genderless, adminUser, "coach-2", await importFile([HEADER, ROW])));
    expect((genderError as AppError).status).toBe(400);
  });

  it("asks a genderless coach to contact the admin", async () => {
    const repo = repoWith({ findUserById: vi.fn(async (id: string) => (id === "coach-1" ? genderlessCoach : adminRecord)) });
    const error = await failureOf(importStudents(repo, coachUser, "coach-1", await importFile([HEADER, ROW])));

    expect((error as AppError).status).toBe(400);
    expect((error as AppError).message).toContain("جنسیت");
  });
});

describe("importStudents validation", () => {
  it("imports nothing and reports errors when a duplicate national code is already registered", async () => {
    const repo = repoWith({ findExistingNationalCodes: vi.fn(async () => new Set(["0012345678"])) });
    const result = await importStudents(repo, coachUser, "coach-1", await importFile([HEADER, ROW]));

    expect(result.imported).toBe(0);
    expect(result.errors).toEqual([{ row: 2, message: "هنرجوی تأیید شده ای با این کد ملی وجود دارد" }]);
    expect(repo.createRegistrationRequests).not.toHaveBeenCalled();
  });

  it("reports a duplicate national code inside the file once per row", async () => {
    const repo = repoWith();
    const result = await importStudents(repo, coachUser, "coach-1", await importFile([HEADER, ROW, ROW]));

    expect(result.imported).toBe(0);
    expect(result.errors).toEqual([{ row: 3, message: "کد ملی در فایل تکراری است" }]);
  });

  it("rejects unknown belt labels without creating students", async () => {
    const repo = repoWith();
    const result = await importStudents(repo, coachUser, "coach-1", await importFile([HEADER, [ROW[0], ROW[1], ROW[2], ROW[3], "بنفش"]]));

    expect(result.imported).toBe(0);
    expect(result.errors[0]?.message).toContain("بنفش");
    expect(repo.createRegistrationRequests).not.toHaveBeenCalled();
  });

  it("matches belts ignoring persian digits and spaces", async () => {
    const repo = repoWith();
    const result = await importStudents(repo, coachUser, "coach-1", await importFile([HEADER, [ROW[0], ROW[1], ROW[2], ROW[3], "آبی"]]));

    expect(result.imported).toBe(2);
  });

  it("throws on a file without any data row", async () => {
    const error = await failureOf(importStudents(repoWith(), coachUser, "coach-1", await importFile([HEADER])));
    expect((error as AppError).status).toBe(400);
    expect((error as AppError).message).toContain("هیچ هنرجویی");
  });
});
