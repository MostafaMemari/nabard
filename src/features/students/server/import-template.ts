import { renderWorkbookXlsx } from "@/lib/excel";

const COLUMNS = [
  { header: "نام و نام خانوادگی", width: 26 },
  { header: "کد ملی", width: 16 },
  { header: "تلفن همراه", width: 16 },
  { header: "تاریخ تولد", width: 14, numFmt: "@" },
  { header: "کمربند", width: 12 },
  { header: "تاریخ حکم کمربند", width: 18, numFmt: "@" },
  { header: "تاریخ بیمه ورزشی", width: 18, numFmt: "@" },
  { header: "تاریخ شارژ بانک تکواندو", width: 24, numFmt: "@" },
];

const EXAMPLE_ROW = ["علی رضایی", "0012345678", "09121234567", "1380/05/12", "آبی", "1398/02/10", "", ""];

export async function buildImportTemplate(): Promise<Buffer> {
  return renderWorkbookXlsx([{ name: "هنرجویان", columns: COLUMNS, rows: [EXAMPLE_ROW] }]);
}
