import ExcelJS from "exceljs";
import { describe, expect, it, vi } from "vitest";
import type { CurrentUser } from "@/lib/session";
import { analyticsPdfResponse, analyticsXlsxResponse, approvalRatePercent } from "./analytics-export";
import type { AnalyticsRepository } from "./repository";

const superAdmin: CurrentUser = { id: "super-1", role: "SUPER_ADMIN" };

const repository: AnalyticsRepository = {
  findUserById: vi.fn().mockResolvedValue({ id: "super-1", role: "SUPER_ADMIN", isActive: true }),
  countCoaches: vi.fn().mockResolvedValue(12),
  countStudents: vi.fn().mockResolvedValue(340),
  countCompetitions: vi.fn().mockResolvedValue(5),
  countRegistrations: vi.fn().mockResolvedValue(210),
  countProfilesByStatus: vi.fn().mockResolvedValue({ approved: 300, pending: 30, rejected: 10 }),
  findRecentRegistrationDates: vi.fn().mockResolvedValue([]),
  countRegistrationsByCounty: vi.fn().mockResolvedValue([
    { countyId: "c1", count: 120 },
    { countyId: "c2", count: 90 },
  ]),
  countStudentsByCounty: vi.fn().mockResolvedValue([
    { countyId: "c1", count: 200 },
    { countyId: "c2", count: 140 },
  ]),
  findCounties: vi.fn().mockResolvedValue([
    { id: "c1", name: "تهران", province: "TEHRAN" },
    { id: "c2", name: "کرج", province: "ALBORZ" },
  ]),
};

describe("approvalRatePercent", () => {
  it("rounds the approved share and handles empty data", () => {
    expect(approvalRatePercent({ approved: 300, pending: 30, rejected: 10 })).toBe(88);
    expect(approvalRatePercent({ approved: 0, pending: 0, rejected: 0 })).toBe(0);
  });
});

describe("analyticsXlsxResponse", () => {
  it("builds three sheets: overview, trend and counties", async () => {
    const response = await analyticsXlsxResponse(repository, superAdmin, null);

    expect(response.status).toBe(200);
    const buffer = Buffer.from(await response.arrayBuffer());
    expect(buffer.subarray(0, 2).toString()).toBe("PK");

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);

    expect(workbook.worksheets.map((sheet) => sheet.name)).toEqual(["نمای کلی", "روند ثبت‌نام", "شهرستان‌ها"]);

    const overview = workbook.worksheets[0];
    expect(overview.getRow(1).getCell(1).value).toBe("گزارش آماری سامانه");
    const overviewLabels = overview.getColumn(1).values.filter((value) => typeof value === "string");
    expect(overviewLabels).toContain("نرخ تأیید پروفایل‌ها");
    const rateRow = overview.getColumn(1).values.indexOf("نرخ تأیید پروفایل‌ها");
    expect(overview.getRow(rateRow).getCell(2).value).toBe("۸۸٪");

    const counties = workbook.worksheets[2];
    expect(counties.getRow(3).getCell(1).value).toBe("شهرستان");
    expect(counties.getRow(4).getCell(1).value).toBe("تهران");
    expect(counties.getRow(4).getCell(3).value).toBe(120);
  });
});

describe("analyticsPdfResponse", () => {
  it("returns a PDF document", async () => {
    const response = await analyticsPdfResponse(repository, superAdmin, null);
    const buffer = Buffer.from(await response.arrayBuffer());

    expect(response.headers.get("content-type")).toBe("application/pdf");
    expect(buffer.subarray(0, 5).toString()).toBe("%PDF-");
  });
});
