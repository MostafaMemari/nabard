import type { Province } from "@/generated/client";

export type ProvinceSummary = {
  province: Province;
  admins: number;
  coaches: number;
  students: number;
  competitions: number;
  registrations: number;
  pendingPayments: number;
};
