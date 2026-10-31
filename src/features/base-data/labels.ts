import { ageCategories } from "./mock/base-data";
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

export function ageCategoryLabel(id: string): string {
  const category = ageCategories.find((item) => item.id === id);
  return category ? ageCategoryLabels[category.name] : id;
}
