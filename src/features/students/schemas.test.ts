import { describe, expect, it } from "vitest";
import { createStudentSchema, isValidNationalCode, updateStudentSchema } from "./schemas";

const validStudent = {
  fullName: "سینا مرادی",
  gender: "MALE",
  nationalCode: "0123456789",
  birthDate: "2013-05-10T00:00:00.000Z",
  beltId: "belt-blue",
  weightKg: 54.5,
};

describe("isValidNationalCode", () => {
  it("accepts a code with a correct checksum", () => {
    expect(isValidNationalCode("0123456789")).toBe(true);
    expect(isValidNationalCode("0499370899")).toBe(true);
  });

  it("rejects a wrong checksum", () => {
    expect(isValidNationalCode("1234567890")).toBe(false);
    expect(isValidNationalCode("0123456780")).toBe(false);
  });

  it("rejects repeated digits", () => {
    expect(isValidNationalCode("1111111111")).toBe(false);
    expect(isValidNationalCode("0000000000")).toBe(false);
  });

  it("rejects non 10 digit values", () => {
    expect(isValidNationalCode("123456789")).toBe(false);
    expect(isValidNationalCode("12345678901")).toBe(false);
  });
});

describe("createStudentSchema", () => {
  it("accepts a valid student", () => {
    const result = createStudentSchema.safeParse(validStudent);

    expect(result.success).toBe(true);
  });

  it("normalizes Persian digits in the national code", () => {
    const result = createStudentSchema.safeParse({ ...validStudent, nationalCode: "۰۱۲۳۴۵۶۷۸۹" });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.nationalCode).toBe("0123456789");
    }
  });

  it("rejects an invalid national code with a Persian message", () => {
    const result = createStudentSchema.safeParse({ ...validStudent, nationalCode: "1234567890" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("کد ملی وارد شده معتبر نیست.");
    }
  });

  it("rejects a short national code", () => {
    const result = createStudentSchema.safeParse({ ...validStudent, nationalCode: "12345" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("کد ملی باید ۱۰ رقم باشد.");
    }
  });

  it("rejects a future birth date", () => {
    const result = createStudentSchema.safeParse({ ...validStudent, birthDate: "2300-01-01T00:00:00.000Z" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("تاریخ تولد باید یک تاریخ گذشته و معتبر باشد.");
    }
  });

  it("rejects a birth date that is not an ISO date", () => {
    expect(createStudentSchema.safeParse({ ...validStudent, birthDate: "2013" }).success).toBe(false);
    expect(createStudentSchema.safeParse({ ...validStudent, birthDate: "۱۳۹۲/۰۲/۲۰" }).success).toBe(false);
    expect(createStudentSchema.safeParse({ ...validStudent, birthDate: "" }).success).toBe(false);
  });

  it("rejects a weight with more than one decimal", () => {
    const result = createStudentSchema.safeParse({ ...validStudent, weightKg: 54.55 });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("وزن باید یک عدد مثبت با حداکثر یک رقم اعشار باشد.");
    }
  });

  it("rejects a zero or negative weight", () => {
    expect(createStudentSchema.safeParse({ ...validStudent, weightKg: 0 }).success).toBe(false);
    expect(createStudentSchema.safeParse({ ...validStudent, weightKg: -3 }).success).toBe(false);
  });

  it("accepts a missing weight", () => {
    const result = createStudentSchema.safeParse({ ...validStudent, weightKg: null });

    expect(result.success).toBe(true);
  });

  it("rejects an unknown gender with a Persian message", () => {
    const result = createStudentSchema.safeParse({ ...validStudent, gender: "" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("جنسیت را انتخاب کنید.");
    }
  });

  it("drops the coachId from the body", () => {
    const result = createStudentSchema.safeParse({ ...validStudent, coachId: "coach-2" });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty("coachId");
    }
  });
});

describe("updateStudentSchema", () => {
  it("accepts a partial update", () => {
    const result = updateStudentSchema.safeParse({ fullName: "نام تازه", weightKg: null });

    expect(result.success).toBe(true);
  });

  it("rejects an empty update", () => {
    const result = updateStudentSchema.safeParse({});

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("اطلاعاتی برای تغییر ارسال نشده است.");
    }
  });

  it("rejects an invalid national code in the update", () => {
    const result = updateStudentSchema.safeParse({ nationalCode: "1234567890" });

    expect(result.success).toBe(false);
  });
});
