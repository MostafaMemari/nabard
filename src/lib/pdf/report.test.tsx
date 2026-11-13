import { describe, expect, it } from "vitest";
import { renderReportPdf } from "./report";

describe("renderReportPdf", () => {
  it("produces a PDF document with Persian content", async () => {
    const buffer = await renderReportPdf({
      title: "گزارش آزمایشی",
      subtitle: "مسابقه قهرمانی استان تهران",
      footerNote: "سامانهٔ مسابقات تکواندو",
      sections: [
        {
          meta: [
            ["تاریخ برگزاری", "۱۴۰۴/۰۸/۱۹"],
            ["تعداد شرکت کننده", "۲"],
          ],
          table: {
            columns: [
              { header: "ردیف", width: 1, align: "center" },
              { header: "نام هنرجو", width: 3 },
              { header: "رده وزنی", width: 1, align: "center" },
            ],
            rows: [
              [1, "علی رضایی", "-54"],
              [2, "حسین محمدی", null],
            ],
          },
        },
        {
          heading: "نمای کلی",
          paragraphs: ["این یک پاراگراف آزمایشی است"],
        },
      ],
    });

    expect(buffer.subarray(0, 5).toString()).toBe("%PDF-");
    expect(buffer.length).toBeGreaterThan(1000);
    expect(buffer.toString("latin1")).toContain("/Lang (fa)");
  });

  it("renders an empty report with only a title", async () => {
    const buffer = await renderReportPdf({ title: "گزارش خالی", sections: [] });

    expect(buffer.subarray(0, 5).toString()).toBe("%PDF-");
  });
});
