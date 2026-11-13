import type { AgeCategory, Belt, Gender, WeightClass } from "@/features/base-data";
import type { CompetitionRulesSnapshot, Discipline } from "@/features/competitions";

export type ProfileStatus = "PENDING" | "APPROVED" | "REJECTED";

export type EligibilityStudent = {
  id: string;
  fullName: string;
  gender: Gender;
  birthDate: string;
  beltId: string;
  weightKg: number | null;
  profileStatus: ProfileStatus;
};

export type EligibilityCompetition = {
  discipline: Discipline;
  gender: Gender;
  ageCategory: AgeCategory;
  beltIds: string[];
  weightClasses: WeightClass[];
};

export type EligibilityResult = { eligible: true; weightClass: WeightClass | null } | { eligible: false; reason: string };

// A published competition is judged by its frozen rules snapshot: the age
// category dates and the min/max belt levels come from the snapshot, the belt
// list is only used to resolve the student's belt level.
export function eligibilityCompetitionFromSnapshot(
  base: { discipline: Discipline; gender: Gender },
  rules: CompetitionRulesSnapshot,
  belts: Belt[],
): EligibilityCompetition {
  const ageCategory: AgeCategory = {
    id: rules.ageCategory.id,
    code: rules.ageCategory.code,
    label: rules.ageCategory.label,
    startDate: rules.ageCategory.startDate,
    endDate: rules.ageCategory.endDate,
    birthYearStart: null,
    birthYearEnd: null,
    isActive: true,
  };

  return {
    discipline: base.discipline,
    gender: base.gender,
    ageCategory,
    beltIds: belts.filter((belt) => belt.level >= rules.minBelt.level && belt.level <= rules.maxBelt.level).map((belt) => belt.id),
    weightClasses: rules.weightClasses.map((weightClass) => ({
      id: weightClass.id,
      ageCategoryId: rules.ageCategory.id,
      gender: base.gender,
      label: weightClass.label,
      minWeightKg: weightClass.min,
      maxWeightKg: weightClass.max,
      order: weightClass.order,
      excludeMin: weightClass.excludeMin,
      excludeMax: weightClass.excludeMax,
      isActive: true,
    })),
  };
}

const REASONS = {
  profile: "پروفایل هنرجو هنوز تأیید نشده است",
  gender: "جنسیت هنرجو با جنسیت مسابقه همخوانی ندارد",
  birthDate: "تاریخ تولد هنرجو در بازه سنی این مسابقه نیست",
  belt: "کمربند هنرجو در بازه کمربندهای مجاز این مسابقه نیست",
  weightRequired: "برای ثبت نام کیوروگی، وزن هنرجو را وارد کنید",
  weightNoMatch: "وزن اعلام شده هنرجو با هیچ یک از رده های وزنی همخوانی ندارد",
  weightAmbiguous: "وزن اعلام شده هنرجو با بیش از یک رده وزنی همخوانی دارد",
} as const;

export type EligibilityOptions = {
  // The eligible-student counters only check age, gender and belt; the weight
  // is declared per registration and must not zero the counter.
  weightOptional?: boolean;
};

function isWeightInClass(weight: number, weightClass: WeightClass): boolean {
  const aboveMin = weightClass.excludeMin ? weight > weightClass.minWeightKg : weight >= weightClass.minWeightKg;

  if (!aboveMin) {
    return false;
  }

  if (weightClass.maxWeightKg === null) {
    return true;
  }

  return weightClass.excludeMax ? weight < weightClass.maxWeightKg : weight <= weightClass.maxWeightKg;
}

export type WeightClassResolution = { kind: "match"; weightClass: WeightClass } | { kind: "none" } | { kind: "ambiguous" };

export function resolveWeightClass(weight: number, weightClasses: WeightClass[]): WeightClassResolution {
  const matches = weightClasses.filter((weightClass) => isWeightInClass(weight, weightClass));

  if (matches.length === 1) {
    return { kind: "match", weightClass: matches[0] };
  }

  return matches.length === 0 ? { kind: "none" } : { kind: "ambiguous" };
}

export function checkEligibility(
  student: EligibilityStudent,
  competition: EligibilityCompetition,
  belts: Belt[],
  options: EligibilityOptions = {},
): EligibilityResult {
  if (student.profileStatus !== "APPROVED") {
    return { eligible: false, reason: REASONS.profile };
  }

  if (student.gender !== competition.gender) {
    return { eligible: false, reason: REASONS.gender };
  }

  const birthTime = new Date(student.birthDate).getTime();
  const startTime = new Date(competition.ageCategory.startDate).getTime();
  const endTime = new Date(competition.ageCategory.endDate).getTime();

  if (birthTime < startTime || birthTime > endTime) {
    return { eligible: false, reason: REASONS.birthDate };
  }

  const studentBelt = belts.find((belt) => belt.id === student.beltId);
  const allowedLevels = competition.beltIds.flatMap((beltId) => {
    const belt = belts.find((item) => item.id === beltId);
    return belt ? [belt.level] : [];
  });

  if (!studentBelt || allowedLevels.length === 0) {
    return { eligible: false, reason: REASONS.belt };
  }

  const minLevel = Math.min(...allowedLevels);
  const maxLevel = Math.max(...allowedLevels);

  if (studentBelt.level < minLevel || studentBelt.level > maxLevel) {
    return { eligible: false, reason: REASONS.belt };
  }

  if (competition.discipline === "POOMSAE") {
    return { eligible: true, weightClass: null };
  }

  const weight = student.weightKg;

  if (weight === null) {
    if (options.weightOptional) {
      return { eligible: true, weightClass: null };
    }

    return { eligible: false, reason: REASONS.weightRequired };
  }

  const resolution = resolveWeightClass(weight, competition.weightClasses);
  if (resolution.kind === "match") {
    return { eligible: true, weightClass: resolution.weightClass };
  }

  return { eligible: false, reason: resolution.kind === "none" ? REASONS.weightNoMatch : REASONS.weightAmbiguous };
}
