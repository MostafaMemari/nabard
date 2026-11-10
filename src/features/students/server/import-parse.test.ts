import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import { AppError } from "@/lib/api";
import { beltKey, parseStudentsWorkbook } from "./import-parse";

type Cell = string | number | Date | null;

async function workbookOf(rows: Cell[][]): Promise<ArrayBuffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("هنرجویان");
  for (const row of rows) sheet.addRow(row);
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer as ArrayBuffer;
}

const HEADER = ["نام و نام خانوادگی", "کد ملی", "تلفن همراه", "تاریخ تولد", "کمربند", "تاریخ حکم کمربند"];

async function parseOf(rows: Cell[][]) {
  return parseStudentsWorkbook(await workbookOf(rows));
}

describe("parseStudentsWorkbook", () => {
  it("parses a filled template with a jalali birth date", async () => {
    const parsed = await parseOf([HEADER, ["علی رضایی", "0012345678", "09121234567", "1380/05/12", "آبی", "1398/02/10"]]);

    expect(parsed.errors).toEqual([]);
    expect(parsed.rows).toHaveLength(1);
    expect(parsed.rows[0]).toMatchObject({
      row: 2,
      fullName: "علی رضایی",
      nationalCode: "0012345678",
      mobile: "09121234567",
      birthDate: "2001-08-03",
      beltLabel: "آبی",
      beltCertificateDate: "2019-04-30",
    });
  });

  it("parses persian digits, dash separators and single-digit month/day", async () => {
    const parsed = await parseOf([HEADER, ["علی رضایی", "0012345678", "09121234567", "۱۳۸۰-۵-۱۲", "آبی", null]]);

    expect(parsed.errors).toEqual([]);
    expect(parsed.rows[0]?.birthDate).toBe("2001-08-03");
    expect(parsed.rows[0]?.beltCertificateDate).toBeNull();
  });

  it("reads a gregorian excel date cell as-is", async () => {
    const parsed = await parseOf([HEADER, ["علی رضایی", 1234567890, 9123456789, new Date(2010, 4, 20), "آبی", null]]);

    expect(parsed.errors).toEqual([]);
    expect(parsed.rows[0]).toMatchObject({
      nationalCode: "1234567890",
      mobile: "09123456789",
      birthDate: "2010-05-20",
    });
  });

  it("pads a leading-zero national code that excel stored as a number", async () => {
    const parsed = await parseOf([HEADER, ["علی رضایی", 12345678, "09121234567", "1380/05/12", "آبی", null]]);

    expect(parsed.errors).toEqual([]);
    expect(parsed.rows[0]?.nationalCode).toBe("0012345678");
  });

  it("finds the header row when it is not the first row", async () => {
    const parsed = await parseOf([[], HEADER, ["علی رضایی", "0012345678", "09121234567", "1380/05/12", "آبی", null]]);

    expect(parsed.errors).toEqual([]);
    expect(parsed.rows[0]?.row).toBe(3);
  });

  it("skips empty trailing rows and reports per-row errors with the sheet row number", async () => {
    const parsed = await parseOf([
      HEADER,
      ["علی رضایی", "0012345678", "09121234567", "1380/05/12", "آبی", null],
      [],
      ["ب", "123", "9123456", "1380/13/40", "", null],
      [],
    ]);

    expect(parsed.rows).toHaveLength(1);
    expect(parsed.errors.length).toBeGreaterThan(0);
    expect(parsed.errors.every((error) => error.row === 4)).toBe(true);
    expect(parsed.errors.some((error) => error.message.includes("نام و نام خانوادگی"))).toBe(true);
  });

  it("rejects an invalid optional date but keeps it out of the parsed rows", async () => {
    const parsed = await parseOf([HEADER, ["علی رضایی", "0012345678", "09121234567", "1380/05/12", "آبی", "۱۴۰۰/۱۴/۰۱"]]);

    expect(parsed.rows).toHaveLength(0);
    expect(parsed.errors).toEqual([{ row: 2, message: "تاریخ حکم کمربند معتبر نیست؛ تاریخ را شمسی مثل ۱۳۸۰/۰۵/۱۲ وارد کنید." }]);
  });

  it("throws when the template headers are missing", async () => {
    await expect(
      parseOf([
        ["نام", "کد"],
        ["علی", "1"],
      ]),
    ).rejects.toMatchObject({ code: "INVALID_EXCEL" });
    await expect(parseOf([HEADER.slice(0, 3)])).rejects.toBeInstanceOf(AppError);
  });
});

describe("beltKey", () => {
  it("normalizes persian digits and spaces for belt matching", () => {
    expect(beltKey("پوم ۱")).toBe(beltKey("پوم 1"));
    expect(beltKey("دان ۲")).toBe(beltKey("دان2"));
  });
});
