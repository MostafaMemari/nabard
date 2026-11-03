import { cn } from "cn";
import type { ReactNode } from "react";

// Plain card shell that holds a loading skeleton or an empty state so list
// states look like the content card they replace.
export function StateCard({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("overflow-hidden rounded-xl border border-border bg-card shadow-card", className)}>{children}</div>;
}
