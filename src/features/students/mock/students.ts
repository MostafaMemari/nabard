import type { Gender } from "@/features/base-data";
import type { Student } from "../types";

const maleFirstNames = [
  "امیرعلی",
  "محمد",
  "علی",
  "رضا",
  "حسین",
  "مهدی",
  "سعید",
  "پارسا",
  "آرش",
  "سینا",
  "کیان",
  "پویا",
  "نیما",
  "بردیا",
  "سامان",
  "یاسین",
];

const femaleFirstNames = [
  "زهرا",
  "فاطمه",
  "مریم",
  "سارا",
  "نازنین",
  "ریحانه",
  "مهسا",
  "آیدا",
  "شیرین",
  "نگار",
  "هستی",
  "آرمیتا",
  "درسا",
  "رویا",
  "سوگند",
  "الناز",
];

const lastNames = [
  "محمدی",
  "احمدی",
  "کریمی",
  "موسوی",
  "حسینی",
  "رضایی",
  "صادقی",
  "نیک پور",
  "شریفی",
  "کاظمی",
  "رستمی",
  "مرادی",
  "جعفری",
  "قاسمی",
  "اکبری",
  "بهرامی",
  "سلطانی",
  "طاهری",
  "فرهادی",
  "زمانی",
  "نوری",
  "عزیزی",
  "کوهستانی",
  "یزدانی",
];

const birthYears = [2019, 2016, 2013, 2010, 2007, 2000, 1982];
const beltByCategory = ["belt-white", "belt-yellow", "belt-green", "belt-blue", "belt-red", "belt-poom_1", "belt-dan_1"];
const weightBase = [22, 28, 36, 48, 58, 66, 72];

function nationalCode(base: number): string {
  const digits = String(base).padStart(9, "0").slice(0, 9);
  const sum = digits.split("").reduce((total, digit, index) => total + Number(digit) * (10 - index), 0);
  const remainder = sum % 11;

  return `${digits}${remainder < 2 ? remainder : 11 - remainder}`;
}

function birthDate(index: number, categoryIndex: number): string {
  const year = birthYears[categoryIndex];
  const month = (index % 12) + 1;
  const day = (index % 27) + 1;

  return new Date(Date.UTC(year, month - 1, day)).toISOString();
}

export const students: Student[] = Array.from({ length: 60 }, (_, index) => {
  const gender: Gender = index % 2 === 0 ? "MALE" : "FEMALE";
  const categoryIndex = index % 7;
  const nameIndex = Math.floor(index / 2);
  const firstName =
    gender === "MALE" ? maleFirstNames[nameIndex % maleFirstNames.length] : femaleFirstNames[nameIndex % femaleFirstNames.length];
  const lastName = lastNames[nameIndex % lastNames.length];
  const createdAt = `2026-08-${String((index % 28) + 1).padStart(2, "0")}T09:15:00.000Z`;

  return {
    id: `student-${index + 1}`,
    fullName: `${firstName} ${lastName}`,
    gender,
    nationalCode: nationalCode(200000000 + index * 173),
    birthDate: birthDate(index, categoryIndex),
    weightKg: Number((weightBase[categoryIndex] - (gender === "FEMALE" ? 4 : 0) + (index % 5) * 0.5).toFixed(1)),
    beltId: beltByCategory[categoryIndex],
    coachId: `coach-${(index % 8) + 1}`,
    createdAt,
    updatedAt: createdAt,
  };
});
