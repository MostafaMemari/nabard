import { describe, expect, it } from "vitest";
import { createCompetitionSchema, normalizeDigits } from "./schemas";

const beltLevels = { "belt-white": 1, "belt-green": 3, "belt-blue": 4, "belt-dan_3": 12 };
const schema = createCompetitionSchema(beltLevels);

const valid = {
  title: "مسابقات قهرمانی استان",
  discipline: "KYORUGI",
  gender: "MALE",
  ageCategoryId: "senior",
  minBeltId: "belt-blue",
  maxBeltId: "belt-dan_3",
  feePerStudent: "3500000",
  payeeCardNumber: "6104337812345678",
  payeeCardHolder: "فدراسیون تکواندو استان تهران",
  registrationDeadline: "2026-11-20T20:30:00.000Z",
  eventDate: "2026-12-05T08:00:00.000Z",
};

describe("competition form schema", () => {
  it("accepts a valid competition", () => {
    const result = schema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("rejects a final belt ranked before the initial belt", () => {
    const result = schema.safeParse({ ...valid, minBeltId: "belt-dan_3", maxBeltId: "belt-white" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path[0] === "maxBeltId")).toBe(true);
    }
  });

  it("rejects an event date before the registration deadline", () => {
    const result = schema.safeParse({ ...valid, eventDate: "2026-11-01T08:00:00.000Z" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path[0] === "eventDate")).toBe(true);
    }
  });

  it("normalizes persian digits in the card number", () => {
    const result = schema.safeParse({ ...valid, payeeCardNumber: "۶۱۰۴۳۳۷۸۱۲۳۴۵۶۷۸" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.payeeCardNumber).toBe("6104337812345678");
    }
  });

  it("rejects a card number that is not 16 digits", () => {
    const result = schema.safeParse({ ...valid, payeeCardNumber: "61043378123456" });
    expect(result.success).toBe(false);
  });

  it("normalizes digits in the fee", () => {
    expect(normalizeDigits("۳۵۰,۰۰۰")).toBe("350000");
  });
});
