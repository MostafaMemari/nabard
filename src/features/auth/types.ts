import type { Province } from "@/generated/client";
import type { Gender } from "@/generated/enums";
import type { SessionRole } from "@/lib/session";

export type AuthUser = {
  id: string;
  role: SessionRole;
  fullName: string;
  gender: Gender | null;
  province: Province | null;
  countyId: string | null;
  countyName: string | null;
  hasPhoto: boolean;
  // Presigned R2 URL for the coach photo (or the authenticated route for
  // files still in Postgres); null when there is no photo.
  photoUrl: string | null;
};
