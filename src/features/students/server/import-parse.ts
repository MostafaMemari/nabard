import ExcelJS from "exceljs";
import { getDaysInMonth, newDate } from "date-fns-jalali";
import { AppError } from "@/lib/api";

export const STUDENT_IMPORT_MAX_ROWS = 100;

export type StudentImportRowError = { row: number; message: string };

export type ParsedStudentRow = {
  row: number;
  fullName: string;
  nationalCode: string;
  mobile: string;
  birthDate: string;
  beltLabel: string;
  beltCertificateDate: string | null;
  insuranceDate: string | null;
  tkdBankChargeDate: string | null;
};

export type ParsedWorkbook = { rows: ParsedStudentRow[]; errors: StudentImportRowError[] };

const HEADERS = {
  fullName: "نام و نام خانوادگی",
  nationalCode: "کد ملی",
  mobile: "تلفن همراه",
  birthDate: "تاریخ تولد",
  beltLabel: "کمربند",
  beltCertificateDate: "تاریخ حکم کمربند",
  insuranceDate: "تاریخ بیمه ورزشی",
  tkdBankChargeDate: "تاریخ شارژ بانک تکواندو",
} as const;

type HeaderKey = keyof typeof HEADERS;

function collapseSpace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeAsciiDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
}

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

function cellText(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return "";
  if (typeof value === "object") {
    if ("richText" in value) return value.richText.map((part) => part.text).join("");
    if ("result" in value) return cellText((value as { result: ExcelJS.CellValue }).result);
    if ("text" in value) return String(value.text);
    return "";
  }
  return String(value);
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function isoFromExcelDate(value: Date): string | null {
  const year = value.getFullYear();
  if (year < 1900 || year > 2100) return null;
  return `${year}-${pad2(value.getMonth() + 1)}-${pad2(value.getDate())}`;
}

function parseJalaliOrIsoText(text: string): string | null {
  const normalized = normalizeAsciiDigits(text);

  const jalali = normalized.match(/^(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})$/);
  if (jalali) {
    const [year, month, day] = [Number(jalali[1]), Number(jalali[2]), Number(jalali[3])];
    if (year < 1300 || year > 1500 || month < 1 || month > 12 || day < 1) return null;
    const last = getDaysInMonth(newDate(year, month - 1, 1));
    if (day > last) return null;
    const gregorian = newDate(year, month - 1, day);
    return `${gregorian.getFullYear()}-${pad2(gregorian.getMonth() + 1)}-${pad2(gregorian.getDate())}`;
  }

  const iso = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    const date = new Date(`${iso[1]}-${iso[2]}-${iso[3]}T00:00:00`);
    if (Number.isNaN(date.getTime())) return null;
    return `${iso[1]}-${iso[2]}-${iso[3]}`;
  }

  return null;
}

type DateCell = { text: string; iso: string | null };

function readDateCell(value: ExcelJS.CellValue): DateCell {
  if (value instanceof Date) return { text: "", iso: isoFromExcelDate(value) };
  const text = collapseSpace(cellText(value));
  return { text, iso: text === "" ? null : parseJalaliOrIsoText(text) };
}

function readCodeCell(value: ExcelJS.CellValue): string {
  if (typeof value === "number") {
    const digits = String(Math.trunc(value));
    return digits.length < 10 ? digits.padStart(10, "0") : digits;
  }
  return digitsOnly(normalizeAsciiDigits(cellText(value)));
}

function normalizeMobile(raw: string): string {
  return /^9\d{9}$/.test(raw) ? `0${raw}` : raw;
}

function rowError(row: number, message: string): StudentImportRowError {
  return { row, message };
}

function findHeader(sheet: ExcelJS.Worksheet): { row: ExcelJS.Row; columns: Map<HeaderKey, number> } {
  for (let rowNumber = 1; rowNumber <= Math.min(sheet.rowCount, 10); rowNumber++) {
    const row = sheet.getRow(rowNumber);
    const columns = new Map<HeaderKey, number>();
    row.eachCell({ includeEmpty: false }, (cell, columnNumber) => {
      const text = collapseSpace(normalizeAsciiDigits(cellText(cell.value)));
      for (const [key, header] of Object.entries(HEADERS)) {
        if (text === header && !columns.has(key as HeaderKey)) columns.set(key as HeaderKey, columnNumber);
      }
    });
    if (columns.has("fullName") && columns.has("nationalCode") && columns.has("birthDate")) {
      return { row, columns };
    }
  }
  throw new AppError(400, "INVALID_EXCEL", "ستون‌های قالب پیدا نشدند؛ فایل قالب را دست‌نخورده پر کنید و دوباره تلاش کنید.");
}

export async function parseStudentsWorkbook(buffer: ArrayBuffer): Promise<ParsedWorkbook> {
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(Buffer.from(buffer) as unknown as ExcelJS.Buffer);
  } catch {
    throw new AppError(400, "INVALID_EXCEL", "فایل اکسل معتبر نیست.");
  }
  const sheet = workbook.worksheets[0];
  if (!sheet) throw new AppError(400, "INVALID_EXCEL", "فایل اکسل هیچ برگه‌ای ندارد.");

  const { row: headerRow, columns } = findHeader(sheet);
  const rows: ParsedStudentRow[] = [];
  const errors: StudentImportRowError[] = [];

  for (let rowNumber = headerRow.number + 1; rowNumber <= sheet.rowCount; rowNumber++) {
    if (rows.length >= STUDENT_IMPORT_MAX_ROWS) {
      errors.push(rowError(rowNumber, `تعداد ردیف‌ها بیشتر از ${STUDENT_IMPORT_MAX_ROWS} مجاز نیست.`));
      break;
    }

    const row = sheet.getRow(rowNumber);
    const text = (key: HeaderKey): string => {
      const column = columns.get(key);
      return column === undefined ? "" : collapseSpace(cellText(row.getCell(column).value));
    };
    const date = (key: HeaderKey): DateCell => {
      const column = columns.get(key);
      return column === undefined ? { text: "", iso: null } : readDateCell(row.getCell(column).value);
    };

    const fullName = text("fullName");
    const nationalCode = readCodeCell(columns.has("nationalCode") ? row.getCell(columns.get("nationalCode") as number).value : null);
    const mobile = normalizeMobile(readCodeCell(columns.has("mobile") ? row.getCell(columns.get("mobile") as number).value : null));
    const birthDate = date("birthDate");
    const beltLabel = text("beltLabel");
    const beltCertificateDate = date("beltCertificateDate");
    const insuranceDate = date("insuranceDate");
    const tkdBankChargeDate = date("tkdBankChargeDate");

    if (
      fullName === "" &&
      nationalCode === "" &&
      mobile === "" &&
      birthDate.text === "" &&
      birthDate.iso === null &&
      beltLabel === "" &&
      beltCertificateDate.text === "" &&
      beltCertificateDate.iso === null &&
      insuranceDate.text === "" &&
      insuranceDate.iso === null &&
      tkdBankChargeDate.text === "" &&
      tkdBankChargeDate.iso === null
    ) {
      continue;
    }

    let valid = true;

    if (fullName.length < 3) {
      errors.push(rowError(rowNumber, "نام و نام خانوادگی را کامل وارد کنید."));
      valid = false;
    }
    if (!/^\d{10}$/.test(nationalCode)) {
      errors.push(rowError(rowNumber, "کد ملی باید ۱۰ رقم باشد."));
      valid = false;
    }
    if (!/^09\d{9}$/.test(mobile)) {
      errors.push(rowError(rowNumber, "تلفن همراه باید ۱۱ رقم و با ۰۹ شروع شود."));
      valid = false;
    }
    if (birthDate.iso === null) {
      errors.push(
        rowError(
          rowNumber,
          birthDate.text === ""
            ? "تاریخ تولد را وارد کنید."
            : "تاریخ تولد معتبر نیست؛ تاریخ را شمسی مثل ۱۳۸۰/۰۵/۱۲ وارد کنید.",
        ),
      );
      valid = false;
    }
    if (beltLabel === "") {
      errors.push(rowError(rowNumber, "کمربند را وارد کنید."));
      valid = false;
    }
    for (const [label, cell] of [
      ["تاریخ حکم کمربند", beltCertificateDate],
      ["تاریخ بیمه ورزشی", insuranceDate],
      ["تاریخ شارژ بانک تکواندو", tkdBankChargeDate],
    ] as const) {
      if (cell.text !== "" && cell.iso === null) {
        errors.push(rowError(rowNumber, `${label} معتبر نیست؛ تاریخ را شمسی مثل ۱۳۸۰/۰۵/۱۲ وارد کنید.`));
        valid = false;
      }
    }

    if (valid && birthDate.iso !== null) {
      rows.push({
        row: rowNumber,
        fullName,
        nationalCode,
        mobile,
        birthDate: birthDate.iso,
        beltLabel,
        beltCertificateDate: beltCertificateDate.iso,
        insuranceDate: insuranceDate.iso,
        tkdBankChargeDate: tkdBankChargeDate.iso,
      });
    }
  }

  return { rows, errors };
}

export function beltKey(label: string): string {
  return normalizeAsciiDigits(label).replace(/\s+/g, "").toLowerCase();
}
