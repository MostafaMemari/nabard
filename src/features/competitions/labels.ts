import type { Discipline } from "./types";

export const disciplineLabels: Record<Discipline, string> = {
  KYORUGI: "کیوروگی",
  POOMSAE: "پومسه",
};

export const competitionStatusTabLabels = {
  DRAFT: "پیش‌نویس",
  PUBLISHED: "منتشر شده",
  CANCELED: "لغو شده",
} as const;
