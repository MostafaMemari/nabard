import { describe, expect, it } from "vitest";
import { competitions } from "./competitions/mock/competitions";
import { payments } from "./payments/mock/payments";
import { registrations } from "./registrations/mock/registrations";
import { students } from "./students/mock/students";

function isValidNationalCode(code: string): boolean {
  if (!/^\d{10}$/.test(code)) {
    return false;
  }

  const sum = code
    .slice(0, 9)
    .split("")
    .reduce((total, digit, index) => total + Number(digit) * (10 - index), 0);
  const remainder = sum % 11;

  return Number(code[9]) === (remainder < 2 ? remainder : 11 - remainder);
}

describe("mock data", () => {
  it("has the required volume", () => {
    expect(students).toHaveLength(60);
    expect(competitions).toHaveLength(6);
    expect(payments).toHaveLength(12);
    expect(registrations).toHaveLength(31);
  });

  it("uses unique valid national codes", () => {
    const codes = students.map((student) => student.nationalCode);

    expect(new Set(codes).size).toBe(codes.length);
    expect(codes.every(isValidNationalCode)).toBe(true);
  });

  it("spreads students across coaches", () => {
    const coachIds = new Set(students.map((student) => student.coachId));

    expect(coachIds.size).toBeGreaterThanOrEqual(5);
    for (const coachId of coachIds) {
      const count = students.filter((student) => student.coachId === coachId).length;

      expect(count).toBeGreaterThanOrEqual(5);
      expect(count).toBeLessThanOrEqual(20);
    }
  });

  it("covers every status", () => {
    expect(new Set(competitions.map((item) => item.status))).toEqual(new Set(["DRAFT", "PUBLISHED", "CANCELED"]));
    expect(new Set(payments.map((item) => item.status))).toEqual(new Set(["PENDING", "CONFIRMED", "REJECTED"]));
    expect(new Set(registrations.map((item) => item.status))).toEqual(new Set(["PENDING", "APPROVED", "REJECTED"]));
  });

  it("keeps references intact", () => {
    const studentIds = new Set(students.map((student) => student.id));
    const competitionIds = new Set(competitions.map((competition) => competition.id));
    const paymentIds = new Set(payments.map((payment) => payment.id));

    expect(payments.every((payment) => competitionIds.has(payment.competitionId))).toBe(true);
    expect(
      registrations.every(
        (registration) =>
          studentIds.has(registration.studentId) &&
          competitionIds.has(registration.competitionId) &&
          (registration.paymentId === null || paymentIds.has(registration.paymentId)),
      ),
    ).toBe(true);
    expect(new Set(registrations.map((item) => `${item.competitionId}-${item.studentId}`)).size).toBe(registrations.length);
  });
});
