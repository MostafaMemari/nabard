"use client";

import { cn } from "cn";
import { Loader2Icon } from "lucide-react";

export function ScreenSpinner({ label = "در حال بارگذاری", className }: { label?: string; className?: string }) {
  return (
    <div aria-live="polite" className={cn("flex min-h-40 flex-col items-center justify-center gap-2 text-muted-foreground", className)}>
      <Loader2Icon aria-hidden className="size-6 animate-spin" />
      <span className="text-xs">{label}</span>
    </div>
  );
}
