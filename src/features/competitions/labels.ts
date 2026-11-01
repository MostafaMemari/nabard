import { type LucideIcon, PersonStandingIcon, SwordsIcon } from "lucide-react";
import type { CompetitionLevel, Discipline } from "./types";

export const disciplineLabels: Record<Discipline, string> = {
  KYORUGI: "کیوروگی",
  POOMSAE: "پومسه",
};

export const disciplineIcons: Record<Discipline, LucideIcon> = {
  KYORUGI: SwordsIcon,
  POOMSAE: PersonStandingIcon,
};

export const competitionLevelLabels: Record<CompetitionLevel, string> = {
  PROVINCIAL: "استانی",
  COUNTY: "شهرستانی",
};

export const competitionStatusTabLabels = {
  DRAFT: "پیش نویس",
  PUBLISHED: "منتشر شده",
  CANCELED: "لغو شده",
} as const;
