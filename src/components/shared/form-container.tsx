import { cn } from "cn";
import type { ReactNode } from "react";

const variantClasses = {
  auth: "max-w-auth-form",
  standard: "max-w-form",
  student: "max-w-form-sm",
} as const;

export function FormContainer({
  variant = "standard",
  className,
  children,
}: {
  variant?: keyof typeof variantClasses;
  className?: string;
  children: ReactNode;
}) {
  return <div className={cn("mx-auto w-full", variantClasses[variant], className)}>{children}</div>;
}
