import type { AgeCategoryName, BeltName, Gender, RankType } from "../../src/generated/enums";

export type BeltSeed = {
  id: string;
  name: BeltName;
  level: number;
  order: number;
  rankType: RankType;
  color: string;
  colorHex: string;
};

const beltRows: Array<{ name: BeltName; level: number; rankType: RankType; color: string; colorHex: string }> = [
  { name: "WHITE", level: 1, rankType: "COLOR", color: "سفید", colorHex: "#f4f4f5" },
  { name: "YELLOW", level: 2, rankType: "COLOR", color: "زرد", colorHex: "#facc15" },
  { name: "GREEN", level: 3, rankType: "COLOR", color: "سبز", colorHex: "#16a34a" },
  { name: "BLUE", level: 4, rankType: "COLOR", color: "آبی", colorHex: "#2563eb" },
  { name: "RED", level: 5, rankType: "COLOR", color: "قرمز", colorHex: "#dc2626" },
  { name: "POOM_1", level: 6, rankType: "POOM", color: "مشکی", colorHex: "#18181b" },
  { name: "POOM_2", level: 7, rankType: "POOM", color: "مشکی", colorHex: "#18181b" },
  { name: "POOM_3", level: 8, rankType: "POOM", color: "مشکی", colorHex: "#18181b" },
  { name: "POOM_4", level: 9, rankType: "POOM", color: "مشکی", colorHex: "#18181b" },
  { name: "DAN_1", level: 10, rankType: "DAN", color: "مشکی", colorHex: "#18181b" },
  { name: "DAN_2", level: 11, rankType: "DAN", color: "مشکی", colorHex: "#18181b" },
  { name: "DAN_3", level: 12, rankType: "DAN", color: "مشکی", colorHex: "#18181b" },
  { name: "DAN_4", level: 13, rankType: "DAN", color: "مشکی", colorHex: "#18181b" },
  { name: "DAN_5", level: 14, rankType: "DAN", color: "مشکی", colorHex: "#18181b" },
  { name: "DAN_6", level: 15, rankType: "DAN", color: "مشکی", colorHex: "#18181b" },
  { name: "DAN_7", level: 16, rankType: "DAN", color: "مشکی", colorHex: "#18181b" },
  { name: "DAN_8", level: 17, rankType: "DAN", color: "مشکی", colorHex: "#18181b" },
  { name: "DAN_9", level: 18, rankType: "DAN", color: "مشکی", colorHex: "#18181b" },
  { name: "DAN_10", level: 19, rankType: "DAN", color: "مشکی", colorHex: "#18181b" },
];

export const belts: BeltSeed[] = beltRows.map((belt, index) => ({
  id: `belt-${belt.name.toLowerCase()}`,
  name: belt.name,
  level: belt.level,
  order: index + 1,
  rankType: belt.rankType,
  color: belt.color,
  colorHex: belt.colorHex,
}));

export type AgeCategorySeed = {
  id: string;
  name: AgeCategoryName;
  startDate: string;
  endDate: string;
  birthYearStart: number;
  birthYearEnd: number;
};

const ageCategoryRows: Array<{ name: AgeCategoryName; birthYearStart: number; birthYearEnd: number }> = [
  { name: "BLOSSOM", birthYearStart: 2018, birthYearEnd: 2019 },
  { name: "YOUTH", birthYearStart: 2015, birthYearEnd: 2017 },
  { name: "CADET", birthYearStart: 2012, birthYearEnd: 2014 },
  { name: "JUNIOR", birthYearStart: 2009, birthYearEnd: 2011 },
  { name: "YOUNG", birthYearStart: 2006, birthYearEnd: 2008 },
  { name: "SENIOR", birthYearStart: 1990, birthYearEnd: 2005 },
  { name: "ULTRA", birthYearStart: 1975, birthYearEnd: 1989 },
];

export const ageCategories: AgeCategorySeed[] = ageCategoryRows.map((category) => ({
  id: category.name.toLowerCase(),
  name: category.name,
  startDate: `${category.birthYearStart}-01-01T00:00:00.000Z`,
  endDate: `${category.birthYearEnd}-12-31T00:00:00.000Z`,
  birthYearStart: category.birthYearStart,
  birthYearEnd: category.birthYearEnd,
}));

export type WeightClassSeed = {
  id: string;
  ageCategoryId: string;
  gender: Gender;
  label: string;
  minWeightKg: number;
  maxWeightKg: number | null;
  order: number;
  excludeMin: boolean;
  excludeMax: boolean;
};

type WeightTemplate = { label: string; max: number | null };

function weightTemplate(maxes: number[]): WeightTemplate[] {
  return [...maxes.map((max) => ({ label: `-${max}`, max })), { label: `+${maxes[maxes.length - 1]}`, max: null }];
}

const weightTemplates: Record<AgeCategoryName, Record<Gender, WeightTemplate[]>> = {
  BLOSSOM: {
    MALE: weightTemplate([17, 20, 23, 26, 29, 32]),
    FEMALE: weightTemplate([17, 20, 23, 26, 29, 32]),
  },
  YOUTH: {
    MALE: weightTemplate([24, 27, 30, 33, 36, 40]),
    FEMALE: weightTemplate([23, 26, 29, 32, 35, 38]),
  },
  CADET: {
    MALE: weightTemplate([33, 37, 41, 45, 49, 53]),
    FEMALE: weightTemplate([29, 33, 37, 41, 44, 47]),
  },
  JUNIOR: {
    MALE: weightTemplate([45, 48, 51, 55, 59, 63, 68]),
    FEMALE: weightTemplate([42, 44, 46, 49, 52, 55, 59]),
  },
  YOUNG: {
    MALE: weightTemplate([54, 58, 63, 68, 74, 80]),
    FEMALE: weightTemplate([46, 49, 53, 57, 62, 67]),
  },
  SENIOR: {
    MALE: weightTemplate([54, 58, 63, 68, 74, 80, 87]),
    FEMALE: weightTemplate([46, 49, 53, 57, 62, 67, 73]),
  },
  ULTRA: {
    MALE: weightTemplate([58, 63, 68, 74, 80, 87]),
    FEMALE: weightTemplate([49, 53, 57, 62, 67, 73]),
  },
};

export const weightClasses: WeightClassSeed[] = ageCategories.flatMap((category) =>
  (["MALE", "FEMALE"] as const).flatMap((gender) => {
    const templates = weightTemplates[category.name][gender];

    return templates.map((template, index) => ({
      id: `wc-${category.id}-${gender.toLowerCase()}-${index + 1}`,
      ageCategoryId: category.id,
      gender,
      label: template.label,
      minWeightKg: index === 0 ? 0 : (templates[index - 1].max ?? 0),
      maxWeightKg: template.max,
      order: index + 1,
      excludeMin: false,
      excludeMax: true,
    }));
  }),
);
