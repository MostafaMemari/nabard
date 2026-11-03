import { cn } from "cn";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { IconTile } from "./icon-tile";

// The one section card used everywhere: white card, 12px radius, optional
// icon + title + description header and an optional action on the end side.
export function SectionCard({
  title,
  description,
  icon,
  action,
  children,
  className,
}: {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const hasHeader = Boolean(title || description || action);

  return (
    <section className={cn("flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-card md:p-6", className)}>
      {hasHeader ? (
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {icon ? <IconTile icon={icon} /> : null}
            {title || description ? (
              <div className="flex min-w-0 flex-col gap-1">
                {title ? <h2 className="text-base font-semibold">{title}</h2> : null}
                {description ? <p className="text-subtle text-muted-foreground">{description}</p> : null}
              </div>
            ) : null}
          </div>
          {action}
        </div>
      ) : null}
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}
