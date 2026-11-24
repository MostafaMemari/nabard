import { ArrowLeftRightIcon, ImageUpIcon, MapPinnedIcon, UserPlusIcon } from "lucide-react";
import { photoChangeStatusKey } from "@/features/photo-changes";
import { provinceChangeStatusKey } from "@/features/province-changes";
import { type RegistrationStatus, registrationStatusKey } from "@/features/students/types";
import { transferStatusKey } from "@/features/transfers";

export type RequestKind = "registration" | "transfer" | "photo" | "province";

export type RequestListRow = {
  key: string;
  kind: RequestKind;
  id: string;
  title: string;
  subtitle: string | null;
  note: string | null;
  photoMissing: boolean;
  createdAt: string | null;
  status: RegistrationStatus;
};

export const kindLabels: Record<RequestKind, string> = {
  registration: "ثبت هنرجو",
  transfer: "انتقال هنرجو",
  photo: "تغییر عکس",
  province: "تغییر استان",
};

export const kindIcons: Record<RequestKind, typeof UserPlusIcon> = {
  registration: UserPlusIcon,
  transfer: ArrowLeftRightIcon,
  photo: ImageUpIcon,
  province: MapPinnedIcon,
};

export function statusKeyOf(kind: RequestKind, status: RegistrationStatus) {
  switch (kind) {
    case "registration":
      return registrationStatusKey(status);
    case "transfer":
      return transferStatusKey(status);
    case "photo":
      return photoChangeStatusKey(status);
    case "province":
      return provinceChangeStatusKey(status);
  }
}
