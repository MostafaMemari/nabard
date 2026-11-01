import type { Province } from "@/generated/client";

export type AdminUser = {
  id: string;
  mobile: string;
  fullName: string;
  role: "ADMIN";
  province: Province;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};
