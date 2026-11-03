"use client";

import { cn } from "cn";
import { BadgeCheckIcon, CircleXIcon, HourglassIcon, type LucideIcon } from "lucide-react";
import type { PaymentStatus } from "@/features/payments";
import { buildRegistrationSteps, type TimelineStepState } from "../registration-steps";
import type { Registration } from "../types";

const stepVisuals: Record<TimelineStepState, { icon: LucideIcon | null; className: string }> = {
  done: { icon: BadgeCheckIcon, className: "bg-success-bg text-success" },
  current: { icon: HourglassIcon, className: "bg-primary-subtle text-primary" },
  failed: { icon: CircleXIcon, className: "bg-danger-bg text-danger" },
  upcoming: { icon: null, className: "bg-pending-bg text-pending" },
};

export function RegistrationTimeline({ registration, paymentStatus }: { registration: Registration; paymentStatus: PaymentStatus | null }) {
  const steps = buildRegistrationSteps(registration, paymentStatus);

  return (
    <ol className="flex flex-col sm:grid sm:grid-cols-3 sm:gap-x-8">
      {steps.map((step, index) => {
        const visual = stepVisuals[step.state];
        const last = index === steps.length - 1;

        return (
          <li key={step.title} className="flex gap-3 sm:flex-col sm:gap-0">
            <div className="flex flex-col items-center sm:w-full sm:flex-row sm:gap-3">
              <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full", visual.className)}>
                {visual.icon ? (
                  <visual.icon aria-hidden className="size-4" />
                ) : (
                  <span aria-hidden className="size-1.5 rounded-full bg-current" />
                )}
              </span>
              {last ? null : <span aria-hidden className="my-1 w-px flex-1 bg-border sm:my-0 sm:h-px sm:w-auto" />}
            </div>
            <div className={cn("flex flex-col gap-0.5 sm:mt-2", last ? "pb-0" : "pb-5 sm:pb-0")}>
              <p className="text-sm leading-tight font-medium">{step.title}</p>
              {step.hint ? <p className="text-subtle text-muted-foreground">{step.hint}</p> : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
