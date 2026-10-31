import type { Role, User } from "../types";

function nationalCode(base: number): string {
  const digits = String(base).padStart(9, "0").slice(0, 9);
  const sum = digits.split("").reduce((total, digit, index) => total + Number(digit) * (10 - index), 0);
  const remainder = sum % 11;

  return `${digits}${remainder < 2 ? remainder : 11 - remainder}`;
}

const seeds: Array<{ fullName: string; role: Role; active?: boolean }> = [
  { fullName: "حمیدرضا کاظمی", role: "ADMIN" },
  { fullName: "مریم صادقی", role: "ADMIN" },
  { fullName: "علی رستمی", role: "ADMIN" },
  { fullName: "رضا محمدی", role: "COACH" },
  { fullName: "سعید احمدی", role: "COACH" },
  { fullName: "مهدی کریمی", role: "COACH" },
  { fullName: "حسین موسوی", role: "COACH", active: false },
  { fullName: "امیر حسین زاده", role: "COACH" },
  { fullName: "محمد رضایی", role: "COACH" },
  { fullName: "بابک نیک پور", role: "COACH", active: false },
  { fullName: "کامران شریفی", role: "COACH" },
];

const createdAt = "2026-07-15T08:30:00.000Z";

export const users: User[] = seeds.map((seed, index) => {
  const roleIndex = seeds.slice(0, index).filter((item) => item.role === seed.role).length + 1;
  const prefix = seed.role === "ADMIN" ? "admin" : "coach";

  return {
    id: `${prefix}-${roleIndex}`,
    mobile: `0912${String(3100000 + index * 137).padStart(7, "0")}`,
    fullName: seed.fullName,
    nationalCode: nationalCode(100000000 + index * 137),
    role: seed.role,
    province: "TEHRAN",
    isActive: seed.active ?? true,
    createdAt,
    updatedAt: createdAt,
  };
});
