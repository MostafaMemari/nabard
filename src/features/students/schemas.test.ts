import { describe, expect, it } from "vitest";
import { createStudentSchema, updateStudentBeltSchema } from "./schemas";

const validStudent = {
  fullName: "سینا مرادی",
  nationalCode: "0123456789",
  birthDate: "2013-05-10T00:00:00.000Z",
  insuranceDate: "",
  tkdBankChargeDate: "",
};

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

  it("accepts any 10 digit national code without a checksum", () => {
    const result = createStudentSchema.safeParse({ ...validStudent, nationalCode: "1234567890" });

    expect(result.success).toBe(true);
  });

  it("strips non digit characters from the national code", () => {
    const result = createStudentSchema.safeParse({ ...validStudent, nationalCode: " 0123-4567-89 " });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.nationalCode).toBe("0123456789");
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

  it("accepts optional insurance and bank charge dates and keeps empty ones empty", () => {
    const result = createStudentSchema.safeParse({
      ...validStudent,
      insuranceDate: "2026-08-01T00:00:00.000Z",
      tkdBankChargeDate: "  ",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.insuranceDate).toBe("2026-08-01T00:00:00.000Z");
      expect(result.data.tkdBankChargeDate).toBe("");
    }
  });

  it("rejects a malformed optional date", () => {
    expect(createStudentSchema.safeParse({ ...validStudent, insuranceDate: "1400/01/01" }).success).toBe(false);
  });

  it("has no gender, belt or weight in the schema", () => {
    const result = createStudentSchema.safeParse({ ...validStudent, gender: "MALE", beltId: "belt-blue", weightKg: 54.5 });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty("gender");
      expect(result.data).not.toHaveProperty("beltId");
      expect(result.data).not.toHaveProperty("weightKg");
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

describe("updateStudentBeltSchema", () => {
  it("accepts a belt id", () => {
    const result = updateStudentBeltSchema.safeParse({ beltId: "belt-green" });

    expect(result.success).toBe(true);
  });

  it("rejects an empty body", () => {
    const result = updateStudentBeltSchema.safeParse({});

    expect(result.success).toBe(false);
  });
});
