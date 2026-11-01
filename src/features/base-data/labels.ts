import type { AgeCategoryName, Gender } from "./types";

export const genderLabels: Record<Gender, string> = {
  MALE: "پسر",
  FEMALE: "دختر",
};

export const ageCategoryLabels: Record<AgeCategoryName, string> = {
  BLOSSOM: "شکوفه",
  YOUTH: "نونهال",
  CADET: "نوجوان",
  JUNIOR: "جوان",
  YOUNG: "امید",
  SENIOR: "بزرگسال",
  ULTRA: "پیشکسوت",
};

const ageCategoryNameById = new Map(Object.keys(ageCategoryLabels).map((name) => [name.toLowerCase(), name as AgeCategoryName]));

export function ageCategoryLabel(id: string): string {
  const name = ageCategoryNameById.get(id);
  return name ? ageCategoryLabels[name] : id;
}
