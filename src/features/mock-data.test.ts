import { describe, expect, it } from "vitest";
import { ageCategories, belts, weightClasses } from "./base-data/mock/base-data";
import { competitions } from "./competitions/mock/competitions";
import { payments } from "./payments/mock/payments";
import { registrations } from "./registrations/mock/registrations";
import { students } from "./students/mock/students";
import { users } from "./users/mock/users";

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
    expect(users.filter((user) => user.role === "COACH")).toHaveLength(8);
    expect(users.filter((user) => user.role === "ADMIN")).toHaveLength(3);
    expect(students).toHaveLength(60);
    expect(competitions).toHaveLength(6);
    expect(payments).toHaveLength(12);
    expect(registrations).toHaveLength(31);
    expect(belts).toHaveLength(19);
    expect(ageCategories).toHaveLength(7);
    expect(new Set(weightClasses.map((item) => item.id)).size).toBe(weightClasses.length);
  });

  it("uses unique valid national codes and mobiles", () => {
    const codes = [...users, ...students].map((item) => item.nationalCode).filter((code): code is string => code !== null);

    expect(new Set(codes).size).toBe(codes.length);
    expect(codes.every(isValidNationalCode)).toBe(true);
    expect(new Set(users.map((user) => user.mobile)).size).toBe(users.length);
  });

  it("spreads students across coaches", () => {
    for (const coach of users.filter((user) => user.role === "COACH")) {
      const count = students.filter((student) => student.coachId === coach.id).length;

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
    const coachIds = new Set(users.filter((user) => user.role === "COACH").map((user) => user.id));
    const studentIds = new Set(students.map((student) => student.id));
    const competitionIds = new Set(competitions.map((competition) => competition.id));
    const paymentIds = new Set(payments.map((payment) => payment.id));
    const beltIds = new Set(belts.map((belt) => belt.id));
    const categoryIds = new Set(ageCategories.map((category) => category.id));
    const weightClassIds = new Set(weightClasses.map((weightClass) => weightClass.id));

    expect(students.every((student) => coachIds.has(student.coachId) && beltIds.has(student.beltId))).toBe(true);
    expect(
      competitions.every(
        (competition) => categoryIds.has(competition.ageCategoryId) && competition.beltIds.every((beltId) => beltIds.has(beltId)),
      ),
    ).toBe(true);
    expect(payments.every((payment) => coachIds.has(payment.coachId) && competitionIds.has(payment.competitionId))).toBe(true);
    expect(
      registrations.every(
        (registration) =>
          coachIds.has(registration.coachId) &&
          studentIds.has(registration.studentId) &&
          competitionIds.has(registration.competitionId) &&
          (registration.paymentId === null || paymentIds.has(registration.paymentId)) &&
          (registration.weightClassId === null || weightClassIds.has(registration.weightClassId)),
      ),
    ).toBe(true);
    expect(new Set(registrations.map((item) => `${item.competitionId}-${item.studentId}`)).size).toBe(registrations.length);
  });
});
