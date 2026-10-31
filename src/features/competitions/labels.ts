import { type LucideIcon, PersonStandingIcon, SwordsIcon } from "lucide-react";
import type { Discipline } from "./types";

export const disciplineLabels: Record<Discipline, string> = {
  KYORUGI: "کیوروگی",
  POOMSAE: "پومسه",
};

export const disciplineIcons: Record<Discipline, LucideIcon> = {
  KYORUGI: SwordsIcon,
  POOMSAE: PersonStandingIcon,
};

export const competitionStatusTabLabels = {
  DRAFT: "پیش‌نویس",
  PUBLISHED: "منتشر شده",
  CANCELED: "لغو شده",
} as const;
