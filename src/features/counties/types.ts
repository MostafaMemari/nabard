import type { Province } from "@/generated/client";

export type County = {
  id: string;
  province: Province;
  name: string;
};

export type CountyChangeStatus = "PENDING" | "APPROVED" | "REJECTED";

export type CompetitionLevel = "PROVINCIAL" | "COUNTY";
