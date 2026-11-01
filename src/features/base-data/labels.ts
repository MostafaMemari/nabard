import { toPersianDigits } from "@/lib/format";
import type { AgeCategoryName, BeltName, Gender } from "./types";

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

const colorBeltLabels: Partial<Record<BeltName, string>> = {
  WHITE: "سفید",
  YELLOW: "زرد",
  GREEN: "سبز",
  BLUE: "آبی",
  RED: "قرمز",
};

export function beltLabel(name: BeltName): string {
  const colorLabel = colorBeltLabels[name];
  if (colorLabel) {
    return colorLabel;
  }
  const [rank, level] = name.split("_");
  const rankLabel = rank === "POOM" ? "پوم" : "دان";
  return `${rankLabel} ${toPersianDigits(Number(level))}`;
}
