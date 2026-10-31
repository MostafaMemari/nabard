import { cn } from "cn";
import Link from "next/link";
import type { ReactNode } from "react";

const cardClass = "rounded-xl border border-border bg-card shadow-card";

export function MobileCard({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn(cardClass, "flex flex-col gap-2.5 p-4", className)}>{children}</div>;
}

export function MobileCardLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return (
    <Link
      href={href}
      className={cn(
        cardClass,
        "flex min-h-11 flex-col gap-2.5 p-4 transition-colors duration-150 hover:border-ring/40 active:bg-muted/50",
        className,
      )}
    >
      {children}
    </Link>
  );
}

export function MobileCardTop({
  leading,
  title,
  subtitle,
  end,
}: {
  leading?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  end?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      {leading}
      <div className="min-w-0 flex-1 leading-tight">
        <p className="truncate text-sm font-medium">{title}</p>
        {subtitle ? <p className="text-subtle mt-0.5 truncate text-muted-foreground">{subtitle}</p> : null}
      </div>
      {end}
    </div>
  );
}

export function MobileCardLine({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-subtle shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 truncate text-sm">{value}</span>
    </div>
  );
}

export function MobileCardChips({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-2">{children}</div>;
}

export function MobileCardFooter({ children }: { children: ReactNode }) {
  return <div className="-mx-4 -mb-4 flex items-center justify-between gap-2 border-t border-border px-4 py-2.5">{children}</div>;
}
