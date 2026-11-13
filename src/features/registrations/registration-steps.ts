import type { PaymentStatus } from "@/features/payments";
import { formatJalaliDateTime } from "@/lib/format";
import type { Registration } from "./types";

export type TimelineStepState = "done" | "current" | "failed" | "upcoming";

export type TimelineStep = { title: string; hint?: string; state: TimelineStepState };

export function buildRegistrationSteps(registration: Registration, paymentStatus: PaymentStatus | null): TimelineStep[] {
  const receiptState: TimelineStepState =
    paymentStatus === null ? "upcoming" : paymentStatus === "PENDING" ? "current" : paymentStatus === "CONFIRMED" ? "done" : "failed";
  const studentState: TimelineStepState =
    receiptState === "done"
      ? registration.status === "PENDING"
        ? "current"
        : registration.status === "APPROVED"
          ? "done"
          : "failed"
      : "upcoming";

  return [
    { title: "ثبت نام ارسال شد", hint: formatJalaliDateTime(new Date(registration.createdAt)), state: "done" },
    {
      title: "بررسی رسید",
      hint:
        paymentStatus === null
          ? "هنوز رسیدی بارگذاری نشده است"
          : paymentStatus === "PENDING"
            ? "در انتظار بررسی مدیریت استان"
            : paymentStatus === "REJECTED"
              ? "رسید رد شد؛ رسید جدید بارگذاری کنید"
              : "رسید تأیید شد",
      state: receiptState,
    },
    {
      title: "بررسی ثبت نام",
      hint: registration.status === "REJECTED" ? (registration.note ?? undefined) : undefined,
      state: studentState,
    },
  ];
}
