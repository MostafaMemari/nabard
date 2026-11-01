export type Role = "ADMIN" | "COACH";

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
  province: Province;
  isActive: boolean;
  countyId: string | null;
  countyName: string | null;
  createdAt: string;
  updatedAt: string;
};
