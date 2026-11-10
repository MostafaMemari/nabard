import type { Province } from "@/generated/client";
import type { ProvinceChangeStatus } from "./server/repository";

export type { ProvinceChangeStatus };

export type ProvinceChangeRequest = {
  id: string;
  studentId: string;
  studentName: string;
  fromCoachId: string;
  fromCoachName: string;
  fromProvince: Province;
  toProvince: Province;
  toCoachId: string;
  toCoachName: string;
  status: ProvinceChangeStatus;
  note: string | null;
  decidedAt: string | null;
  createdAt: string;
};
