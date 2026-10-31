import type { AgeCategory, Belt, Gender, WeightClass } from "@/features/base-data";
import type { Discipline } from "@/features/competitions";

export type EligibilityStudent = {
  id: string;
  fullName: string;
  gender: Gender;
  birthDate: string;
  beltId: string;
  weightKg: number | null;
};

export type EligibilityCompetition = {
  discipline: Discipline;
  gender: Gender;
  ageCategory: AgeCategory;
  beltIds: string[];
  weightClasses: WeightClass[];
};

export type EligibilityResult = { eligible: true; weightClass: WeightClass | null } | { eligible: false; reason: string };

const REASONS = {
  gender: "جنسیت هنرجو با جنسیت مسابقه همخوانی ندارد.",
  birthDate: "تاریخ تولد هنرجو در بازه سنی این مسابقه نیست.",
  belt: "کمربند هنرجو در بازه کمربندهای مجاز این مسابقه نیست.",
  weightRequired: "برای ثبت‌نام کیوروگی باید وزن هنرجو ثبت شده باشد.",
  weightNoMatch: "وزن اعلام‌شده هنرجو با هیچ‌یک از رده‌های وزنی همخوانی ندارد.",
  weightAmbiguous: "وزن اعلام‌شده هنرجو با بیش از یک رده وزنی همخوانی دارد.",
} as const;

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

export function checkEligibility(student: EligibilityStudent, competition: EligibilityCompetition, belts: Belt[]): EligibilityResult {
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
    return { eligible: false, reason: REASONS.weightRequired };
  }

  const matches = competition.weightClasses.filter((weightClass) => isWeightInClass(weight, weightClass));

  if (matches.length === 1) {
    return { eligible: true, weightClass: matches[0] };
  }

  if (matches.length === 0) {
    return { eligible: false, reason: REASONS.weightNoMatch };
  }

  return { eligible: false, reason: REASONS.weightAmbiguous };
}
