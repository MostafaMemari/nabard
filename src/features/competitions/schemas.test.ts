import { describe, expect, it } from "vitest";
import { normalizeDigits } from "../../lib/format";
import { competitionSchema } from "./schemas";

const valid = {
  title: "مسابقات قهرمانی استان",
  discipline: "KYORUGI",
  gender: "MALE",
  ageCategoryId: "senior",
  beltIds: ["belt-red", "belt-poom_1", "belt-dan_1"],
  feePerStudent: "3500000",
  payeeCardNumber: "6104337812345678",
  payeeCardHolder: "فدراسیون تکواندو استان تهران",
  registrationDeadline: "2026-11-20T20:30:00.000Z",
  eventDate: "2026-12-05T08:00:00.000Z",
};

describe("competition form schema", () => {
  it("accepts a valid competition", () => {
    const result = competitionSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("requires at least one belt", () => {
    const result = competitionSchema.safeParse({ ...valid, beltIds: [] });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path[0] === "beltIds")).toBe(true);
    }
  });

  it("rejects an event date before the registration deadline", () => {
    const result = competitionSchema.safeParse({ ...valid, eventDate: "2026-11-01T08:00:00.000Z" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path[0] === "eventDate")).toBe(true);
    }
  });

  it("normalizes persian digits in the card number", () => {
    const result = competitionSchema.safeParse({ ...valid, payeeCardNumber: "۶۱۰۴۳۳۷۸۱۲۳۴۵۶۷۸" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.payeeCardNumber).toBe("6104337812345678");
    }
  });

  it("rejects a card number that is not 16 digits", () => {
    const result = competitionSchema.safeParse({ ...valid, payeeCardNumber: "61043378123456" });
    expect(result.success).toBe(false);
  });

  it("normalizes digits in the fee", () => {
    expect(normalizeDigits("۳۵۰,۰۰۰")).toBe("350000");
  });
});
