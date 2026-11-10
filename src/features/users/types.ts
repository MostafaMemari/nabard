import type { Gender } from "@/generated/enums";

export type Role = "ADMIN" | "COACH";

// Minimal target-coach row of the lookup endpoint (id + name only).
export type CoachTarget = {
  id: string;
  fullName: string;
};

export type Province =
  | "TEHRAN"
  | "ISFAHAN"
  | "FARS"
  | "RAZAVI_KHORASAN"
  | "KHUZESTAN"
  | "EAST_AZERBAIJAN"
  | "WEST_AZERBAIJAN"
  | "MAZANDARAN"
  | "GILAN"
  | "KERMAN"
  | "SISTAN_AND_BALUCHESTAN"
  | "GOLESTAN"
  | "ARDABIL"
  | "QOM"
  | "MARKAZI"
  | "HORMOZGAN"
  | "KERMANSHAH"
  | "ALBORZ"
  | "LORESTAN"
  | "HAMADAN"
  | "YAZD"
  | "KOHGILUYEH_AND_BOYER_AHMAD"
  | "CHAHARMAHAL_AND_BAKHTIARI"
  | "NORTH_KHORASAN"
  | "SOUTH_KHORASAN"
  | "ILAM"
  | "BUSHEHR"
  | "ZANJAN"
  | "QAZVIN"
  | "SEMNAN"
  | "KURDISTAN";

export type User = {
  id: string;
  mobile: string;
  fullName: string;
  nationalCode: string | null;
  role: Role;
  gender: Gender | null;
  province: Province;
  isActive: boolean;
  countyId: string | null;
  countyName: string | null;
  createdAt: string;
  updatedAt: string;
};
