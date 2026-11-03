export type Gender = "MALE" | "FEMALE";

export type BeltName =
  | "WHITE"
  | "YELLOW"
  | "GREEN"
  | "BLUE"
  | "RED"
  | "POOM_1"
  | "POOM_2"
  | "POOM_3"
  | "POOM_4"
  | "DAN_1"
  | "DAN_2"
  | "DAN_3"
  | "DAN_4"
  | "DAN_5"
  | "DAN_6"
  | "DAN_7"
  | "DAN_8"
  | "DAN_9"
  | "DAN_10";

export type RankType = "COLOR" | "POOM" | "DAN";

export type AgeCategoryName = "BLOSSOM" | "YOUTH" | "CADET" | "JUNIOR" | "YOUNG" | "SENIOR" | "ULTRA";

export type Belt = {
  id: string;
  name: BeltName;
  level: number;
  order: number | null;
  rankType: RankType;
  color: string | null;
  colorHex: string | null;
};

export type AgeCategory = {
  id: string;
  name: AgeCategoryName;
  startDate: string;
  endDate: string;
  birthYearStart: number | null;
  birthYearEnd: number | null;
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
};
