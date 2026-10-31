import { describe, expect, it } from "vitest";
import type { AgeCategory, Belt, WeightClass } from "@/features/base-data";
import { checkEligibility, type EligibilityCompetition, type EligibilityStudent } from "./eligibility";

const belts: Belt[] = [
  { id: "b-white", name: "WHITE", level: 1, order: 1, rankType: "COLOR", color: null, colorHex: null },
  { id: "b-yellow", name: "YELLOW", level: 2, order: 2, rankType: "COLOR", color: null, colorHex: null },
  { id: "b-green", name: "GREEN", level: 3, order: 3, rankType: "COLOR", color: null, colorHex: null },
  { id: "b-blue", name: "BLUE", level: 4, order: 4, rankType: "COLOR", color: null, colorHex: null },
  { id: "b-dan-1", name: "DAN_1", level: 10, order: 5, rankType: "DAN", color: null, colorHex: null },
];

const ageCategory: AgeCategory = {
  id: "cadet",
  name: "CADET",
  startDate: "2012-01-01T00:00:00.000Z",
  endDate: "2014-12-31T00:00:00.000Z",
  birthYearStart: 2012,
  birthYearEnd: 2014,
};

function weightClass(id: string, label: string, min: number, max: number | null, overrides: Partial<WeightClass> = {}): WeightClass {
  return {
    id,
    ageCategoryId: "cadet",
    gender: "MALE",
    label,
    minWeightKg: min,
    maxWeightKg: max,
    order: 1,
    excludeMin: false,
    excludeMax: true,
    ...overrides,
  };
}

const weightClasses: WeightClass[] = [
  weightClass("wc-light", "-33", 30, 33),
  weightClass("wc-middle", "-37", 33, 37),
  weightClass("wc-heavy", "+37", 37, null),
];

const competition: EligibilityCompetition = {
  discipline: "KYORUGI",
  gender: "MALE",
  ageCategory,
  beltIds: ["b-yellow", "b-green", "b-blue"],
  weightClasses,
};

function student(overrides: Partial<EligibilityStudent> = {}): EligibilityStudent {
  return {
    id: "student-1",
    fullName: "علی محمدی",
    gender: "MALE",
    birthDate: "2013-05-10T00:00:00.000Z",
    beltId: "b-green",
    weightKg: 35,
    ...overrides,
  };
}

describe("checkEligibility", () => {
  it("resolves the weight class for an eligible kyorugi student", () => {
    const result = checkEligibility(student(), competition, belts);

    expect(result).toEqual({ eligible: true, weightClass: weightClasses[1] });
  });

  it("rejects a student whose gender does not match", () => {
    const result = checkEligibility(student({ gender: "FEMALE" }), competition, belts);

    expect(result.eligible).toBe(false);
    if (!result.eligible) {
      expect(result.reason).toContain("جنسیت");
    }
  });

  it("rejects a birth date outside the age category", () => {
    const before = checkEligibility(student({ birthDate: "2011-12-31T00:00:00.000Z" }), competition, belts);
    const after = checkEligibility(student({ birthDate: "2015-01-01T00:00:00.000Z" }), competition, belts);

    expect(before.eligible).toBe(false);
    expect(after.eligible).toBe(false);
    if (!before.eligible) {
      expect(before.reason).toContain("بازه سنی");
    }
  });

  it("accepts birth dates on the age category boundaries", () => {
    const first = checkEligibility(student({ birthDate: "2012-01-01T00:00:00.000Z" }), competition, belts);
    const last = checkEligibility(student({ birthDate: "2014-12-31T00:00:00.000Z" }), competition, belts);

    expect(first.eligible).toBe(true);
    expect(last.eligible).toBe(true);
  });

  it("rejects a belt below the minimum allowed belt", () => {
    const result = checkEligibility(student({ beltId: "b-white" }), competition, belts);

    expect(result.eligible).toBe(false);
    if (!result.eligible) {
      expect(result.reason).toContain("کمربند");
    }
  });

  it("rejects a belt above the maximum allowed belt", () => {
    const result = checkEligibility(student({ beltId: "b-dan-1" }), competition, belts);

    expect(result.eligible).toBe(false);
  });

  it("accepts belts on the range boundaries", () => {
    const lowest = checkEligibility(student({ beltId: "b-yellow" }), competition, belts);
    const highest = checkEligibility(student({ beltId: "b-blue" }), competition, belts);

    expect(lowest.eligible).toBe(true);
    expect(highest.eligible).toBe(true);
  });

  it("rejects a kyorugi student without a declared weight", () => {
    const result = checkEligibility(student({ weightKg: null }), competition, belts);

    expect(result.eligible).toBe(false);
    if (!result.eligible) {
      expect(result.reason).toContain("وزن");
    }
  });

  it("rejects a weight below all weight classes", () => {
    const result = checkEligibility(student({ weightKg: 28 }), competition, belts);

    expect(result.eligible).toBe(false);
  });

  it("places a weight on a shared boundary in exactly one weight class", () => {
    const result = checkEligibility(student({ weightKg: 33 }), competition, belts);

    expect(result).toEqual({ eligible: true, weightClass: weightClasses[1] });
  });

  it("rejects a weight that matches two weight classes when boundaries overlap", () => {
    const overlapping: WeightClass[] = [
      weightClass("wc-light", "-33", 30, 33, { excludeMax: false }),
      weightClass("wc-middle", "-37", 33, 37, { excludeMin: false }),
      weightClass("wc-heavy", "+37", 37, null),
    ];
    const result = checkEligibility(student({ weightKg: 33 }), { ...competition, weightClasses: overlapping }, belts);

    expect(result.eligible).toBe(false);
    if (!result.eligible) {
      expect(result.reason).toContain("بیش از یک رده وزنی");
    }
  });

  it("ignores weight for poomsae and resolves no weight class", () => {
    const poomsae: EligibilityCompetition = { ...competition, discipline: "POOMSAE" };
    const result = checkEligibility(student({ weightKg: null }), poomsae, belts);

    expect(result).toEqual({ eligible: true, weightClass: null });
  });

  it("ignores an out-of-range weight for poomsae", () => {
    const poomsae: EligibilityCompetition = { ...competition, discipline: "POOMSAE" };
    const result = checkEligibility(student({ weightKg: 95 }), poomsae, belts);

    expect(result.eligible).toBe(true);
  });
});
