import type { Gender, RankType } from "../../src/features/base-data/types";

export type BeltSeed = {
  id: string;
  code: string;
  label: string;
  level: number;
  order: number;
  rankType: RankType;
  color: string;
  colorHex: string;
};

const beltRows: Array<{ code: string; label: string; level: number; rankType: RankType; color: string; colorHex: string }> = [
  { code: "white", label: "سفید", level: 1, rankType: "COLOR", color: "سفید", colorHex: "#f4f4f5" },
  { code: "yellow", label: "زرد", level: 2, rankType: "COLOR", color: "زرد", colorHex: "#facc15" },
  { code: "green", label: "سبز", level: 3, rankType: "COLOR", color: "سبز", colorHex: "#16a34a" },
  { code: "blue", label: "آبی", level: 4, rankType: "COLOR", color: "آبی", colorHex: "#2563eb" },
  { code: "red", label: "قرمز", level: 5, rankType: "COLOR", color: "قرمز", colorHex: "#dc2626" },
  { code: "poom_1", label: "پوم ۱", level: 6, rankType: "POOM", color: "مشکی", colorHex: "#18181b" },
  { code: "poom_2", label: "پوم ۲", level: 7, rankType: "POOM", color: "مشکی", colorHex: "#18181b" },
  { code: "poom_3", label: "پوم ۳", level: 8, rankType: "POOM", color: "مشکی", colorHex: "#18181b" },
  { code: "poom_4", label: "پوم ۴", level: 9, rankType: "POOM", color: "مشکی", colorHex: "#18181b" },
  { code: "dan_1", label: "دان ۱", level: 10, rankType: "DAN", color: "مشکی", colorHex: "#18181b" },
  { code: "dan_2", label: "دان ۲", level: 11, rankType: "DAN", color: "مشکی", colorHex: "#18181b" },
  { code: "dan_3", label: "دان ۳", level: 12, rankType: "DAN", color: "مشکی", colorHex: "#18181b" },
  { code: "dan_4", label: "دان ۴", level: 13, rankType: "DAN", color: "مشکی", colorHex: "#18181b" },
  { code: "dan_5", label: "دان ۵", level: 14, rankType: "DAN", color: "مشکی", colorHex: "#18181b" },
  { code: "dan_6", label: "دان ۶", level: 15, rankType: "DAN", color: "مشکی", colorHex: "#18181b" },
  { code: "dan_7", label: "دان ۷", level: 16, rankType: "DAN", color: "مشکی", colorHex: "#18181b" },
  { code: "dan_8", label: "دان ۸", level: 17, rankType: "DAN", color: "مشکی", colorHex: "#18181b" },
  { code: "dan_9", label: "دان ۹", level: 18, rankType: "DAN", color: "مشکی", colorHex: "#18181b" },
  { code: "dan_10", label: "دان ۱۰", level: 19, rankType: "DAN", color: "مشکی", colorHex: "#18181b" },
];

export const belts: BeltSeed[] = beltRows.map((belt, index) => ({
  id: `belt-${belt.code}`,
  code: belt.code,
  label: belt.label,
  level: belt.level,
  order: index + 1,
  rankType: belt.rankType,
  color: belt.color,
  colorHex: belt.colorHex,
}));

export type AgeCategorySeed = {
  id: string;
  code: string;
  label: string;
  startDate: string;
  endDate: string;
};

const ageCategoryRows: Array<{ code: string; label: string; birthYearStart: number; birthYearEnd: number }> = [
  { code: "blossom", label: "شکوفه", birthYearStart: 2018, birthYearEnd: 2019 },
  { code: "youth", label: "نونهال", birthYearStart: 2015, birthYearEnd: 2017 },
  { code: "cadet", label: "نوجوان", birthYearStart: 2012, birthYearEnd: 2014 },
  { code: "junior", label: "جوان", birthYearStart: 2009, birthYearEnd: 2011 },
  { code: "young", label: "امید", birthYearStart: 2006, birthYearEnd: 2008 },
  { code: "senior", label: "بزرگسال", birthYearStart: 1990, birthYearEnd: 2005 },
  { code: "ultra", label: "پیشکسوت", birthYearStart: 1975, birthYearEnd: 1989 },
];

export const ageCategories: AgeCategorySeed[] = ageCategoryRows.map((category) => ({
  id: category.code,
  code: category.code,
  label: category.label,
  startDate: `${category.birthYearStart}-01-01T00:00:00.000Z`,
  endDate: `${category.birthYearEnd}-12-31T00:00:00.000Z`,
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

const weightTemplates: Record<string, Record<Gender, WeightTemplate[]>> = {
  blossom: {
    MALE: weightTemplate([17, 20, 23, 26, 29, 32]),
    FEMALE: weightTemplate([17, 20, 23, 26, 29, 32]),
  },
  youth: {
    MALE: weightTemplate([24, 27, 30, 33, 36, 40]),
    FEMALE: weightTemplate([23, 26, 29, 32, 35, 38]),
  },
  cadet: {
    MALE: weightTemplate([33, 37, 41, 45, 49, 53]),
    FEMALE: weightTemplate([29, 33, 37, 41, 44, 47]),
  },
  junior: {
    MALE: weightTemplate([45, 48, 51, 55, 59, 63, 68]),
    FEMALE: weightTemplate([42, 44, 46, 49, 52, 55, 59]),
  },
  young: {
    MALE: weightTemplate([54, 58, 63, 68, 74, 80]),
    FEMALE: weightTemplate([46, 49, 53, 57, 62, 67]),
  },
  senior: {
    MALE: weightTemplate([54, 58, 63, 68, 74, 80, 87]),
    FEMALE: weightTemplate([46, 49, 53, 57, 62, 67, 73]),
  },
  ultra: {
    MALE: weightTemplate([58, 63, 68, 74, 80, 87]),
    FEMALE: weightTemplate([49, 53, 57, 62, 67, 73]),
  },
};

export const weightClasses: WeightClassSeed[] = ageCategories.flatMap((category) =>
  (["MALE", "FEMALE"] as const).flatMap((gender) => {
    const templates = weightTemplates[category.code][gender];

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
