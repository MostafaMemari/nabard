import { describe, expect, it } from "vitest";
import { normalizeDigits } from "../../lib/format";
import { cancelCompetitionSchema, competitionSchema, createCompetitionSchema, updateCompetitionSchema } from "./schemas";

const valid = {
  title: "مسابقات قهرمانی استان",
  discipline: "KYORUGI",
  gender: "MALE",
  ageCategoryId: "senior",
  beltIds: ["belt-red", "belt-poom_1", "belt-dan_1"],
  level: "PROVINCIAL",
  countyIds: [],
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

describe("createCompetitionSchema", () => {
  it("accepts a valid competition", () => {
    expect(createCompetitionSchema.safeParse(valid).success).toBe(true);
  });

  it("normalizes Persian digits in the fee and the card number", () => {
    const result = createCompetitionSchema.safeParse({
      ...valid,
      feePerStudent: "۳۵۰۰۰۰۰",
      payeeCardNumber: "۶۱۰۴۳۳۷۸۱۲۳۴۵۶۷۸",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.feePerStudent).toBe("3500000");
      expect(result.data.payeeCardNumber).toBe("6104337812345678");
    }
  });

  it("rejects a zero fee with a Persian message", () => {
    const result = createCompetitionSchema.safeParse({ ...valid, feePerStudent: "0" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("هزینه هر هنرجو باید عددی مثبت باشد.");
    }
  });

  it("rejects a card number that is not 16 digits", () => {
    const result = createCompetitionSchema.safeParse({ ...valid, payeeCardNumber: "610433781234567" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("شماره کارت باید ۱۶ رقم باشد.");
    }
  });

  it("rejects an empty discipline with a Persian message", () => {
    const result = createCompetitionSchema.safeParse({ ...valid, discipline: "" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("رشته را انتخاب کنید.");
    }
  });

  it("rejects an empty belt list with a Persian message", () => {
    const result = createCompetitionSchema.safeParse({ ...valid, beltIds: [] });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("حداقل یک کمربند را انتخاب کنید.");
    }
  });

  it("drops the province and status from the body", () => {
    const result = createCompetitionSchema.safeParse({ ...valid, province: "FARS", status: "PUBLISHED" });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty("province");
      expect(result.data).not.toHaveProperty("status");
    }
  });

  it("requires at least one county for a county competition", () => {
    const result = createCompetitionSchema.safeParse({ ...valid, level: "COUNTY" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path[0] === "countyIds")).toBe(true);
    }
  });

  it("accepts a county competition with several counties", () => {
    const result = createCompetitionSchema.safeParse({ ...valid, level: "COUNTY", countyIds: ["county-1", "county-2"] });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.level).toBe("COUNTY");
      expect(result.data.countyIds).toEqual(["county-1", "county-2"]);
    }
  });
});

describe("updateCompetitionSchema", () => {
  it("accepts a partial update", () => {
    expect(updateCompetitionSchema.safeParse({ title: "عنوان تازه" }).success).toBe(true);
  });

  it("rejects an empty update", () => {
    const result = updateCompetitionSchema.safeParse({});

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("اطلاعاتی برای تغییر ارسال نشده است.");
    }
  });
});

describe("cancelCompetitionSchema", () => {
  it("accepts a meaningful reason", () => {
    const result = cancelCompetitionSchema.safeParse({ reason: "  برگزاری مسابقه ممکن نیست.  " });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.reason).toBe("برگزاری مسابقه ممکن نیست.");
    }
  });

  it("rejects an empty or too short reason", () => {
    expect(cancelCompetitionSchema.safeParse({ reason: "" }).success).toBe(false);
    expect(cancelCompetitionSchema.safeParse({ reason: "نه" }).success).toBe(false);
  });

  it("rejects a reason longer than 500 characters", () => {
    expect(cancelCompetitionSchema.safeParse({ reason: "x".repeat(501) }).success).toBe(false);
  });
});
