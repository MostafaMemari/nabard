import type { Province } from "@/generated/client";

export type ProfileCounts = {
  approved: number;
  pending: number;
  rejected: number;
};

export type TrendPoint = {
  key: string; // "1404-03" (Jalali year-month)
  label: string; // "خرداد"
  year: number; // 1404
  count: number;
};

export type CountyStat = {
  id: string;
  name: string;
  province: Province;
  registrations: number;
  students: number;
};

export type SuperAnalytics = {
  province: Province | null;
  kpis: {
    students: number;
    registrations: number;
    coaches: number;
    competitions: number;
  };
  profiles: ProfileCounts;
  trend: TrendPoint[];
  counties: CountyStat[];
  hiddenCounties: number;
};
