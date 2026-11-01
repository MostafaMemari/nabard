import type { Province } from "@/generated/client";
import type { SessionRole } from "@/lib/session";

export type AuthUser = {
  id: string;
  role: SessionRole;
  fullName: string;
  province: Province;
  countyId: string | null;
  countyName: string | null;
};
