import type { StudentDocumentType } from "./types";

export const studentDocumentLabels: Record<StudentDocumentType, string> = {
  PHOTO: "عکس پرسنلی",
  NATIONAL_ID_OR_BIRTH_CERTIFICATE: "کارت ملی یا شناسنامه",
  INSURANCE: "بیمه ورزشی",
  BELT_CERTIFICATE: "مدرک کمربند",
};

export const studentDocumentTypes: StudentDocumentType[] = ["PHOTO", "NATIONAL_ID_OR_BIRTH_CERTIFICATE", "INSURANCE", "BELT_CERTIFICATE"];
