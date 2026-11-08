import { describe, expect, it } from "vitest";
import type { AgeCategory, Belt, WeightClass } from "@/features/base-data";
import type { CompetitionRulesSnapshot } from "@/features/competitions";
import {
  checkEligibility,
  type EligibilityCompetition,
  type EligibilityStudent,
  eligibilityCompetitionFromSnapshot,
  resolveWeightClass,
} from "./eligibility";

const belts: Belt[] = [
  { id: "b-white", code: "white", label: "سفید", level: 1, order: 1, rankType: "COLOR", color: null, colorHex: null, isActive: true },
  { id: "b-yellow", code: "yellow", label: "زرد", level: 2, order: 2, rankType: "COLOR", color: null, colorHex: null, isActive: true },
  { id: "b-green", code: "green", label: "سبز", level: 3, order: 3, rankType: "COLOR", color: null, colorHex: null, isActive: true },
  { id: "b-blue", code: "blue", label: "آبی", level: 4, order: 4, rankType: "COLOR", color: null, colorHex: null, isActive: true },
  { id: "b-dan-1", code: "dan_1", label: "دان ۱", level: 10, order: 5, rankType: "DAN", color: null, colorHex: null, isActive: true },
];

const ageCategory: AgeCategory = {
  id: "cadet",
  code: "cadet",
  label: "نوجوان",
  startDate: "2012-01-01T00:00:00.000Z",
  endDate: "2014-12-31T00:00:00.000Z",
  birthYearStart: 1390,
  birthYearEnd: 1393,
  isActive: true,
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
    isActive: true,
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
    profileStatus: "APPROVED",
    ...overrides,
  };
}

describe("checkEligibility", () => {
  it("rejects a student whose profile is not approved, before any other rule", () => {
    const pending = checkEligibility(student({ profileStatus: "PENDING" }), competition, belts);
    const rejected = checkEligibility(student({ profileStatus: "REJECTED" }), competition, belts);

    expect(pending.eligible).toBe(false);
    expect(rejected.eligible).toBe(false);
    if (!pending.eligible) {
      expect(pending.reason).toBe("پروفایل هنرجو هنوز تأیید نشده است");
    }
  });

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

describe("eligibilityCompetitionFromSnapshot", () => {
  const snapshot: CompetitionRulesSnapshot = {
    ageCategory: {
      id: "cadet",
      code: "cadet",
      label: "نوجوان",
      startDate: "2011-01-01T00:00:00.000Z",
      endDate: "2013-12-31T00:00:00.000Z",
    },
    minBelt: { id: "b-yellow", code: "yellow", label: "زرد", level: 2 },
    maxBelt: { id: "b-blue", code: "blue", label: "آبی", level: 4 },
    weightClasses: [
      { id: "wc-light", label: "-33", min: 0, max: 33, excludeMin: false, excludeMax: true, order: 1 },
      { id: "wc-heavy", label: "+33", min: 33, max: null, excludeMin: false, excludeMax: true, order: 2 },
    ],
  };

  it("builds the rules from the snapshot instead of the live base data", () => {
    const built = eligibilityCompetitionFromSnapshot({ discipline: "KYORUGI", gender: "MALE" }, snapshot, belts);

    expect(built.ageCategory.startDate).toBe("2011-01-01T00:00:00.000Z");
    expect(built.beltIds).toEqual(["b-yellow", "b-green", "b-blue"]);
    expect(built.weightClasses).toHaveLength(2);
    expect(built.weightClasses[0].id).toBe("wc-light");
  });

  it("judges a student by the frozen snapshot dates, not the live category", () => {
    const built = eligibilityCompetitionFromSnapshot({ discipline: "KYORUGI", gender: "MALE" }, snapshot, belts);

    const inside = checkEligibility(student({ birthDate: "2012-06-01T00:00:00.000Z" }), built, belts);
    const outsideLive = checkEligibility(student({ birthDate: "2014-06-01T00:00:00.000Z" }), built, belts);

    expect(inside.eligible).toBe(true);
    expect(outsideLive.eligible).toBe(false);
  });

  it("resolves the weight from the snapshot classes", () => {
    const built = eligibilityCompetitionFromSnapshot({ discipline: "KYORUGI", gender: "MALE" }, snapshot, belts);
    const result = checkEligibility(student({ weightKg: 33 }), built, belts);

    expect(result).toEqual({ eligible: true, weightClass: built.weightClasses[1] });
  });
});

describe("resolveWeightClass", () => {
  it("matches the single class containing the weight", () => {
    const result = resolveWeightClass(35, weightClasses);

    expect(result).toEqual({ kind: "match", weightClass: weightClasses[1] });
  });

  it("honors the exclude boundaries between neighbouring classes", () => {
    const lower = resolveWeightClass(33, weightClasses);
    const upper = resolveWeightClass(37, weightClasses);

    expect(lower).toEqual({ kind: "match", weightClass: weightClasses[1] });
    expect(upper).toEqual({ kind: "match", weightClass: weightClasses[2] });
  });

  it("returns none when the weight falls outside every class", () => {
    expect(resolveWeightClass(20, weightClasses)).toEqual({ kind: "none" });
  });

  it("returns ambiguous when the weight falls in more than one class", () => {
    const overlapping = [weightClass("wc-a", "30-35", 30, 35, { excludeMax: false }), weightClass("wc-b", "35-40", 35, 40)];

    expect(resolveWeightClass(35, overlapping)).toEqual({ kind: "ambiguous" });
  });
});
