export type Gender = "MALE" | "FEMALE";

export type RankType = "COLOR" | "POOM" | "DAN";

export type Belt = {
  id: string;
  code: string;
  label: string;
  level: number;
  order: number | null;
  rankType: RankType;
  color: string | null;
  colorHex: string | null;
  isActive: boolean;
};

export type AgeCategory = {
  id: string;
  code: string;
  label: string;
  startDate: string;
  endDate: string;
  birthYearStart: number | null;
  birthYearEnd: number | null;
  isActive: boolean;
};

export type WeightClass = {
  id: string;
  ageCategoryId: string;
  gender: Gender;
  label: string;
  minWeightKg: number;
  maxWeightKg: number | null;
  order: number;
  excludeMin: boolean;
  excludeMax: boolean;
  isActive: boolean;
};

export type WeightClassSetRow = {
  id?: string;
  label: string;
  minWeightKg: number;
  maxWeightKg: number | null;
  excludeMin: boolean;
  excludeMax: boolean;
};

export type WeightClassSetRowIssue = {
  index: number;
  field: "label" | "minWeightKg" | "maxWeightKg" | "excludeMin" | "excludeMax" | "order";
  message: string;
};

export type WeightClassSetIssue = WeightClassSetRowIssue | { index: null; field: "rows"; message: string };
