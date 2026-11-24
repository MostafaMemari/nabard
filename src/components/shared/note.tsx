import { cn } from "cn";
import type { ReactNode } from "react";

const tones = {
  warning: "bg-warning-bg text-warning",
  primary: "bg-primary-subtle text-primary",
} as const;

export type NoteTone = keyof typeof tones;

// Inline callout inside cards and dialogs: one padding scale, token colors.
export function Note({ tone = "warning", className, children }: { tone?: NoteTone; className?: string; children: ReactNode }) {
  return <p className={cn("text-subtle rounded-lg px-3 py-2.5", tones[tone], className)}>{children}</p>;
}
