import type { CountyChangeStatus } from "@/features/counties";

export type { CountyChangeStatus };

export type CountyChangeRequest = {
  id: string;
  coachId: string;
  coachName: string;
  fromCountyId: string;
  fromCountyName: string;
  toCountyId: string;
  toCountyName: string;
  status: CountyChangeStatus;
  note: string | null;
  decidedAt: string | null;
  createdAt: string;
};
