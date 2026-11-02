import { describe, expect, it } from "vitest";
import { formatJalaliDate, formatMoney, formatNumber, formatRialsAsToman, MONEY_UNIT, toPersianDigits } from "./format";

describe("format", () => {
  it("converts Latin digits to Persian", () => {
    expect(toPersianDigits("1403")).toBe("۱۴۰۳");
  });

  it("formats numbers with Persian digits and separators", () => {
    expect(formatNumber(1234567)).toBe("۱٬۲۳۴٬۵۶۷");
  });

  it("appends the money unit", () => {
    expect(formatMoney(250000)).toBe(`۲۵۰٬۰۰۰ ${MONEY_UNIT}`);
  });

  it("formats Gregorian dates as Jalali", () => {
    expect(formatJalaliDate(new Date(2024, 2, 20))).toBe("۱۴۰۳/۰۱/۰۱");
  });

  it("converts rials to toman", () => {
    expect(formatRialsAsToman(2500000)).toBe(`۲۵۰٬۰۰۰ ${MONEY_UNIT}`);
  });
});
