import { cn } from "cn";
import { BadgeCheckIcon, CircleXIcon, HourglassIcon, type LucideIcon } from "lucide-react";
import type { PaymentStatus } from "@/features/payments";
import { formatJalaliDateTime } from "@/lib/format";
import type { Registration } from "../types";

type StepState = "done" | "current" | "failed" | "upcoming";

const stepVisuals: Record<StepState, { icon: LucideIcon | null; className: string }> = {
  done: { icon: BadgeCheckIcon, className: "bg-success-bg text-success" },
  current: { icon: HourglassIcon, className: "bg-primary-subtle text-primary" },
  failed: { icon: CircleXIcon, className: "bg-danger-bg text-danger" },
  upcoming: { icon: null, className: "bg-pending-bg text-pending" },
};

type Step = { title: string; hint?: string; state: StepState };

function buildSteps(registration: Registration, paymentStatus: PaymentStatus | null): Step[] {
  const receiptState: StepState =
    paymentStatus === null ? "upcoming" : paymentStatus === "PENDING" ? "current" : paymentStatus === "CONFIRMED" ? "done" : "failed";
  const studentState: StepState =
    receiptState === "done"
      ? registration.status === "PENDING"
        ? "current"
        : registration.status === "APPROVED"
          ? "done"
          : "failed"
      : "upcoming";

  return [
    { title: "ثبت‌نام ارسال شد", hint: formatJalaliDateTime(new Date(registration.createdAt)), state: "done" },
    {
      title: "بررسی رسید",
      hint:
        paymentStatus === null
          ? "هنوز رسیدی بارگذاری نشده است."
          : paymentStatus === "REJECTED"
            ? "رسید رد شد؛ رسید جدید بارگذاری کنید."
            : undefined,
      state: receiptState,
    },
    { title: "بررسی ثبت‌نام", hint: registration.status === "REJECTED" ? (registration.note ?? undefined) : undefined, state: studentState },
  ];
}

export function RegistrationTimeline({ registration, paymentStatus }: { registration: Registration; paymentStatus: PaymentStatus | null }) {
  const steps = buildSteps(registration, paymentStatus);

  return (
    <ol className="flex flex-col">
      {steps.map((step, index) => {
        const visual = stepVisuals[step.state];
        const last = index === steps.length - 1;

        return (
          <li key={step.title} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full", visual.className)}>
                {visual.icon ? (
                  <visual.icon aria-hidden className="size-4" />
                ) : (
                  <span aria-hidden className="size-1.5 rounded-full bg-current" />
                )}
              </span>
              {last ? null : <span aria-hidden className="my-1 w-px flex-1 bg-border" />}
            </div>
            <div className={cn("flex flex-col gap-0.5", last ? "pb-0" : "pb-5")}>
              <p className="text-sm leading-tight font-medium">{step.title}</p>
              {step.hint ? <p className="text-subtle text-muted-foreground">{step.hint}</p> : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
