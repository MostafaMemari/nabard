import type { Gender } from "@/features/base-data";
import { AppError, readFormData } from "@/lib/api";
import type { CurrentUser } from "@/lib/session";
import { beltKey, type ParsedStudentRow, parseStudentsWorkbook, type StudentImportRowError } from "./import-parse";
import type { NewStudentData, StudentRepository } from "./repository";
import { coachGenderMissing, forbidden, requireActiveUser } from "./service";

export type StudentImportResult = {
  imported: number;
  errors: StudentImportRowError[];
};

const FILE_MAX_BYTES = 2 * 1024 * 1024;
const FORM_MAX_BYTES = FILE_MAX_BYTES + 128 * 1024;

export async function readStudentsImportFile(request: Request): Promise<File> {
  const form = await readFormData(request, { maxBytes: FORM_MAX_BYTES });
  const file = form.get("file");

  if (!(file instanceof File)) throw new AppError(400, "VALIDATION_ERROR", "فایل اکسل را بارگذاری کنید");
  if (!file.name.toLowerCase().endsWith(".xlsx")) throw new AppError(400, "INVALID_FILE_TYPE", "فرمت فایل باید xlsx باشد");
  if (file.size > FILE_MAX_BYTES) throw new AppError(413, "PAYLOAD_TOO_LARGE", "حجم فایل بیش از حد مجاز است");

  return file;
}

function isPastIsoDate(iso: string): boolean {
  return new Date(`${iso}T00:00:00`).getTime() < Date.now();
}

export async function importStudents(
  repo: StudentRepository,
  user: CurrentUser,
  targetCoachId: string,
  file: File,
): Promise<StudentImportResult> {
  const identity = await requireActiveUser(repo, user);

  let coachId: string;
  let coachGender: Gender;

  if (identity.role === "COACH") {
    if (targetCoachId !== user.id) throw forbidden();
    if (!identity.gender) throw coachGenderMissing();
    coachId = user.id;
    coachGender = identity.gender;
  } else if (identity.role === "ADMIN") {
    if (identity.province === null) throw forbidden();
    const target = await repo.findUserById(targetCoachId);
    if (!target || target.role !== "COACH" || target.province !== identity.province) {
      throw new AppError(404, "NOT_FOUND", "مربی یافت نشد");
    }
    if (!target.isActive) throw new AppError(400, "VALIDATION_ERROR", "حساب این مربی غیرفعال است");
    if (!target.gender) {
      throw new AppError(400, "VALIDATION_ERROR", "جنسیت این مربی ثبت نشده است؛ ابتدا آن را در پروفایل مربی تکمیل کنید");
    }
    coachId = target.id;
    coachGender = target.gender;
  } else {
    throw forbidden();
  }

  const parsed = await parseStudentsWorkbook(await file.arrayBuffer());
  if (parsed.rows.length === 0 && parsed.errors.length === 0) {
    throw new AppError(400, "VALIDATION_ERROR", "هیچ هنرجویی در فایل پیدا نشد");
  }

  const belts = await repo.findActiveBelts();
  const beltIds = new Map(belts.map((belt) => [beltKey(belt.label), belt.id]));
  const existingCodes = await repo.findExistingNationalCodes([...new Set(parsed.rows.map((row) => row.nationalCode))]);

  const errors: StudentImportRowError[] = [...parsed.errors];
  const seenCodes = new Set<string>();
  const valid: ParsedStudentRow[] = [];

  for (const row of parsed.rows) {
    const rowErrors: string[] = [];
    if (row.fullName.length < 3) rowErrors.push("نام و نام خانوادگی را کامل وارد کنید");
    if (seenCodes.has(row.nationalCode)) rowErrors.push("کد ملی در فایل تکراری است");
    else if (existingCodes.has(row.nationalCode)) rowErrors.push("این کد ملی قبلاً ثبت شده است");
    if (!isPastIsoDate(row.birthDate)) rowErrors.push("تاریخ تولد باید در گذشته باشد");
    if (!beltIds.has(beltKey(row.beltLabel))) rowErrors.push(`کمربند «${row.beltLabel}» معتبر نیست؛ آن را دقیقاً مثل قالب وارد کنید`);
    seenCodes.add(row.nationalCode);

    if (rowErrors.length === 0) {
      valid.push(row);
      continue;
    }
    for (const message of rowErrors) {
      errors.push({ row: row.row, message });
    }
  }

  if (errors.length > 0) return { imported: 0, errors };

  const data: NewStudentData[] = valid.map((row) => ({
    fullName: row.fullName,
    gender: coachGender,
    nationalCode: row.nationalCode,
    birthDate: new Date(`${row.birthDate}T00:00:00`),
    mobile: row.mobile,
    beltCertificateDate: row.beltCertificateDate ? new Date(`${row.beltCertificateDate}T00:00:00`) : null,
    insuranceDate: row.insuranceDate ? new Date(`${row.insuranceDate}T00:00:00`) : null,
    tkdBankChargeDate: row.tkdBankChargeDate ? new Date(`${row.tkdBankChargeDate}T00:00:00`) : null,
    beltId: beltIds.get(beltKey(row.beltLabel)) ?? "",
    coachId,
  }));

  const imported = await repo.createStudents(data);
  return { imported, errors: [] };
}
